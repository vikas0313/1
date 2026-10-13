import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerPage } from './pages/CustomerPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Dining Flow */}
        <Route path="/" element={<CustomerPage />} />

        {/* Password-Protected Owner Portal */}
        <Route path="/owner" element={<OwnerDashboardPage />} />

        {/* Fallback to customer portal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
