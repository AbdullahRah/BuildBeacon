import React, { useState } from 'react';
import { useLeads } from '../context/LeadsContext';
import { BarChart3, TrendingUp, MapPin, Building, DollarSign, Users, Calendar, Target } from 'lucide-react';

const Analytics = () => {
  const { permits, savedLeads, contactedLeads } = useLeads();
  const [timeRange, setTimeRange] = useState('90days');

  const getFilteredPermits = () => {
    if (timeRange === 'all') return permits;
    
    const now = new Date();
    const days = timeRange === '30days' ? 30 : timeRange === '90days' ? 90 : 365;
    const cutoffDate = new Date(now.setDate(now.getDate() - days));
    
    return permits.filter(permit => {
      const appliedDate = new Date(permit.applieddate);
      return appliedDate >= cutoffDate;
    });
  };

  const calculateCommunityStats = () => {
    const filteredPermits = getFilteredPermits();
    const communityStats = {};
    
    filteredPermits.forEach(permit => {
      const community = permit.communityname;
      if (!communityStats[community]) {
        communityStats[community] = {
          count: 0,
          totalValue: 0,
          avgValue: 0,
          newProjects: 0,
          contractors: new Set()
        };
      }
      
      communityStats[community].count++;
      communityStats[community].totalValue += parseFloat(permit.estprojectcost) || 0;
      if (permit.workclass === 'New') {
        communityStats[community].newProjects++;
      }
      if (permit.contractorname) {
        communityStats[community].contractors.add(permit.contractorname);
      }
    });
    
    Object.keys(communityStats).forEach(community => {
      communityStats[community].avgValue = communityStats[community].totalValue / communityStats[community].count;
      communityStats[community].contractors = communityStats[community].contractors.size;
    });
    
    return Object.entries(communityStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
  };

  const calculateContractorStats = () => {
    const filteredPermits = getFilteredPermits();
    const contractorStats = {};
    
    filteredPermits.forEach(permit => {
      if (!permit.contractorname) return;
      
      const contractor = permit.contractorname;
      if (!contractorStats[contractor]) {
        contractorStats[contractor] = {
          count: 0,
          totalValue: 0,
          avgValue: 0,
          communities: new Set()
        };
      }
      
      contractorStats[contractor].count++;
      contractorStats[contractor].totalValue += parseFloat(permit.estprojectcost) || 0;
      contractorStats[contractor].communities.add(permit.communityname);
    });
    
    Object.keys(contractorStats).forEach(contractor => {
      contractorStats[contractor].avgValue = contractorStats[contractor].totalValue / contractorStats[contractor].count;
      contractorStats[contractor].communities = contractorStats[contractor].communities.size;
    });
    
    return Object.entries(contractorStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
  };

  const calculateProjectTypeStats = () => {
    const filteredPermits = getFilteredPermits();
    const typeStats = {};
    
    filteredPermits.forEach(permit => {
      const type = permit.permitclassgroup || 'Other';
      if (!typeStats[type]) {
        typeStats[type] = { count: 0, totalValue: 0 };
      }
      typeStats[type].count++;
      typeStats[type].totalValue += parseFloat(permit.estprojectcost) || 0;
    });
    
    return Object.entries(typeStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.totalValue - a.totalValue);
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const communityStats = calculateCommunityStats();
  const contractorStats = calculateContractorStats();
  const projectTypeStats = calculateProjectTypeStats();
  const filteredPermits = getFilteredPermits();

  const totalValue = filteredPermits.reduce((sum, p) => sum + (parseFloat(p.estprojectcost) || 0), 0);
  const avgProjectValue = totalValue / filteredPermits.length || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Business Intelligence
            </h1>
            <p className="text-slate-600">
              Insights and trends from Calgary building permits
            </p>
          </div>
          
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="365days">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-800">{filteredPermits.length}</p>
                <p className="text-sm text-slate-600">Total Permits</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalValue)}</p>
                <p className="text-sm text-slate-600">Total Value</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(avgProjectValue)}</p>
                <p className="text-sm text-slate-600">Avg Project Value</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {Math.round((contactedLeads.length / Math.max(savedLeads.length, 1)) * 100)}%
                </p>
                <p className="text-sm text-slate-600">Conversion Rate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Communities */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center mb-6">
              <MapPin className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-xl font-semibold text-slate-800">Top Communities by Value</h2>
            </div>
            <div className="space-y-4">
              {communityStats.map((community, index) => (
                <div key={community.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-800 bg-slate-200 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <h3 className="font-medium text-slate-800">{community.name}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-slate-600">
                      <div>
                        <span className="text-xs text-slate-500">Projects:</span>
                        <p className="font-medium">{community.count}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Avg Value:</span>
                        <p className="font-medium">{formatCurrency(community.avgValue)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Contractors:</span>
                        <p className="font-medium">{community.contractors}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(community.totalValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Contractors */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center mb-6">
              <Users className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-slate-800">Most Active Contractors</h2>
            </div>
            <div className="space-y-4">
              {contractorStats.map((contractor, index) => (
                <div key={contractor.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-800 bg-slate-200 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <h3 className="font-medium text-slate-800 truncate">{contractor.name}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-slate-600">
                      <div>
                        <span className="text-xs text-slate-500">Projects:</span>
                        <p className="font-medium">{contractor.count}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Avg Value:</span>
                        <p className="font-medium">{formatCurrency(contractor.avgValue)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Areas:</span>
                        <p className="font-medium">{contractor.communities}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(contractor.totalValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Types */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold text-slate-800">Project Types Distribution</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectTypeStats.map((type, index) => (
              <div key={type.name} className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-medium text-slate-800 mb-2">{type.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Projects:</span>
                    <span className="font-medium">{type.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Value:</span>
                    <span className="font-medium text-green-600">{formatCurrency(type.totalValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Avg Value:</span>
                    <span className="font-medium">{formatCurrency(type.totalValue / type.count)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(type.count / filteredPermits.length) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    {Math.round((type.count / filteredPermits.length) * 100)}% of total projects
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Performance */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center mb-6">
            <Target className="h-6 w-6 text-orange-600 mr-2" />
            <h2 className="text-xl font-semibold text-slate-800">Lead Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">{savedLeads.length}</div>
              <div className="text-sm text-slate-600">Saved Leads</div>
              <div className="text-xs text-slate-500 mt-1">
                {formatCurrency(savedLeads.reduce((sum, lead) => sum + (parseFloat(lead.estprojectcost) || 0), 0))} total value
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">{contactedLeads.length}</div>
              <div className="text-sm text-slate-600">Leads Contacted</div>
              <div className="text-xs text-slate-500 mt-1">
                {formatCurrency(contactedLeads.reduce((sum, lead) => sum + (parseFloat(lead.estprojectcost) || 0), 0))} total value
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round((contactedLeads.length / Math.max(savedLeads.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-slate-600">Conversion Rate</div>
              <div className="text-xs text-slate-500 mt-1">
                Contacted vs Saved ratio
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;