import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './Auth';

interface RequireAuthProps {
  allowedRoles: string[];
  children: ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ allowedRoles, children }) => {
  const { user, isAuthReady } = useAuth();
  const location = useLocation();

  // ⏳ Wait for AuthProvider to finish checking
  if (!isAuthReady) {
    return <div>Loading...</div>; // or null, or a spinner
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
