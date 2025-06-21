import React from 'react';
import { useLeads } from '../context/LeadsContext';
import { Filter, Search, DollarSign, Calendar, MapPin, Briefcase, X } from 'lucide-react';

const FilterSidebar = () => {
  const { filters, setFilters, getFilteredPermits } = useLeads();
  const filteredPermits = getFilteredPermits();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      permitType: '',
      status: '',
      minCost: '',
      maxCost: '',
      community: '',
      dateRange: 'all',
      workClass: '',
      contractorType: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'all'
  );

  return (
    <div className="h-full bg-white shadow-xl border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
        <p className="text-sm text-slate-600 mt-1">
          {filteredPermits.length} permits match your filters
        </p>
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Contractor Type */}
        <div className="space-y-3">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <span>Target Opportunities</span>
          </label>
          <select
            value={filters.contractorType}
            onChange={(e) => handleFilterChange('contractorType', e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="all">All Opportunities</option>
            <option value="general">General Contractors</option>
            <option value="electrical">Electrical Work</option>
            <option value="plumbing">Plumbing Work</option>
            <option value="hvac">HVAC Work</option>
            <option value="roofing">Roofing Work</option>
            <option value="flooring">Flooring Work</option>
            <option value="supplier">Material Suppliers</option>
          </select>
        </div>

        {/* Project Status */}
        <div className="space-y-3">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <Calendar className="h-4 w-4 text-green-600" />
            <span>Permit Status</span>
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Pre Backfill Phase">Pre Backfill Phase</option>
            <option value="Issued Permit">Issued Permit</option>
            <option value="Pending Plans Review">Pending Review</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Hold">On Hold</option>
          </select>
        </div>

        {/* Permit Type */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">Project Type</label>
          <input
            type="text"
            placeholder="e.g., Single Construction, Commercial"
            value={filters.permitType}
            onChange={(e) => handleFilterChange('permitType', e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Work Class */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">Work Type</label>
          <select
            value={filters.workClass}
            onChange={(e) => handleFilterChange('workClass', e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="">All Work Types</option>
            <option value="New">New Construction</option>
            <option value="Alteration">Alteration/Renovation</option>
            <option value="Addition">Addition</option>
          </select>
        </div>

        {/* Project Cost Range */}
        <div className="space-y-3">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span>Project Cost Range</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Min $"
              value={filters.minCost}
              onChange={(e) => handleFilterChange('minCost', e.target.value)}
              className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <input
              type="number"
              placeholder="Max $"
              value={filters.maxCost}
              onChange={(e) => handleFilterChange('maxCost', e.target.value)}
              className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span>Application Date</span>
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>

        {/* Community */}
        <div className="space-y-3">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <MapPin className="h-4 w-4 text-red-600" />
            <span>Community/Area</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Downtown, Kensington"
            value={filters.community}
            onChange={(e) => handleFilterChange('community', e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-6 border-t border-slate-200 bg-slate-50">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-blue-600">
              {filteredPermits.filter(p => p.workclass === 'New').length}
            </div>
            <div className="text-xs text-slate-600">New Projects</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-green-600">
              ${Math.round(filteredPermits.reduce((sum, p) => sum + (parseFloat(p.estprojectcost) || 0), 0) / 1000000)}M
            </div>
            <div className="text-xs text-slate-600">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;