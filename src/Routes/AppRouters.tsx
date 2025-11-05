// src/Routes/AppRouters.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AdminRoutes from './Route/AdminRoutes';
import CustomerRoutes from './Route/CustomerRoutes';

import LoginAdmin from '../pages/Admin/Login';
import LoginCustomer from '../pages/Customers/Login';

import RequireAuth from '../Common/AuthContext/RequireAuth';
import Paths from './Path';

const AppRouters: React.FC = () => {
  return (
    <Routes>
      {/* Default redirect to admin login (you can customize as needed) */}
      <Route path="/" element={<Navigate to={Paths.Admin.login} replace />} />

      {/* Public login routes */}
      <Route path={Paths.Admin.login} element={<LoginAdmin />} />
      <Route path={Paths.Customer.login} element={<LoginCustomer />} />

      {/* Protected Admin routes */}
      <Route
        path="/admin/*"
        element={
          <RequireAuth allowedRoles={['Admin']}>
            <AdminRoutes />
          </RequireAuth>
        }
      />

      {/* Protected Customer routes */}
      <Route
        path="/customer/*"
        element={
         <RequireAuth allowedRoles={['Customer', 'Admin']}>
            <CustomerRoutes />
          </RequireAuth>
        }
      />

      {/* Unauthorized and Not Found */}
      <Route path={Paths.unauthorized} element={<div>Unauthorized Access</div>} />
      <Route path={Paths.error} element={<div>404 Not Found</div>} />
    </Routes>
  );
};

export default AppRouters;
