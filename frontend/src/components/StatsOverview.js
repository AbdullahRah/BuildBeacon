import React from 'react';
import { TrendingUp, Building, DollarSign, Users, Calendar, MapPin } from 'lucide-react';

const StatsOverview = ({ permits }) => {
  const calculateStats = () => {
    const totalValue = permits.reduce((sum, permit) => {
      return sum + (parseFloat(permit.estprojectcost) || 0);
    }, 0);

    const newProjects = permits.filter(p => p.workclass === 'New').length;
    const activeProjects = permits.filter(p => 
      p.statuscurrent === 'Pre Backfill Phase' || 
      p.statuscurrent === 'Issued Permit'
    ).length;

    const recentProjects = permits.filter(p => {
      const appliedDate = new Date(p.applieddate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return appliedDate >= thirtyDaysAgo;
    }).length;

    const uniqueContractors = new Set(
      permits
        .filter(p => p.contractorname)
        .map(p => p.contractorname)
    ).size;

    const uniqueCommunities = new Set(
      permits.map(p => p.communityname)
    ).size;

    return {
      totalValue,
      newProjects,
      activeProjects,
      recentProjects,
      uniqueContractors,
      uniqueCommunities
    };
  };

  const stats = calculateStats();

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const statCards = [
    {
      title: 'Total Projects',
      value: permits.length.toLocaleString(),
      icon: Building,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: '+12%'
    },
    {
      title: 'Total Value',
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: '+8%'
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects.toLocaleString(),
      icon: TrendingUp,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      trend: '+5%'
    },
    {
      title: 'New Projects',
      value: stats.newProjects.toLocaleString(),
      icon: Calendar,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: '+15%'
    },
    {
      title: 'Contractors',
      value: stats.uniqueContractors.toLocaleString(),
      icon: Users,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      trend: '+3%'
    },
    {
      title: 'Communities',
      value: stats.uniqueCommunities.toLocaleString(),
      icon: MapPin,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      trend: 'Stable'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={index}
            className={`${stat.bgColor} rounded-xl p-4 border border-${stat.color}-100 hover:shadow-lg transition-all duration-300 hover:scale-105 group`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-slate-800 mb-1">
                  {stat.value}
                </p>
                <p className={`text-xs font-medium ${
                  stat.trend.startsWith('+') ? 'text-green-600' : 
                  stat.trend === 'Stable' ? 'text-slate-500' : 'text-red-600'
                }`}>
                  {stat.trend} vs last month
                </p>
              </div>
              <div className={`${stat.bgColor} p-2 rounded-lg border border-${stat.color}-200 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsOverview;