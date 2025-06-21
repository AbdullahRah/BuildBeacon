#!/usr/bin/env python3
import requests
import json
import time
from datetime import datetime
import os
import sys

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://b0737d94-2f93-4176-a639-daec6151f273.preview.emergentagent.com"
API_BASE_URL = f"{BACKEND_URL}/api"

def print_separator():
    print("\n" + "="*80 + "\n")

def test_health_check():
    """Test the /api/health endpoint"""
    print("\n🔍 Testing Health Check Endpoint...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        response.raise_for_status()
        data = response.json()
        
        print(f"✅ Health Check Status: {response.status_code}")
        print(f"✅ Service Status: {data.get('status')}")
        print(f"✅ Calgary API Status: {data.get('calgary_api')}")
        print(f"✅ Cache Status: {data.get('cache_status')}")
        print(f"✅ Permits Cached: {data.get('permits_cached')}")
        
        if data.get('calgary_api') != 'up':
            print("⚠️ WARNING: Calgary API is not accessible!")
            
        return True, data
    except Exception as e:
        print(f"❌ Health Check Failed: {str(e)}")
        return False, None

def test_permits_endpoint():
    """Test the /api/permits endpoint with various filters"""
    print("\n🔍 Testing Permits Endpoint...")
    
    # Test cases for permits endpoint
    test_cases = [
        {"name": "No filters", "params": {"limit": 2000}, "expected_min_count": 1},
        {"name": "Status filter", "params": {"status": "Issued Permit", "limit": 100}, "expected_min_count": 1},
        {"name": "Community filter", "params": {"community": "DOWNTOWN", "limit": 100}, "expected_min_count": 1},
        {"name": "Cost range filter", "params": {"min_cost": 100000, "max_cost": 500000, "limit": 100}, "expected_min_count": 1},
        {"name": "Date range filter", "params": {"date_range": "30days", "limit": 100}, "expected_min_count": 1},
        {"name": "Work class filter", "params": {"work_class": "New", "limit": 100}, "expected_min_count": 1},
        {"name": "Pagination", "params": {"limit": 10, "offset": 5}, "expected_min_count": 1},
        {"name": "Combined filters", "params": {"community": "DOWNTOWN", "min_cost": 100000, "limit": 100}, "expected_min_count": 0}
    ]
    
    results = []
    success_count = 0
    
    for test_case in test_cases:
        try:
            print(f"\n🔍 Testing: {test_case['name']}")
            start_time = time.time()
            response = requests.get(f"{API_BASE_URL}/permits", params=test_case["params"])
            response.raise_for_status()
            data = response.json()
            end_time = time.time()
            
            # Verify response structure
            if "permits" not in data:
                print(f"❌ Missing 'permits' key in response")
                results.append({"test": test_case["name"], "success": False, "error": "Missing 'permits' key"})
                continue
                
            # Verify permit count
            permit_count = len(data["permits"])
            if permit_count < test_case["expected_min_count"]:
                print(f"❌ Expected at least {test_case['expected_min_count']} permits, got {permit_count}")
                results.append({"test": test_case["name"], "success": False, "error": f"Expected at least {test_case['expected_min_count']} permits, got {permit_count}"})
                continue
                
            # Verify response time
            response_time = end_time - start_time
            
            print(f"✅ Status Code: {response.status_code}")
            print(f"✅ Permits Count: {permit_count}")
            print(f"✅ Total Count: {data.get('total_count', 'N/A')}")
            print(f"✅ Filtered Count: {data.get('filtered_count', 'N/A')}")
            print(f"✅ Response Time: {response_time:.2f} seconds")
            
            # Verify filter application
            if "status" in test_case["params"] and permit_count > 0:
                status_match = all(p.get("statuscurrent") == test_case["params"]["status"] for p in data["permits"])
                print(f"✅ Status Filter Applied Correctly: {status_match}")
                
            if "community" in test_case["params"] and permit_count > 0:
                community_param = test_case["params"]["community"].lower()
                community_match = all(community_param in p.get("communityname", "").lower() for p in data["permits"])
                print(f"✅ Community Filter Applied Correctly: {community_match}")
                
            if "min_cost" in test_case["params"] and permit_count > 0:
                min_cost = test_case["params"]["min_cost"]
                min_cost_match = all(float(p.get("estprojectcost", 0) or 0) >= min_cost for p in data["permits"])
                print(f"✅ Min Cost Filter Applied Correctly: {min_cost_match}")
                
            if "max_cost" in test_case["params"] and permit_count > 0:
                max_cost = test_case["params"]["max_cost"]
                max_cost_match = all(float(p.get("estprojectcost", 0) or 0) <= max_cost for p in data["permits"])
                print(f"✅ Max Cost Filter Applied Correctly: {max_cost_match}")
                
            if "work_class" in test_case["params"] and permit_count > 0:
                work_class_match = all(p.get("workclass") == test_case["params"]["work_class"] for p in data["permits"])
                print(f"✅ Work Class Filter Applied Correctly: {work_class_match}")
            
            # Save first permit number for individual permit test
            if test_case["name"] == "No filters" and permit_count > 0:
                first_permit_number = data["permits"][0].get("permitnum")
                print(f"✅ Sample Permit Number: {first_permit_number}")
                
            results.append({
                "test": test_case["name"], 
                "success": True, 
                "count": permit_count,
                "response_time": response_time
            })
            success_count += 1
            
        except Exception as e:
            print(f"❌ Test Failed: {str(e)}")
            results.append({"test": test_case["name"], "success": False, "error": str(e)})
    
    print(f"\n✅ {success_count}/{len(test_cases)} Permit Tests Passed")
    
    # Get a permit number for individual permit test
    try:
        response = requests.get(f"{API_BASE_URL}/permits", params={"limit": 1})
        response.raise_for_status()
        data = response.json()
        if data.get("permits") and len(data["permits"]) > 0:
            sample_permit_number = data["permits"][0].get("permitnum")
            return True, {"results": results, "sample_permit_number": sample_permit_number}
        else:
            return True, {"results": results, "sample_permit_number": None}
    except:
        return True, {"results": results, "sample_permit_number": None}

def test_individual_permit(permit_number=None):
    """Test the /api/permits/{permit_number} endpoint"""
    print("\n🔍 Testing Individual Permit Endpoint...")
    
    if not permit_number:
        # Try to get a permit number
        try:
            response = requests.get(f"{API_BASE_URL}/permits", params={"limit": 1})
            response.raise_for_status()
            data = response.json()
            if data.get("permits") and len(data["permits"]) > 0:
                permit_number = data["permits"][0].get("permitnum")
            else:
                print("❌ No permits available to test individual permit endpoint")
                return False, None
        except Exception as e:
            print(f"❌ Failed to get a permit number: {str(e)}")
            return False, None
    
    try:
        print(f"🔍 Testing permit number: {permit_number}")
        response = requests.get(f"{API_BASE_URL}/permits/{permit_number}")
        response.raise_for_status()
        data = response.json()
        
        print(f"✅ Status Code: {response.status_code}")
        print(f"✅ Permit Number: {data.get('permitnum')}")
        print(f"✅ Status: {data.get('statuscurrent')}")
        print(f"✅ Community: {data.get('communityname')}")
        
        # Test invalid permit number
        invalid_permit = "INVALID123456"
        print(f"\n🔍 Testing invalid permit number: {invalid_permit}")
        invalid_response = requests.get(f"{API_BASE_URL}/permits/{invalid_permit}")
        if invalid_response.status_code == 404:
            print(f"✅ Invalid Permit Handling: 404 Not Found")
        else:
            print(f"❌ Invalid Permit Handling: Expected 404, got {invalid_response.status_code}")
        
        return True, data
    except Exception as e:
        print(f"❌ Individual Permit Test Failed: {str(e)}")
        return False, None

def test_analytics_endpoints():
    """Test the analytics endpoints"""
    print("\n🔍 Testing Analytics Endpoints...")
    
    endpoints = [
        {"name": "Communities Analytics", "url": f"{API_BASE_URL}/analytics/communities"},
        {"name": "Contractors Analytics", "url": f"{API_BASE_URL}/analytics/contractors"}
    ]
    
    results = []
    success_count = 0
    
    for endpoint in endpoints:
        try:
            print(f"\n🔍 Testing: {endpoint['name']}")
            start_time = time.time()
            response = requests.get(endpoint["url"])
            response.raise_for_status()
            data = response.json()
            end_time = time.time()
            
            response_time = end_time - start_time
            
            print(f"✅ Status Code: {response.status_code}")
            
            if "communities" in data:
                print(f"✅ Communities Count: {len(data['communities'])}")
                print(f"✅ Total Communities: {data.get('total_communities', 'N/A')}")
                if data['communities'] and len(data['communities']) > 0:
                    top_community = data['communities'][0]
                    print(f"✅ Top Community: {top_community.get('name')} (Count: {top_community.get('count')}, Value: ${top_community.get('total_value', 0):,.2f})")
            
            if "contractors" in data:
                print(f"✅ Contractors Count: {len(data['contractors'])}")
                print(f"✅ Total Contractors: {data.get('total_contractors', 'N/A')}")
                if data['contractors'] and len(data['contractors']) > 0:
                    top_contractor = data['contractors'][0]
                    print(f"✅ Top Contractor: {top_contractor.get('name')} (Count: {top_contractor.get('count')}, Value: ${top_contractor.get('total_value', 0):,.2f})")
            
            print(f"✅ Response Time: {response_time:.2f} seconds")
            
            results.append({
                "test": endpoint["name"], 
                "success": True, 
                "response_time": response_time
            })
            success_count += 1
            
        except Exception as e:
            print(f"❌ Test Failed: {str(e)}")
            results.append({"test": endpoint["name"], "success": False, "error": str(e)})
    
    print(f"\n✅ {success_count}/{len(endpoints)} Analytics Tests Passed")
    return success_count == len(endpoints), {"results": results}

def test_cache_refresh():
    """Test the /api/cache/refresh endpoint"""
    print("\n🔍 Testing Cache Refresh Endpoint...")
    
    try:
        start_time = time.time()
        response = requests.post(f"{API_BASE_URL}/cache/refresh")
        response.raise_for_status()
        data = response.json()
        end_time = time.time()
        
        response_time = end_time - start_time
        
        print(f"✅ Status Code: {response.status_code}")
        print(f"✅ Message: {data.get('message')}")
        print(f"✅ Permits Count: {data.get('permits_count')}")
        print(f"✅ Updated At: {data.get('updated_at')}")
        print(f"✅ Response Time: {response_time:.2f} seconds")
        
        return True, data
    except Exception as e:
        print(f"❌ Cache Refresh Test Failed: {str(e)}")
        return False, None

def test_summary_stats():
    """Test the /api/stats/summary endpoint"""
    print("\n🔍 Testing Summary Stats Endpoint...")
    
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE_URL}/stats/summary")
        response.raise_for_status()
        data = response.json()
        end_time = time.time()
        
        response_time = end_time - start_time
        
        print(f"✅ Status Code: {response.status_code}")
        print(f"✅ Total Permits: {data.get('total_permits')}")
        print(f"✅ Total Value: ${data.get('total_value', 0):,.2f}")
        print(f"✅ Active Permits: {data.get('active_permits')}")
        print(f"✅ Recent Permits: {data.get('recent_permits')}")
        print(f"✅ Unique Communities: {data.get('unique_communities')}")
        print(f"✅ Unique Contractors: {data.get('unique_contractors')}")
        print(f"✅ Avg Project Value: ${data.get('avg_project_value', 0):,.2f}")
        print(f"✅ Response Time: {response_time:.2f} seconds")
        
        return True, data
    except Exception as e:
        print(f"❌ Summary Stats Test Failed: {str(e)}")
        return False, None

