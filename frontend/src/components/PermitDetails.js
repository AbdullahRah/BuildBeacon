import React from 'react';
import { useLeads } from '../context/LeadsContext';
import { X, MapPin, Calendar, DollarSign, Building, User, Phone, Mail, Star, MessageSquare, Download } from 'lucide-react';

const PermitDetails = ({ permit, onClose }) => {
  const { 
    addToSavedLeads, 
    removeFromSavedLeads, 
    markAsContacted, 
    removeFromContactedLeads,
    isPermitSaved, 
    isPermitContacted 
  } = useLeads();

  const saved = isPermitSaved(permit.permitnum);
  const contacted = isPermitContacted(permit.permitnum);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pre Backfill Phase':
      case 'Issued Permit':
        return 'bg-green-100 text-green-800';
      case 'Pending Plans Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getOpportunityTypes = (permit) => {
    const opportunities = [];
    const description = permit.description?.toLowerCase() || '';
    
    if (description.includes('electrical') || permit.permitclass?.includes('Electrical')) {
      opportunities.push('Electrical Work');
    }
    if (description.includes('plumbing') || description.includes('bathroom') || description.includes('kitchen')) {
      opportunities.push('Plumbing Work');
    }
    if (description.includes('hvac') || description.includes('heating') || description.includes('cooling')) {
      opportunities.push('HVAC Work');
    }
    if (description.includes('roof') || description.includes('shingle')) {
      opportunities.push('Roofing Work');
    }
    if (description.includes('floor') || description.includes('tile') || description.includes('carpet')) {
      opportunities.push('Flooring Work');
    }
    if (description.includes('garage') || description.includes('deck') || description.includes('porch')) {
      opportunities.push('Carpentry Work');
    }
    if (permit.workclass === 'New') {
      opportunities.push('Material Supply');
      opportunities.push('General Contracting');
    }
    
    return opportunities.length > 0 ? opportunities : ['General Opportunities'];
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Permit Details
            </h2>
            <p className="text-sm text-slate-600">
              {permit.permitnum}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Property Information */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
            <Building className="h-5 w-5 text-blue-600 mr-2" />
            Property Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-slate-500 mt-1" />
              <div>
                <p className="font-medium text-slate-800">{permit.originaladdress}</p>
                <p className="text-sm text-slate-600">{permit.communityname}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Project Type:</span>
                <p className="font-medium text-slate-800">{permit.permittype}</p>
              </div>
              <div>
                <span className="text-slate-500">Work Class:</span>
                <p className="font-medium text-slate-800">{permit.workclass}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 text-green-600 mr-2" />
            Project Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Estimated Cost:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(permit.estprojectcost)}
              </span>
            </div>
            {permit.totalsqft && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Sq Ft:</span>
                <span className="font-medium text-slate-800">
                  {parseInt(permit.totalsqft).toLocaleString()} sq ft
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Housing Units:</span>
              <span className="font-medium text-slate-800">{permit.housingunits || 'N/A'}</span>
            </div>
            <div className="mt-3">
              <span className="text-slate-600">Description:</span>
              <p className="text-sm text-slate-800 mt-1 p-3 bg-white rounded-lg border border-green-200">
                {permit.description || 'No description available'}
              </p>
            </div>
          </div>
        </div>

        {/* Status & Dates */}
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            Status & Timeline
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Current Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(permit.statuscurrent)}`}>
                {permit.statuscurrent}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Applied:</span>
                <span className="font-medium text-slate-800">{formatDate(permit.applieddate)}</span>
              </div>
              {permit.issueddate && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Issued:</span>
                  <span className="font-medium text-slate-800">{formatDate(permit.issueddate)}</span>
                </div>
              )}
              {permit.completeddate && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Completed:</span>
                  <span className="font-medium text-slate-800">{formatDate(permit.completeddate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contractor Information */}
        {(permit.contractorname || permit.applicantname) && (
          <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
              <User className="h-5 w-5 text-purple-600 mr-2" />
              Contractor Information
            </h3>
            <div className="space-y-3">
              {permit.contractorname && (
                <div>
                  <span className="text-slate-600">Contractor:</span>
                  <p className="font-medium text-slate-800">{permit.contractorname}</p>
                </div>
              )}
              {permit.applicantname && permit.applicantname !== permit.contractorname && (
                <div>
                  <span className="text-slate-600">Applicant:</span>
                  <p className="font-medium text-slate-800">{permit.applicantname}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Business Opportunities */}
        <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
          <h3 className="font-semibold text-slate-800 mb-4">
            Potential Opportunities
          </h3>
          <div className="flex flex-wrap gap-2">
            {getOpportunityTypes(permit).map((opportunity, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium border border-orange-200"
              >
                {opportunity}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t border-slate-200 bg-slate-50">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => saved ? removeFromSavedLeads(permit.permitnum) : addToSavedLeads(permit)}
            className={`p-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
              saved
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300'
            }`}
          >
            <Star className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
            <span>{saved ? 'Saved' : 'Save Lead'}</span>
          </button>
          
          <button
            onClick={() => contacted ? removeFromContactedLeads(permit.permitnum) : markAsContacted(permit)}
            className={`p-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
              contacted
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{contacted ? 'Contacted' : 'Mark Contacted'}</span>
          </button>
        </div>
        
        <button
          onClick={() => {
            const permitData = [{
              ...permit,
              savedAt: new Date().toISOString()
            }];
            // This would trigger a download - using a mock implementation
            console.log('Exporting permit:', permitData);
          }}
          className="w-full mt-3 p-3 bg-slate-100 text-slate-800 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export Permit Data</span>
        </button>
      </div>
    </div>
  );
};

export default PermitDetails;