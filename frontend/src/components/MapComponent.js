import React, { useState, useEffect } from 'react';
import { MapPin, Layers, ZoomIn, ZoomOut, RotateCcw, Loader, Globe, Building } from 'lucide-react';

const MapComponent = ({ permits, selectedPermit, onPermitSelect, loading }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 51.0447, lng: -114.0719 }); // Calgary center
  const [zoom, setZoom] = useState(11);
  const [mapStyle, setMapStyle] = useState('default');
  const [viewMode, setViewMode] = useState('calgary'); // 'calgary' or 'alberta'

  // Calgary bounds
  const calgaryBounds = {
    north: 51.18,
    south: 50.84,
    east: -113.85,
    west: -114.27
  };

  // Alberta bounds
  const albertaBounds = {
    north: 60.0,
    south: 49.0,
    east: -110.0,
    west: -120.0
  };

  // Calculate bounds for all permits
  const getMapBounds = () => {
    if (permits.length === 0) return null;
    
    const lats = permits.map(p => parseFloat(p.latitude)).filter(lat => !isNaN(lat));
    const lngs = permits.map(p => parseFloat(p.longitude)).filter(lng => !isNaN(lng));
    
    if (lats.length === 0 || lngs.length === 0) return null;
    
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };
  };

  const fitMapToPermits = () => {
    const bounds = getMapBounds();
    if (bounds) {
      setMapCenter({ 
        lat: (bounds.north + bounds.south) / 2, 
        lng: (bounds.east + bounds.west) / 2 
      });
      setZoom(10);
      setViewMode('calgary');
    }
  };

  const switchToAlbertaView = () => {
    setMapCenter({ lat: 54.5, lng: -115.0 }); // Alberta center
    setZoom(6);
    setViewMode('alberta');
  };

  const switchToCalgaryView = () => {
    setMapCenter({ lat: 51.0447, lng: -114.0719 }); // Calgary center
    setZoom(11);
    setViewMode('calgary');
  };

  const getPermitColor = (permit) => {
    switch (permit.statuscurrent) {
      case 'Pre Backfill Phase':
      case 'Issued Permit':
        return 'bg-green-500';
      case 'Pending Plans Review':
        return 'bg-yellow-500';
      case 'Completed':
        return 'bg-blue-500';
      case 'Cancelled':
        return 'bg-red-500';
      case 'Hold':
        return 'bg-purple-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getPermitSize = (permit) => {
    const cost = parseFloat(permit.estprojectcost) || 0;
    if (cost > 1000000) return 'w-6 h-6';
    if (cost > 500000) return 'w-5 h-5';
    if (cost > 100000) return 'w-4 h-4';
    return 'w-3 h-3';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const convertCoordinatesToScreen = (lat, lng) => {
    const bounds = viewMode === 'alberta' ? albertaBounds : calgaryBounds;
    
    // Apply zoom factor to bounds
    const zoomFactor = zoom / 10; // Base zoom level
    const centerLat = mapCenter.lat;
    const centerLng = mapCenter.lng;
    
    // Calculate zoomed bounds
    const latRange = (bounds.north - bounds.south) / zoomFactor;
    const lngRange = (bounds.east - bounds.west) / zoomFactor;
    
    const zoomedBounds = {
      north: centerLat + latRange / 2,
      south: centerLat - latRange / 2,
      east: centerLng + lngRange / 2,
      west: centerLng - lngRange / 2
    };
    
    // Normalize coordinates to 0-1 range with proper scaling
    const normalizedLat = (lat - zoomedBounds.south) / (zoomedBounds.north - zoomedBounds.south);
    const normalizedLng = (lng - zoomedBounds.west) / (zoomedBounds.east - zoomedBounds.west);
    
    // Convert to screen percentage (0-100%) with padding
    const padding = 5; // 5% padding on each side
    const x = padding + (normalizedLng * (100 - 2 * padding));
    const y = padding + ((1 - normalizedLat) * (100 - 2 * padding)); // Flip Y because screen coordinates are inverted
    
    return { x, y };
  };

  const renderPermitPins = () => {
    return permits.map((permit, index) => {
      const lat = parseFloat(permit.latitude);
      const lng = parseFloat(permit.longitude);
      
      // Skip permits without valid coordinates
      if (isNaN(lat) || isNaN(lng)) return null;
      
      // Convert lat/lng to screen coordinates
      const { x, y } = convertCoordinatesToScreen(lat, lng);
      
      // Skip pins that would be outside our view
      if (x < 0 || x > 100 || y < 0 || y > 100) return null;
      
      return (
        <div
          key={permit.permitnum}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-125 z-10 ${
            selectedPermit?.permitnum === permit.permitnum ? 'scale-150 z-20' : ''
          }`}
          style={{ left: `${x}%`, top: `${y}%` }}
          onClick={() => onPermitSelect(permit)}
        >
          {/* Pin */}
          <div className={`${getPermitColor(permit)} ${getPermitSize(permit)} rounded-full border-2 border-white shadow-lg`}>
          </div>
          
          {/* Hover Info */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white p-3 rounded-lg shadow-xl border border-slate-200 min-w-64 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
            <div className="text-sm font-medium text-slate-800 mb-1">
              {permit.originaladdress}
            </div>
            <div className="text-xs text-slate-600 mb-2">
              {permit.contractorname || 'No Contractor Listed'}
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-green-600 font-medium">
                {formatCurrency(permit.estprojectcost)}
              </span>
              <span className={`px-2 py-1 rounded text-white text-xs ${getPermitColor(permit)}`}>
                {permit.statuscurrent}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Applied: {permit.applieddate ? new Date(permit.applieddate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      );
    }).filter(Boolean); // Remove null entries
  };

  const renderCalgaryOutline = () => {
    if (viewMode !== 'calgary') return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Calgary city outline and features */}
        <svg className="w-full h-full">
          <defs>
            <pattern id="cityPattern" patternUnits="userSpaceOnUse" width="6" height="6">
              <rect width="6" height="6" fill="#f8fafc"/>
              <circle cx="3" cy="3" r="0.5" fill="#cbd5e1" opacity="0.4"/>
            </pattern>
            <pattern id="riverPattern" patternUnits="userSpaceOnUse" width="8" height="8">
              <rect width="8" height="8" fill="#dbeafe"/>
              <path d="M0,4 Q4,2 8,4 Q4,6 0,4" fill="#93c5fd" opacity="0.6"/>
            </pattern>
          </defs>
          
          {/* Calgary city boundary - more accurate shape */}
          <path
            d="M 20,25 Q 30,20 45,25 L 75,30 Q 85,35 85,50 L 82,70 Q 75,85 65,85 L 35,82 Q 20,75 18,60 L 20,40 Z"
            fill="url(#cityPattern)"
            stroke="#64748b"
            strokeWidth="2"
            opacity="0.5"
          />
          
          {/* Bow River - more detailed path */}
          <path
            d="M 15,55 Q 25,50 35,52 Q 45,54 55,50 Q 65,46 75,50 Q 80,52 85,48"
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            opacity="0.7"
          />
          <text x="42" y="47" fontSize="7" fill="#1e40af" fontWeight="bold">Bow River</text>
          
          {/* Elbow River */}
          <path
            d="M 45,65 Q 50,60 52,52 Q 54,45 58,40"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            opacity="0.6"
          />
          <text x="55" y="62" fontSize="6" fill="#2563eb">Elbow River</text>
          
          {/* Downtown core */}
          <rect
            x="48"
            y="48"
            width="8"
            height="6"
            fill="#475569"
            opacity="0.6"
            rx="1"
          />
          <text x="52" y="52" fontSize="6" fill="#ffffff" fontWeight="bold" textAnchor="middle">Downtown</text>
          
          {/* Major neighborhoods with better labels */}
          <circle cx="35" cy="35" r="4" fill="#f59e0b" opacity="0.3" stroke="#d97706" strokeWidth="1" />
          <text x="35" y="30" fontSize="8" fill="#92400e" fontWeight="bold" textAnchor="middle">Northwest</text>
          <text x="35" y="42" fontSize="6" fill="#92400e" textAnchor="middle">Kensington, Hillhurst</text>
          
          <circle cx="68" cy="35" r="4" fill="#f59e0b" opacity="0.3" stroke="#d97706" strokeWidth="1" />
          <text x="68" y="30" fontSize="8" fill="#92400e" fontWeight="bold" textAnchor="middle">Northeast</text>
          <text x="68" y="42" fontSize="6" fill="#92400e" textAnchor="middle">Airport, Redstone</text>
          
          <circle cx="35" cy="70" r="4" fill="#f59e0b" opacity="0.3" stroke="#d97706" strokeWidth="1" />
          <text x="35" y="65" fontSize="8" fill="#92400e" fontWeight="bold" textAnchor="middle">Southwest</text>
          <text x="35" y="77" fontSize="6" fill="#92400e" textAnchor="middle">Marda Loop, Altadore</text>
          
          <circle cx="68" cy="70" r="4" fill="#f59e0b" opacity="0.3" stroke="#d97706" strokeWidth="1" />
          <text x="68" y="65" fontSize="8" fill="#92400e" fontWeight="bold" textAnchor="middle">Southeast</text>
          <text x="68" y="77" fontSize="6" fill="#92400e" textAnchor="middle">Inglewood, Seton</text>
          
          {/* Major landmarks */}
          <circle cx="50" cy="46" r="2" fill="#dc2626" opacity="0.8" />
          <text x="50" y="43" fontSize="6" fill="#dc2626" fontWeight="bold" textAnchor="middle">Calgary Tower</text>
          
          <circle cx="47" cy="58" r="2" fill="#16a34a" opacity="0.8" />
          <text x="47" y="63" fontSize="6" fill="#16a34a" textAnchor="middle">Stampede Grounds</text>
          
          <circle cx="60" cy="45" r="2" fill="#7c3aed" opacity="0.8" />
          <text x="65" y="45" fontSize="6" fill="#7c3aed">YYC Airport</text>
          
          {/* Calgary label */}
          <text x="52" y="18" fontSize="14" fill="#374151" fontWeight="bold" textAnchor="middle">Calgary</text>
          <text x="52" y="92" fontSize="8" fill="#6b7280" textAnchor="middle">Zoom: {zoom}x • {permits.length} Building Permits</text>
        </svg>
      </div>
    );
  };

  const renderAlbertaOutline = () => {
    if (viewMode !== 'alberta') return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <pattern id="provincePattern" patternUnits="userSpaceOnUse" width="12" height="12">
              <rect width="12" height="12" fill="#f1f5f9"/>
              <circle cx="6" cy="6" r="0.5" fill="#94a3b8" opacity="0.2"/>
            </pattern>
            <pattern id="mountainPattern" patternUnits="userSpaceOnUse" width="15" height="15">
              <rect width="15" height="15" fill="#f8fafc"/>
              <polygon points="7.5,3 12,12 3,12" fill="#9ca3af" opacity="0.3"/>
            </pattern>
            <pattern id="prairiePattern" patternUnits="userSpaceOnUse" width="10" height="10">
              <rect width="10" height="10" fill="#fefbeb"/>
              <path d="M0,5 Q5,3 10,5" stroke="#fbbf24" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          
          {/* Alberta province boundary - more accurate shape */}
          <path
            d="M 15,8 L 85,8 L 85,15 Q 87,25 85,35 L 85,75 Q 83,85 80,92 L 15,92 L 15,75 Q 12,50 15,25 Z"
            fill="url(#provincePattern)"
            stroke="#64748b"
            strokeWidth="2"
            opacity="0.4"
          />
          
          {/* Rocky Mountains (western edge) */}
          <path
            d="M 15,20 Q 20,25 18,35 Q 22,45 20,55 Q 25,65 22,75 Q 20,85 18,92"
            fill="url(#mountainPattern)"
            stroke="#6b7280"
            strokeWidth="1"
            opacity="0.5"
          />
          <text x="12" y="50" fontSize="7" fill="#6b7280" fontWeight="bold" transform="rotate(-90, 12, 50)">Rocky Mountains</text>
          
          {/* Prairies */}
          <rect x="25%" y="30%" width="60%" height="50%" fill="url(#prairiePattern)" opacity="0.3"/>
          <text x="55" y="60" fontSize="8" fill="#92400e" textAnchor="middle">Alberta Prairies</text>
          
          {/* Major rivers */}
          <path
            d="M 30,20 Q 45,30 55,25 Q 70,20 80,30"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            opacity="0.5"
          />
          <text x="55" y="23" fontSize="6" fill="#2563eb" textAnchor="middle">North Saskatchewan River</text>
          
          <path
            d="M 35,65 Q 50,70 65,65 Q 75,60 82,65"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            opacity="0.5"
          />
          <text x="58" y="68" fontSize="6" fill="#2563eb" textAnchor="middle">South Saskatchewan River</text>
          
          {/* Edmonton */}
          <circle
            cx="45"
            cy="35"
            r="4"
            fill="#6366f1"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.8"
          />
          <text x="45" y="32" fontSize="9" fill="#374151" fontWeight="bold" textAnchor="middle">Edmonton</text>
          <text x="45" y="43" fontSize="6" fill="#4f46e5" textAnchor="middle">Provincial Capital</text>
          <text x="45" y="49" fontSize="5" fill="#6b7280" textAnchor="middle">Pop: 1.4M</text>
          
          {/* Calgary - highlighted as main focus */}
          <circle
            cx="50"
            cy="65"
            r="5"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.9"
          />
          <circle
            cx="50"
            cy="65"
            r="8"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.6"
            className="animate-pulse"
          />
          <text x="50" y="61" fontSize="10" fill="#374151" fontWeight="bold" textAnchor="middle">Calgary</text>
          <text x="50" y="74" fontSize="6" fill="#dc2626" textAnchor="middle">Economic Center</text>
          <text x="50" y="80" fontSize="5" fill="#6b7280" textAnchor="middle">Pop: 1.6M • {permits.length} Permits</text>
          
          {/* Red Deer */}
          <circle
            cx="47"
            cy="50"
            r="2"
            fill="#8b5cf6"
            stroke="#ffffff"
            strokeWidth="1"
          />
          <text x="47" y="47" fontSize="7" fill="#374151" fontWeight="bold" textAnchor="middle">Red Deer</text>
          <text x="47" y="55" fontSize="5" fill="#7c3aed" textAnchor="middle">Central Alberta</text>
          
          {/* Fort McMurray */}
          <circle
            cx="55"
            cy="20"
            r="2"
            fill="#059669"
            stroke="#ffffff"
            strokeWidth="1"
          />
          <text x="55" y="17" fontSize="7" fill="#374151" fontWeight="bold" textAnchor="middle">Fort McMurray</text>
          <text x="55" y="25" fontSize="5" fill="#059669" textAnchor="middle">Oil Sands</text>
          
          {/* Lethbridge */}
          <circle
            cx="48"
            cy="78"
            r="2"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="1"
          />
          <text x="48" y="75" fontSize="6" fill="#374151" fontWeight="bold" textAnchor="middle">Lethbridge</text>
          <text x="48" y="83" fontSize="5" fill="#d97706" textAnchor="middle">Agriculture Hub</text>
          
          {/* Grande Prairie */}
          <circle
            cx="35"
            cy="25"
            r="2"
            fill="#06b6d4"
            stroke="#ffffff"
            strokeWidth="1"
          />
          <text x="35" y="22" fontSize="6" fill="#374151" fontWeight="bold" textAnchor="middle">Grande Prairie</text>
          <text x="35" y="30" fontSize="5" fill="#0891b2" textAnchor="middle">Peace Country</text>
          
          {/* Highway lines */}
          <path
            d="M 45,35 Q 48,50 50,65"
            fill="none"
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.4"
          />
          <text x="46" y="52" fontSize="5" fill="#6b7280">Hwy 2</text>
          
          <path
            d="M 35,65 Q 42,65 50,65 Q 58,65 65,65"
            fill="none"
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.4"
          />
          <text x="50" y="62" fontSize="5" fill="#6b7280">Trans-Canada Hwy</text>
          
          {/* Alberta label */}
          <text x="50" y="15" fontSize="16" fill="#374151" fontWeight="bold" textAnchor="middle">Alberta</text>
          <text x="50" y="95" fontSize="7" fill="#6b7280" textAnchor="middle">Zoom: {zoom}x • Canada's Energy Province</text>
          
          {/* Compass rose */}
          <g transform="translate(75, 85)">
            <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#64748b" strokeWidth="1" opacity="0.9"/>
            <polygon points="0,-6 2,0 0,6 -2,0" fill="#ef4444"/>
            <text x="0" y="-10" fontSize="6" fill="#374151" textAnchor="middle" fontWeight="bold">N</text>
            <text x="0" y="16" fontSize="4" fill="#6b7280" textAnchor="middle">BuildBeacon</text>
          </g>
          
          {/* Provincial facts */}
          <text x="15" y="12" fontSize="6" fill="#6b7280">Area: 661,848 km²</text>
          <text x="15" y="18" fontSize="6" fill="#6b7280">Population: 4.6M</text>
        </svg>
      </div>
    );
  };

  return (
    <div className="relative h-full bg-slate-100 overflow-hidden">
      {/* Map Container */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-blue-50 to-slate-200">
        {/* Background terrain */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="terrainGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
              <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.1"/>
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#terrainGrid)" />
            
            {/* Terrain features based on view */}
            {viewMode === 'alberta' && (
              <>
                {/* Rocky Mountains representation */}
                <rect x="0%" y="0%" width="20%" height="100%" fill="url(#mountainPattern)" opacity="0.3"/>
                {/* Prairies */}
                <rect x="20%" y="0%" width="80%" height="100%" fill="#fef3c7" opacity="0.2"/>
              </>
            )}
            
            {viewMode === 'calgary' && (
              <>
                {/* City glow effect */}
                <circle cx="50%" cy="50%" r="30%" fill="url(#cityGlow)"/>
              </>
            )}
          </svg>
        </div>

        {/* Geographic Outlines */}
        {renderCalgaryOutline()}
        {renderAlbertaOutline()}

        {/* Map Area with Permit Pins */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-40 rounded-lg">
                <div className="text-center">
                  <div className="relative mb-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur opacity-75 animate-pulse"></div>
                    <Loader className="relative h-8 w-8 text-orange-600 animate-spin mx-auto" />
                  </div>
                  <p className="text-sm text-slate-700 font-medium">
                    Updating {viewMode === 'calgary' ? 'Calgary' : 'Alberta'} map...
                  </p>
                </div>
              </div>
            )}
            
            {/* View mode indicator with zoom level */}
            <div className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 shadow-lg">
              <div className="flex items-center space-x-2 mb-2">
                {viewMode === 'calgary' ? (
                  <Building className="h-4 w-4 text-orange-600" />
                ) : (
                  <Globe className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-sm font-medium text-slate-700">
                  {viewMode === 'calgary' ? 'Calgary View' : 'Alberta View'}
                </span>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <div>Zoom: {zoom}x</div>
                <div>Center: {mapCenter.lat.toFixed(3)}, {mapCenter.lng.toFixed(3)}</div>
                {permits.length > 0 && (
                  <div className="text-orange-600 font-medium">{permits.length} permits visible</div>
                )}
              </div>
            </div>
            
            {/* Render Permit Pins */}
            {renderPermitPins()}
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
        {/* View Mode Toggle */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 overflow-hidden">
          <button
            onClick={switchToCalgaryView}
            className={`p-3 transition-all duration-300 border-b border-slate-200 ${
              viewMode === 'calgary' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                : 'hover:bg-orange-50 text-slate-600 hover:text-orange-600'
            }`}
            title="Calgary View"
          >
            <Building className="h-4 w-4" />
          </button>
          <button
            onClick={switchToAlbertaView}
            className={`p-3 transition-all duration-300 ${
              viewMode === 'alberta' 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                : 'hover:bg-blue-50 text-slate-600 hover:text-blue-600'
            }`}
            title="Alberta View"
          >
            <Globe className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 overflow-hidden">
          <button
            onClick={() => {
              const newZoom = Math.min(zoom + 2, 20);
              setZoom(newZoom);
              console.log(`Zoom in: ${zoom} -> ${newZoom}`);
            }}
            className="p-3 hover:bg-orange-50 transition-colors border-b border-slate-200 group"
            title={`Zoom In (Current: ${zoom}x)`}
          >
            <ZoomIn className="h-4 w-4 text-slate-600 group-hover:text-orange-600" />
          </button>
          <button
            onClick={() => {
              const newZoom = Math.max(zoom - 2, 1);
              setZoom(newZoom);
              console.log(`Zoom out: ${zoom} -> ${newZoom}`);
            }}
            className="p-3 hover:bg-orange-50 transition-colors border-b border-slate-200 group"
            title={`Zoom Out (Current: ${zoom}x)`}
          >
            <ZoomOut className="h-4 w-4 text-slate-600 group-hover:text-orange-600" />
          </button>
          <button
            onClick={fitMapToPermits}
            className="p-3 hover:bg-orange-50 transition-colors group"
            title="Fit to Permits"
          >
            <RotateCcw className="h-4 w-4 text-slate-600 group-hover:text-orange-600" />
          </button>
        </div>

        {/* Map Style Toggle */}
        <button
          onClick={() => setMapStyle(mapStyle === 'default' ? 'satellite' : 'default')}
          className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-white/20 hover:bg-slate-50 transition-colors"
          title="Toggle Map Style"
        >
          <Layers className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 z-30">
        <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center">
          <MapPin className="h-4 w-4 text-orange-600 mr-1" />
          BuildBeacon Legend
        </h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
            <span className="text-xs text-slate-600">Active/Issued ({permits.filter(p => ['Pre Backfill Phase', 'Issued Permit'].includes(p.statuscurrent)).length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
            <span className="text-xs text-slate-600">Under Review ({permits.filter(p => p.statuscurrent === 'Pending Plans Review').length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
            <span className="text-xs text-slate-600">Completed ({permits.filter(p => p.statuscurrent === 'Completed').length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
            <span className="text-xs text-slate-600">Cancelled ({permits.filter(p => p.statuscurrent === 'Cancelled').length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full shadow-sm"></div>
            <span className="text-xs text-slate-600">On Hold ({permits.filter(p => p.statuscurrent === 'Hold').length})</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">Pin size = Project value</p>
          <p className="text-xs font-medium text-slate-700">
            {permits.length} permits • {viewMode === 'calgary' ? 'Calgary' : 'Alberta'} view
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <span className="text-xs text-orange-600 font-medium">Real-time data</span>
          </div>
        </div>
      </div>

      {/* No Permits Message */}
      {permits.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-white/20 text-center max-w-md">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-orange-400 rounded-full blur opacity-25"></div>
              <MapPin className="relative h-12 w-12 text-orange-600 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No Permits Found</h3>
            <p className="text-slate-600 mb-4">
              Try adjusting your filters to see more results in {viewMode === 'calgary' ? 'Calgary' : 'Alberta'}
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <span>BuildBeacon • Real-time data</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;