def run_all_tests():
    """Run all API tests"""
    print_separator()
    print("🚀 STARTING BUILDBEACON API TESTS")
    print(f"🔗 API Base URL: {API_BASE_URL}")
    print_separator()
    
    test_results = {}
    
    # Test health check
    health_success, health_data = test_health_check()
    test_results["health_check"] = {"success": health_success, "data": health_data}
    print_separator()
    
    # Test permits endpoint
    permits_success, permits_data = test_permits_endpoint()
    test_results["permits"] = {"success": permits_success, "data": permits_data}
    print_separator()
    
    # Test individual permit
    sample_permit_number = permits_data.get("sample_permit_number") if permits_data else None
    individual_permit_success, individual_permit_data = test_individual_permit(sample_permit_number)
    test_results["individual_permit"] = {"success": individual_permit_success, "data": individual_permit_data}
    print_separator()
    
    # Test analytics endpoints
    analytics_success, analytics_data = test_analytics_endpoints()
    test_results["analytics"] = {"success": analytics_success, "data": analytics_data}
    print_separator()
    
    # Test cache refresh
    cache_success, cache_data = test_cache_refresh()
    test_results["cache_refresh"] = {"success": cache_success, "data": cache_data}
    print_separator()
    
    # Test summary stats
    stats_success, stats_data = test_summary_stats()
    test_results["summary_stats"] = {"success": stats_success, "data": stats_data}
    print_separator()
    
    # Print summary
    print("\n📊 TEST SUMMARY")
    print("--------------")
    all_success = True
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result["success"] else "❌ FAILED"
        print(f"{status} - {test_name}")
        if not result["success"]:
            all_success = False
    
    print_separator()
    if all_success:
        print("🎉 ALL TESTS PASSED! The BuildBeacon API is working correctly.")
    else:
        print("⚠️ SOME TESTS FAILED. Please check the logs for details.")
    print_separator()
    
    return test_results

if __name__ == "__main__":
    run_all_tests()