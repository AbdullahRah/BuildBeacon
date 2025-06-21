import React, { useState, useEffect } from 'react';
import { MapPin, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const MapComponent = ({ permits, selectedPermit, onPermitSelect }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 51.0447, lng: -114.0719 }); // Calgary center
  const [zoom, setZoom] = useState(11);
  const [mapStyle, setMapStyle] = useState('default');

  // Calculate bounds for all permits
  const getMapBounds = () => {
    if (permits.length === 0) return null;
    
    const lats = permits.map(p => parseFloat(p.latitude));
    const lngs = permits.map(p => parseFloat(p.longitude));
    
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
    }
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
    }).format(amount);
  };

  return (
    <div className="relative h-full bg-slate-100 overflow-hidden">
      {/* Map Container */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300">
        {/* Simulated Map Grid */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Calgary Area Simulation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full max-w-4xl max-h-3xl">
            {/* Render Permit Pins */}
            {permits.map((permit, index) => {
              const lat = parseFloat(permit.latitude);
              const lng = parseFloat(permit.longitude);
              
              // Convert lat/lng to screen coordinates (simplified)
              const x = ((lng + 114.5) / 0.8) * 100; // Rough conversion for Calgary area
              const y = 100 - ((lat - 50.8) / 0.5) * 100;
              
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
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white p-3 rounded-lg shadow-xl border border-slate-200 min-w-64 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="text-sm font-medium text-slate-800 mb-1">
                      {permit.originaladdress}
                    </div>
                    <div className="text-xs text-slate-600 mb-2">
                      {permit.contractorname || 'No Contractor Listed'}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-green-600 font-medium">
                        {formatCurrency(permit.estprojectcost || 0)}
                      </span>
                      <span className={`px-2 py-1 rounded text-white text-xs ${getPermitColor(permit)}`}>
                        {permit.statuscurrent}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
        {/* Zoom Controls */}
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => setZoom(Math.min(zoom + 1, 18))}
            className="p-3 hover:bg-slate-50 transition-colors border-b border-slate-200"
          >
            <ZoomIn className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 1, 1))}
            className="p-3 hover:bg-slate-50 transition-colors border-b border-slate-200"
          >
            <ZoomOut className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={fitMapToPermits}
            className="p-3 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Map Style Toggle */}
        <button
          onClick={() => setMapStyle(mapStyle === 'default' ? 'satellite' : 'default')}
          className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Layers className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-30">
        <h3 className="text-sm font-medium text-slate-800 mb-3">Permit Status</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-slate-600">Active/Issued</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-slate-600">Under Review</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-slate-600">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-slate-600">Cancelled</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">Pin size = Project value</p>
        </div>
      </div>

      {/* No Permits Message */}
      {permits.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-white p-8 rounded-lg shadow-lg border border-slate-200 text-center">
            <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No Permits Found</h3>
            <p className="text-slate-600">Try adjusting your filters to see more results</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;