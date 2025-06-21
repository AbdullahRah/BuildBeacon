import React, { useState } from 'react';
import { useLeads } from '../context/LeadsContext';
import { Star, MessageSquare, Download, Search, Calendar, DollarSign, MapPin } from 'lucide-react';

const LeadsManagement = () => {
  const { savedLeads, contactedLeads, exportLeads, removeFromSavedLeads, removeFromContactedLeads } = useLeads();
  const [activeTab, setActiveTab] = useState('saved');
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filterLeads = (leads) => {
    return leads.filter(lead => 
      lead.originaladdress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contractorname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.communityname?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const LeadCard = ({ lead, type, onRemove }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-slate-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 mb-1">
            {lead.originaladdress}
          </h3>
          <p className="text-sm text-slate-600">{lead.communityname}</p>
        </div>
        <div className="flex items-center space-x-2">
          {type === 'saved' && (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          )}
          {type === 'contacted' && (
            <MessageSquare className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Project Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Project Value</p>
          <p className="font-semibold text-green-600">
            {formatCurrency(lead.estprojectcost)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Status</p>
          <p className="text-sm text-slate-800">{lead.statuscurrent}</p>
        </div>
      </div>

      {/* Contractor */}
      {lead.contractorname && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-1">Contractor</p>
          <p className="text-sm text-slate-800">{lead.contractorname}</p>
        </div>
      )}

      {/* Description */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-1">Description</p>
        <p className="text-sm text-slate-800 line-clamp-2">
          {lead.description || 'No description available'}
        </p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        <div>
          <p className="text-slate-500 mb-1">Applied</p>
          <p className="text-slate-800">{formatDate(lead.applieddate)}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-1">{type === 'saved' ? 'Saved' : 'Contacted'}</p>
          <p className="text-slate-800">
            {formatDate(type === 'saved' ? lead.savedAt : lead.contactedAt)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => onRemove(lead.permitnum)}
          className="flex-1 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
        >
          Remove
        </button>
        <button
          onClick={() => {
            const leadData = [{ ...lead, exportedAt: new Date().toISOString() }];
            exportLeads(leadData, `lead-${lead.permitnum}`);
          }}
          className="flex-1 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
        >
          <Download className="h-3 w-3" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );

  const renderLeadsList = (leads, type) => {
    const filteredLeads = filterLeads(leads);
    
    if (filteredLeads.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-slate-400 mb-4">
            {type === 'saved' ? <Star className="h-12 w-12" /> : <MessageSquare className="h-12 w-12" />}
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">
            No {type} leads yet
          </h3>
          <p className="text-slate-600">
            {type === 'saved' 
              ? 'Start saving permits from the dashboard to build your lead list'
              : 'Mark permits as contacted to track your outreach efforts'
            }
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <LeadCard
            key={lead.permitnum}
            lead={lead}
            type={type}
            onRemove={type === 'saved' ? removeFromSavedLeads : removeFromContactedLeads}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Lead Management
          </h1>
          <p className="text-slate-600">
            Manage your saved permits and track your outreach efforts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-800">{savedLeads.length}</p>
                <p className="text-sm text-slate-600">Saved Leads</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-800">{contactedLeads.length}</p>
                <p className="text-sm text-slate-600">Contacted</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {formatCurrency([...savedLeads, ...contactedLeads].reduce((sum, lead) => 
                    sum + (parseFloat(lead.estprojectcost) || 0), 0))}
                </p>
                <p className="text-sm text-slate-600">Total Value</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {Math.round((contactedLeads.length / Math.max(savedLeads.length, 1)) * 100)}%
                </p>
                <p className="text-sm text-slate-600">Contact Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Saved Leads ({savedLeads.length})
            </button>
            <button
              onClick={() => setActiveTab('contacted')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'contacted'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Contacted ({contactedLeads.length})
            </button>
          </div>

          {/* Search and Actions */}
          <div className="flex space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => {
                const leads = activeTab === 'saved' ? savedLeads : contactedLeads;
                exportLeads(leads, `${activeTab}-leads`);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export All</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {activeTab === 'saved' 
            ? renderLeadsList(savedLeads, 'saved')
            : renderLeadsList(contactedLeads, 'contacted')
          }
        </div>
      </div>
    </div>
  );
};

export default LeadsManagement;