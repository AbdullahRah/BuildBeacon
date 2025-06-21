import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Map, Users, BarChart3 } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Map, label: 'Dashboard', description: 'Map & Permits' },
    { path: '/leads', icon: Users, label: 'Leads', description: 'Manage Leads' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', description: 'Insights' }
  ];

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <Building2 className="h-8 w-8 text-blue-400 transform group-hover:scale-110 transition-all duration-300" />
              <div className="absolute inset-0 bg-blue-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ContractorLeads
              </h1>
              <p className="text-xs text-slate-400 -mt-1">Calgary Building Permits</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`} />
                    <div>
                      <div className={`font-medium text-sm ${
                        isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                      }`}>
                        {item.label}
                      </div>
                      <div className={`text-xs ${
                        isActive ? 'text-blue-200' : 'text-slate-500 group-hover:text-slate-400'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-600 rounded-lg blur opacity-25 -z-10"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;