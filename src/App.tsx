// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Domains from "./pages/Domain";
import Customers from "./pages/Customer/Customers";
import RegistrationForm from "./pages/Registration";
import Emails from "./pages/EmailServices";
import StatusManager from "./pages/StatusManagement";
import Layout from "./Common/Layout";
import Login from "./pages/Login"; 
import Order from "./pages/Order";  // ✅ fixed import

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth routes (NO Layout) */}
        <Route path="/" element={<Login />} />
        <Route path="/registration" element={<RegistrationForm />} />

        {/* Protected routes (WITH Layout) */}
        <Route element={<Layout />}>
          <Route path="/domain" element={<Navigate to="/domains" />} />
          <Route path="/domains" element={<Domains />} />
          <Route path="/order" element={<Order />} />   {/* ✅ fixed closing */}
          <Route path="/customers" element={<Customers />} />
          <Route path="/emails" element={<Emails />} />
          <Route path="/status" element={<StatusManager />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
