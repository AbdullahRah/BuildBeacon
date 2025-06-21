import React, { useState } from 'react';
import MapComponent from './MapComponent';
import FilterSidebar from './FilterSidebar';
import PermitDetails from './PermitDetails';
import StatsOverview from './StatsOverview';
import { useLeads } from '../context/LeadsContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const { getFilteredPermits } = useLeads();
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const filteredPermits = getFilteredPermits();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Filter Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-300 relative z-20`}>
        <div className={`h-full ${sidebarCollapsed ? 'hidden' : 'block'}`}>
          <FilterSidebar />
        </div>
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute top-4 -right-3 bg-white shadow-lg rounded-full p-1.5 border border-slate-200 hover:bg-slate-50 transition-colors z-30"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats Overview */}
        <div className="bg-white border-b border-slate-200 p-4">
          <StatsOverview permits={filteredPermits} />
        </div>

        {/* Map and Details */}
        <div className="flex-1 flex">
          {/* Map */}
          <div className={`${selectedPermit ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
            <MapComponent 
              permits={filteredPermits}
              selectedPermit={selectedPermit}
              onPermitSelect={setSelectedPermit}
            />
          </div>

          {/* Permit Details Panel */}
          {selectedPermit && (
            <div className="w-1/3 border-l border-slate-200 bg-white">
              <PermitDetails 
                permit={selectedPermit}
                onClose={() => setSelectedPermit(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;