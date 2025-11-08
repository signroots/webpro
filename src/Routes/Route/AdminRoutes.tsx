import { Route, Routes, Navigate } from 'react-router-dom';
import Layout from "../../Common/Layout";
import Domains from "../../pages/Admin/Domain";
import Customer from "../../pages/Admin/Customer/Customers";
import Registration from "../../pages/Admin/Registration";
import StatusManager from "../../pages/Admin/StatusManagement";
import Order from "../../pages/Admin/Order";
import NewOrder from "../../pages/Admin/Order/new";
import DataManagement from "../../pages/Admin/DataManagement"
import CustomerOrders from "../../pages/Admin/Order/details";
import UpdateOrder from "../../pages/Admin/Order/update";
import Categories from "../../pages/Admin/Category";
import UserTypes from "../../pages/Admin/UserTypes";
import DnsOrder from "../../pages/Admin/DnsOrder";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="" element={<Layout />}>
        {/* Default redirect */}
        <Route index element={<Navigate to="orders" replace />} />

        {/* ✅ Protected Pages Only */}
        <Route path="domains" element={<Domains />} />
        <Route path="customers" element={<Customer />} />
        <Route path="registration" element={<Registration />} />
        <Route path="status" element={<StatusManager />} />
        <Route path="data-management" element={<DataManagement />} />
        <Route path="orders" element={<Order />} />
        <Route path="orders/new" element={<NewOrder />} />
        <Route path="orders/customer/:customerId" element={<CustomerOrders />} />
        <Route path="orders/update/:orderId" element={<UpdateOrder />} />
        <Route path="dns-order" element={<DnsOrder />} /> 

        <Route path="categories" element={<Categories />} />
        <Route path="user-types" element={<UserTypes />} />
      </Route>
    </Routes>
  );
}
