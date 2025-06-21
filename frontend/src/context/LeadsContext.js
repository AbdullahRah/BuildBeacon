import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockPermits } from '../data/mockData';

const LeadsContext = createContext();

export const useLeads = () => {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadsProvider');
  }
  return context;
};

export const LeadsProvider = ({ children }) => {
  const [permits, setPermits] = useState([]);
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

  useEffect(() => {
    // Load mock data
    setPermits(mockPermits);
    
    // Load saved data from localStorage
    const savedLeadsData = localStorage.getItem('contractorLeads-savedLeads');
    const contactedLeadsData = localStorage.getItem('contractorLeads-contactedLeads');
    
    if (savedLeadsData) {
      setSavedLeads(JSON.parse(savedLeadsData));
    }
    if (contactedLeadsData) {
      setContactedLeads(JSON.parse(contactedLeadsData));
    }
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
    return permits.filter(permit => {
      // Filter by permit type
      if (filters.permitType && !permit.permittype.toLowerCase().includes(filters.permitType.toLowerCase())) {
        return false;
      }

      // Filter by status
      if (filters.status && permit.statuscurrent !== filters.status) {
        return false;
      }

      // Filter by cost range
      const cost = parseFloat(permit.estprojectcost) || 0;
      if (filters.minCost && cost < parseFloat(filters.minCost)) {
        return false;
      }
      if (filters.maxCost && cost > parseFloat(filters.maxCost)) {
        return false;
      }

      // Filter by community
      if (filters.community && !permit.communityname.toLowerCase().includes(filters.community.toLowerCase())) {
        return false;
      }

      // Filter by work class
      if (filters.workClass && permit.workclass !== filters.workClass) {
        return false;
      }

      // Filter by date range
      if (filters.dateRange !== 'all') {
        const permitDate = new Date(permit.applieddate);
        const now = new Date();
        const daysDiff = (now - permitDate) / (1000 * 60 * 60 * 24);

        switch (filters.dateRange) {
          case '7days':
            if (daysDiff > 7) return false;
            break;
          case '30days':
            if (daysDiff > 30) return false;
            break;
          case '90days':
            if (daysDiff > 90) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
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

  return (
    <LeadsContext.Provider value={{
      permits,
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
      exportLeads
    }}>
      {children}
    </LeadsContext.Provider>
  );
};