from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="ContractorLeads API", description="Calgary Building Permits API for Contractors")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Calgary API Configuration
CALGARY_API_URL = "https://data.calgary.ca/resource/c2es-76ed.json"
CACHE_DURATION = timedelta(hours=1)  # Cache for 1 hour

# Global cache
permits_cache = {
    "data": None,
    "last_updated": None
}

# Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class PermitFilter(BaseModel):
    permit_type: Optional[str] = None
    status: Optional[str] = None
    min_cost: Optional[float] = None
    max_cost: Optional[float] = None
    community: Optional[str] = None
    date_range: Optional[str] = 'all'  # 'all', '7days', '30days', '90days'
    work_class: Optional[str] = None
    contractor_type: Optional[str] = 'all'
    limit: Optional[int] = 1000
    offset: Optional[int] = 0

async def fetch_calgary_permits():
    """Fetch permits from Calgary API with error handling"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Fetch with a reasonable limit to avoid timeouts
            response = await client.get(f"{CALGARY_API_URL}?$limit=2000&$order=applieddate DESC")
            response.raise_for_status()
            data = response.json()
            
            # Clean and validate data
            cleaned_data = []
            for permit in data:
                try:
                    # Ensure required fields exist
                    permit_data = {
                        "permitnum": permit.get("permitnum", ""),
                        "statuscurrent": permit.get("statuscurrent", "Unknown"),
                        "applieddate": permit.get("applieddate", ""),
                        "issueddate": permit.get("issueddate"),
                        "completeddate": permit.get("completeddate"),
                        "permittype": permit.get("permittype", ""),
                        "permittypemapped": permit.get("permittypemapped", ""),
                        "permitclass": permit.get("permitclass", ""),
                        "permitclassgroup": permit.get("permitclassgroup", ""),
                        "permitclassmapped": permit.get("permitclassmapped", ""),
                        "workclass": permit.get("workclass", ""),
                        "workclassgroup": permit.get("workclassgroup", ""),
                        "workclassmapped": permit.get("workclassmapped", ""),
                        "description": permit.get("description", ""),
                        "applicantname": permit.get("applicantname", ""),
                        "contractorname": permit.get("contractorname", ""),
                        "housingunits": permit.get("housingunits", "0"),
                        "estprojectcost": permit.get("estprojectcost", "0"),
                        "totalsqft": permit.get("totalsqft"),
                        "originaladdress": permit.get("originaladdress", ""),
                        "communitycode": permit.get("communitycode", ""),
                        "communityname": permit.get("communityname", ""),
                        "latitude": permit.get("latitude"),
                        "longitude": permit.get("longitude")
                    }
                    
                    # Only include permits with valid coordinates
                    if permit_data["latitude"] and permit_data["longitude"]:
                        cleaned_data.append(permit_data)
                        
                except Exception as e:
                    logging.warning(f"Error processing permit {permit.get('permitnum', 'unknown')}: {e}")
                    continue
            
            logging.info(f"Successfully fetched {len(cleaned_data)} permits from Calgary API")
            return cleaned_data
            
    except httpx.TimeoutException:
        logging.error("Timeout when fetching Calgary permits")
        raise HTTPException(status_code=503, detail="Calgary API timeout")
    except httpx.HTTPError as e:
        logging.error(f"HTTP error when fetching Calgary permits: {e}")
        raise HTTPException(status_code=502, detail="Calgary API error")
    except Exception as e:
        logging.error(f"Unexpected error when fetching Calgary permits: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_cached_permits():
    """Get permits from cache or fetch new data"""
    now = datetime.utcnow()
    
    # Check if cache is valid
    if (permits_cache["data"] is not None and 
        permits_cache["last_updated"] is not None and 
        now - permits_cache["last_updated"] < CACHE_DURATION):
        logging.info("Returning cached permit data")
        return permits_cache["data"]
    
    # Fetch new data
    logging.info("Fetching fresh permit data from Calgary API")
    permits_data = await fetch_calgary_permits()
    
    # Update cache
    permits_cache["data"] = permits_data
    permits_cache["last_updated"] = now
    
    return permits_data

def apply_filters(permits: List[dict], filters: PermitFilter) -> List[dict]:
    """Apply filters to permits data"""
    filtered_permits = permits.copy()
    
    # Filter by permit type
    if filters.permit_type:
        filtered_permits = [p for p in filtered_permits 
                          if filters.permit_type.lower() in p.get("permittype", "").lower()]
    
    # Filter by status
    if filters.status:
        filtered_permits = [p for p in filtered_permits 
                          if p.get("statuscurrent") == filters.status]
    
    # Filter by cost range
    if filters.min_cost is not None:
        filtered_permits = [p for p in filtered_permits 
                          if float(p.get("estprojectcost", 0) or 0) >= filters.min_cost]
    
    if filters.max_cost is not None:
        filtered_permits = [p for p in filtered_permits 
                          if float(p.get("estprojectcost", 0) or 0) <= filters.max_cost]
    
    # Filter by community
    if filters.community:
        filtered_permits = [p for p in filtered_permits 
                          if filters.community.lower() in p.get("communityname", "").lower()]
    
    # Filter by work class
    if filters.work_class:
        filtered_permits = [p for p in filtered_permits 
                          if p.get("workclass") == filters.work_class]
    
    # Filter by date range
    if filters.date_range != 'all':
        now = datetime.utcnow()
        days_map = {'7days': 7, '30days': 30, '90days': 90}
        days = days_map.get(filters.date_range, 0)
        
        if days > 0:
            cutoff_date = now - timedelta(days=days)
            filtered_permits = [p for p in filtered_permits 
                              if p.get("applieddate") and 
                              datetime.fromisoformat(p["applieddate"].replace('T', ' ').replace('.000', '')) >= cutoff_date]
    
    # Apply pagination
    start_idx = filters.offset
    end_idx = start_idx + filters.limit
    
    return filtered_permits[start_idx:end_idx]

# API Routes
@api_router.get("/")
async def root():
    return {"message": "ContractorLeads API - Calgary Building Permits"}

@api_router.get("/permits")
async def get_permits(
    permit_type: Optional[str] = Query(None, description="Filter by permit type"),
    status: Optional[str] = Query(None, description="Filter by permit status"),
    min_cost: Optional[float] = Query(None, description="Minimum project cost"),
    max_cost: Optional[float] = Query(None, description="Maximum project cost"),
    community: Optional[str] = Query(None, description="Filter by community name"),
    date_range: Optional[str] = Query('all', description="Date range filter"),
    work_class: Optional[str] = Query(None, description="Filter by work class"),
    contractor_type: Optional[str] = Query('all', description="Filter by contractor type"),
    limit: Optional[int] = Query(1000, description="Number of permits to return"),
    offset: Optional[int] = Query(0, description="Number of permits to skip")
):
    """Get building permits with optional filtering"""
    try:
        # Get permits data
        permits = await get_cached_permits()
        
        # Create filter object
        filters = PermitFilter(
            permit_type=permit_type,
            status=status,
            min_cost=min_cost,
            max_cost=max_cost,
            community=community,
            date_range=date_range,
            work_class=work_class,
            contractor_type=contractor_type,
            limit=limit,
            offset=offset
        )
        
        # Apply filters
        filtered_permits = apply_filters(permits, filters)
        
        return {
            "permits": filtered_permits,
            "total_count": len(permits),
            "filtered_count": len(filtered_permits),
            "limit": limit,
            "offset": offset,
            "cache_updated": permits_cache["last_updated"].isoformat() if permits_cache["last_updated"] else None
        }
        
    except Exception as e:
        logging.error(f"Error in get_permits: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/permits/{permit_number}")
async def get_permit_by_number(permit_number: str):
    """Get a specific permit by permit number"""
    try:
        permits = await get_cached_permits()
        permit = next((p for p in permits if p.get("permitnum") == permit_number), None)
        
        if not permit:
            raise HTTPException(status_code=404, detail="Permit not found")
        
        return permit
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in get_permit_by_number: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/communities")
async def get_community_analytics():
    """Get analytics data for communities"""
    try:
        permits = await get_cached_permits()
        
        # Calculate community stats
        community_stats = {}
        for permit in permits:
            community = permit.get("communityname", "Unknown")
            if community not in community_stats:
                community_stats[community] = {
                    "count": 0,
                    "total_value": 0,
                    "new_projects": 0,
                    "contractors": set()
                }
            
            community_stats[community]["count"] += 1
            cost = float(permit.get("estprojectcost", 0) or 0)
            community_stats[community]["total_value"] += cost
            
            if permit.get("workclass") == "New":
                community_stats[community]["new_projects"] += 1
            
            if permit.get("contractorname"):
                community_stats[community]["contractors"].add(permit["contractorname"])
        
        # Convert to list and calculate averages
        result = []
        for community, stats in community_stats.items():
            result.append({
                "name": community,
                "count": stats["count"],
                "total_value": stats["total_value"],
                "avg_value": stats["total_value"] / stats["count"] if stats["count"] > 0 else 0,
                "new_projects": stats["new_projects"],
                "unique_contractors": len(stats["contractors"])
            })
        
        # Sort by total value
        result.sort(key=lambda x: x["total_value"], reverse=True)
        
        return {"communities": result[:20]}  # Top 20 communities
        
    except Exception as e:
        logging.error(f"Error in get_community_analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/contractors")
async def get_contractor_analytics():
    """Get analytics data for contractors"""
    try:
        permits = await get_cached_permits()
        
        # Calculate contractor stats
        contractor_stats = {}
        for permit in permits:
            contractor = permit.get("contractorname")
            if not contractor:
                continue
                
            if contractor not in contractor_stats:
                contractor_stats[contractor] = {
                    "count": 0,
                    "total_value": 0,
                    "communities": set()
                }
            
            contractor_stats[contractor]["count"] += 1
            cost = float(permit.get("estprojectcost", 0) or 0)
            contractor_stats[contractor]["total_value"] += cost
            contractor_stats[contractor]["communities"].add(permit.get("communityname", "Unknown"))
        
        # Convert to list and calculate averages
        result = []
        for contractor, stats in contractor_stats.items():
            result.append({
                "name": contractor,
                "count": stats["count"],
                "total_value": stats["total_value"],
                "avg_value": stats["total_value"] / stats["count"] if stats["count"] > 0 else 0,
                "unique_communities": len(stats["communities"])
            })
        
        # Sort by total value
        result.sort(key=lambda x: x["total_value"], reverse=True)
        
        return {"contractors": result[:20]}  # Top 20 contractors
        
    except Exception as e:
        logging.error(f"Error in get_contractor_analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/cache/refresh")
async def refresh_cache():
    """Manually refresh the permits cache"""
    try:
        permits_data = await fetch_calgary_permits()
        permits_cache["data"] = permits_data
        permits_cache["last_updated"] = datetime.utcnow()
        
        return {
            "message": "Cache refreshed successfully",
            "permits_count": len(permits_data),
            "updated_at": permits_cache["last_updated"].isoformat()
        }
        
    except Exception as e:
        logging.error(f"Error refreshing cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Calgary API connectivity
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{CALGARY_API_URL}?$limit=1")
            calgary_api_status = "up" if response.status_code == 200 else "down"
    except:
        calgary_api_status = "down"
    
    return {
        "status": "healthy",
        "calgary_api": calgary_api_status,
        "cache_status": "loaded" if permits_cache["data"] else "empty",
        "cache_updated": permits_cache["last_updated"].isoformat() if permits_cache["last_updated"] else None,
        "timestamp": datetime.utcnow().isoformat()
    }

# Legacy routes for compatibility
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    logger.info("Starting ContractorLeads API")
    # Pre-load permits cache on startup
    try:
        await get_cached_permits()
        logger.info("Successfully pre-loaded permits cache")
    except Exception as e:
        logger.error(f"Failed to pre-load permits cache: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()