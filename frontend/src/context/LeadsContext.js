import React, { createContext, useContext, useState, useEffect } from 'react';

const LeadsContext = createContext();

export const useLeads = () => {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadsProvider');
  }
  return context;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const LeadsProvider = ({ children }) => {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedLeads, setSavedLeads] = useState([]);
  const [contactedLeads, setContactedLeads] = useState([]);
  const [filters, setFilters] = useState({
    permitType: '',
    status: '',
    minCost: '',
    maxCost: '',
    community: '',
    dateRange: 'all',
    workClass: '',
    contractorType: 'all'
  });

  // Load saved data from localStorage
  useEffect(() => {
    const savedLeadsData = localStorage.getItem('contractorLeads-savedLeads');
    const contactedLeadsData = localStorage.getItem('contractorLeads-contactedLeads');
    
    if (savedLeadsData) {
      setSavedLeads(JSON.parse(savedLeadsData));
    }
    if (contactedLeadsData) {
      setContactedLeads(JSON.parse(contactedLeadsData));
    }
  }, []);

  // Fetch permits from backend
  const fetchPermits = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      // Add filters to request
      if (filters.permitType) params.append('permit_type', filters.permitType);
      if (filters.status) params.append('status', filters.status);
      if (filters.minCost) params.append('min_cost', filters.minCost);
      if (filters.maxCost) params.append('max_cost', filters.maxCost);
      if (filters.community) params.append('community', filters.community);
      if (filters.dateRange && filters.dateRange !== 'all') params.append('date_range', filters.dateRange);
      if (filters.workClass) params.append('work_class', filters.workClass);
      if (filters.contractorType && filters.contractorType !== 'all') params.append('contractor_type', filters.contractorType);
      
      // Set a reasonable limit
      params.append('limit', '2000');

      const url = `${API}/permits${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setPermits(data.permits || []);
      
      console.log(`Loaded ${data.permits?.length || 0} permits from API`);
      
    } catch (err) {
      console.error('Error fetching permits:', err);
      setError(err.message);
      // Fall back to empty array on error
      setPermits([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch permits when filters change
  useEffect(() => {
    fetchPermits();
  }, [filters]);

  // Initial load
  useEffect(() => {
    fetchPermits();
  }, []);

  const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addToSavedLeads = (permit) => {
    const newSavedLeads = [...savedLeads, { ...permit, savedAt: new Date().toISOString() }];
    setSavedLeads(newSavedLeads);
    saveToLocalStorage('contractorLeads-savedLeads', newSavedLeads);
  };

  const removeFromSavedLeads = (permitNum) => {
    const newSavedLeads = savedLeads.filter(lead => lead.permitnum !== permitNum);
    setSavedLeads(newSavedLeads);
    saveToLocalStorage('contractorLeads-savedLeads', newSavedLeads);
  };

  const markAsContacted = (permit) => {
    const newContactedLeads = [...contactedLeads, { ...permit, contactedAt: new Date().toISOString() }];
    setContactedLeads(newContactedLeads);
    saveToLocalStorage('contractorLeads-contactedLeads', newContactedLeads);
  };

  const removeFromContactedLeads = (permitNum) => {
    const newContactedLeads = contactedLeads.filter(lead => lead.permitnum !== permitNum);
    setContactedLeads(newContactedLeads);
    saveToLocalStorage('contractorLeads-contactedLeads', newContactedLeads);
  };

  const isPermitSaved = (permitNum) => {
    return savedLeads.some(lead => lead.permitnum === permitNum);
  };

  const isPermitContacted = (permitNum) => {
    return contactedLeads.some(lead => lead.permitnum === permitNum);
  };

  const getFilteredPermits = () => {
    // Since filtering is now done on the backend, just return the permits
    return permits;
  };

  const exportLeads = (leadsData, filename) => {
    const csvContent = [
      ['Permit Number', 'Address', 'Contractor', 'Project Cost', 'Status', 'Applied Date', 'Community'].join(','),
      ...leadsData.map(lead => [
        lead.permitnum,
        `"${lead.originaladdress}"`,
        `"${lead.contractorname || 'N/A'}"`,
        lead.estprojectcost || '0',
        lead.statuscurrent,
        lead.applieddate?.split('T')[0] || '',
        `"${lead.communityname}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const refreshData = () => {
    fetchPermits(true);
  };

  return (
    <LeadsContext.Provider value={{
      permits,
      loading,
      error,
      savedLeads,
      contactedLeads,
      filters,
      setFilters,
      addToSavedLeads,
      removeFromSavedLeads,
      markAsContacted,
      removeFromContactedLeads,
      isPermitSaved,
      isPermitContacted,
      getFilteredPermits,
      exportLeads,
      refreshData
    }}>
      {children}
    </LeadsContext.Provider>
  );
};