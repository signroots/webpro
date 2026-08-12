import { Route, Routes, Navigate } from "react-router-dom";

import Layout from "../../Common/Layout";
import Order from "../../pages/Customers/Order";
import CustomerOrders from "../../pages/Admin/Order/details";
import Login from "../../pages/Customers/Login";
import CustomerDashboard from "../../pages/Customers/Dashboard";

export default function CustomerRoutes() {
  return (
    <Routes>

      {/* ================= LOGIN ================= */}
      <Route path="login" element={<Login />} />

      {/* ================= CUSTOMER LAYOUT ================= */}
      <Route path="" element={<Layout />}>

        {/* Default customer page */}
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />

        {/* ================= DASHBOARD ================= */}
        <Route
          path="dashboard"
          element={<CustomerDashboard />}
        />

        {/* ================= ORDERS ================= */}
        <Route
          path="orders"
          element={<Order />}
        />

        {/* ================= CUSTOMER ORDERS ================= */}
        <Route
          path=":customerId/orders"
          element={<CustomerOrders />}
        />

        {/* ================= ORDER DETAILS ================= */}
        <Route
          path="orders/:orderId"
          element={<CustomerOrders />}
        />

      </Route>

    </Routes>
  );
}