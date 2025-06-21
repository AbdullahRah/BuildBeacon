import React, { useState, useEffect } from 'react';
import { useLeads } from '../context/LeadsContext';
import { BarChart3, TrendingUp, MapPin, Building, DollarSign, Users, Calendar, Target, Loader, AlertCircle, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const { permits, savedLeads, contactedLeads } = useLeads();
  const [timeRange, setTimeRange] = useState('90days');
  const [communityData, setCommunityData] = useState([]);
  const [contractorData, setContractorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch analytics data from backend
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [communityResponse, contractorResponse] = await Promise.all([
          fetch(`${API}/analytics/communities`),
          fetch(`${API}/analytics/contractors`)
        ]);

        if (!communityResponse.ok || !contractorResponse.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const communityResult = await communityResponse.json();
        const contractorResult = await contractorResponse.json();

        setCommunityData(communityResult.communities || []);
        setContractorData(contractorResult.contractors || []);

      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

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

  const projectTypeStats = calculateProjectTypeStats();
  const filteredPermits = getFilteredPermits();

  const totalValue = filteredPermits.reduce((sum, p) => sum + (parseFloat(p.estprojectcost) || 0), 0);
  const avgProjectValue = totalValue / filteredPermits.length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur opacity-75 animate-pulse"></div>
            <Zap className="relative h-12 w-12 text-orange-600 mx-auto animate-bounce" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">BuildBeacon Analytics</h2>
          <p className="text-slate-600">Calculating insights from Calgary building permits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Analytics Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                BuildBeacon Analytics
              </h1>
            </div>
            <p className="text-slate-600">
              Real-time insights from Calgary building permits
            </p>
          </div>
          
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="365days">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-3">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{filteredPermits.length.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Total Permits</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-3">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalValue)}</p>
                <p className="text-sm text-slate-600">Total Value</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg mr-3">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(avgProjectValue)}</p>
                <p className="text-sm text-slate-600">Avg Project Value</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg mr-3">
                <Target className="h-8 w-8 text-orange-600" />
              </div>
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
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <MapPin className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Top Calgary Communities</h2>
            </div>
            <div className="space-y-4">
              {communityData.slice(0, 10).map((community, index) => (
                <div key={community.name} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg hover:from-orange-50 hover:to-red-50 transition-all duration-300">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 px-2 py-1 rounded">
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
                        <p className="font-medium">{formatCurrency(community.avg_value)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Contractors:</span>
                        <p className="font-medium">{community.unique_contractors}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(community.total_value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Contractors */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Most Active Contractors</h2>
            </div>
            <div className="space-y-4">
              {contractorData.slice(0, 10).map((contractor, index) => (
                <div key={contractor.name} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg hover:from-blue-50 hover:to-indigo-50 transition-all duration-300">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <h3 className="font-medium text-slate-800 truncate" title={contractor.name}>
                        {contractor.name.length > 30 ? `${contractor.name.substring(0, 30)}...` : contractor.name}
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-slate-600">
                      <div>
                        <span className="text-xs text-slate-500">Projects:</span>
                        <p className="font-medium">{contractor.count}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Avg Value:</span>
                        <p className="font-medium">{formatCurrency(contractor.avg_value)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Areas:</span>
                        <p className="font-medium">{contractor.unique_communities}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(contractor.total_value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Types */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Project Types Distribution</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectTypeStats.map((type, index) => (
              <div key={type.name} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg hover:from-purple-50 hover:to-indigo-50 transition-all duration-300 hover:scale-105">
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
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
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
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">BuildBeacon Lead Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:scale-105">
              <div className="text-3xl font-bold text-blue-600 mb-2">{savedLeads.length}</div>
              <div className="text-sm text-slate-600 font-medium">Saved Leads</div>
              <div className="text-xs text-slate-500 mt-1">
                {formatCurrency(savedLeads.reduce((sum, lead) => sum + (parseFloat(lead.estprojectcost) || 0), 0))} total value
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-300 hover:scale-105">
              <div className="text-3xl font-bold text-green-600 mb-2">{contactedLeads.length}</div>
              <div className="text-sm text-slate-600 font-medium">Leads Contacted</div>
              <div className="text-xs text-slate-500 mt-1">
                {formatCurrency(contactedLeads.reduce((sum, lead) => sum + (parseFloat(lead.estprojectcost) || 0), 0))} total value
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-100 rounded-lg hover:from-orange-100 hover:to-red-200 transition-all duration-300 hover:scale-105">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                {Math.round((contactedLeads.length / Math.max(savedLeads.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-slate-600 font-medium">Conversion Rate</div>
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