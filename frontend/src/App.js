import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LeadsManagement from './components/LeadsManagement';
import Analytics from './components/Analytics';
import Navigation from './components/Navigation';
import { LeadsProvider } from './context/LeadsContext';
import './App.css';

function App() {
  return (
    <LeadsProvider>
      <div className="App">
        <BrowserRouter>
          <Navigation />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<LeadsManagement />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </BrowserRouter>
      </div>
    </LeadsProvider>
  );
}

export default App;