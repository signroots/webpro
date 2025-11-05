import { Route, Routes, Navigate } from 'react-router-dom';

import Layout from "../../Common/Layout";
import Order from "../../pages/Customers/Order";
import CustomerOrders from "../../pages/Admin/Order/details";
import UpdateOrder from '../../pages/Admin/Order/update'; // ✅
import Login from "../../pages/Customers/Login";

export default function CustomerRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />

      <Route path="" element={<Layout />}>
        <Route index element={<Navigate to="orders" />} />

        {/* ✅ Fixed: Remove leading slash */}
        <Route path="orders" element={<Order />} />

        {/* Details by customerId */}
        <Route path=":customerId/orders" element={<CustomerOrders />} />

        {/* Details by orderId */}
        <Route path="orders/:orderId" element={<CustomerOrders />} />
      </Route>
    </Routes>
  );
}
