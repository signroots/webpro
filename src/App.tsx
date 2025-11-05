// src/App.tsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRouters from './Routes/AppRouters';
import { AuthProvider } from './Common/AuthContext/Auth';  // Adjust path if 
import { ToastContainerGlobal } from "./Common/Toastify";

import "react-toastify/dist/ReactToastify.css";
import "antd/dist/reset.css"; // ✅ Required for Ant Design toast to appear


export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRouters />
        <ToastContainerGlobal /> 
      </AuthProvider>
    </Router>
  );
}
