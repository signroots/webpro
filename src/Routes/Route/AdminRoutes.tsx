import { Route, Routes, Navigate } from "react-router-dom";
import Layout from "../../Common/Layout";

import Domains from "../../pages/Admin/Domain";
import Customer from "../../pages/Admin/Customer/Customers";
import Registration from "../../pages/Admin/Registration";
import StatusManager from "../../pages/Admin/StatusManagement";
import Order from "../../pages/Admin/Order";
import NewOrder from "../../pages/Admin/Order/new";
import DataManagement from "../../pages/Admin/DataManagement";
// import CustomerOrders from "../../pages/Admin/Order/details";
import CustomerOrders from "../../pages/Admin/Customer/CustomerOrders";
import UpdateOrder from "../../pages/Admin/Order/update";
import Categories from "../../pages/Admin/Category";
import UserTypes from "../../pages/Admin/UserTypes";
import DnsOrder from "../../pages/Admin/DnsOrder";
import RenewList from "../../pages/Admin/RenewList";
import OrderDetails from "../../pages/Admin/Order/OrderDetails"
import Dashboard from "../../pages/Admin/Dashboard";
import DomainSource from "../../pages/Admin/DomainSource"
export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="" element={<Layout />}>
        {/* Default redirect */}
        <Route index element={<Navigate to="orders" replace />} />

        {/* Pages */}
        <Route path="domains" element={<Domains />} />
        <Route path="customers" element={<Customer />} />
        <Route path="registration" element={<Registration />} />
        <Route path="status" element={<StatusManager />} />
        <Route path="data-management" element={<DataManagement />} />
        <Route path="orders/order-details/:orderId" element={<OrderDetails />} />
        <Route path="dashboard_management" element={<Dashboard />} />
        <Route path="orders" element={<Order />} />
        <Route path="orders/new" element={<NewOrder />} />
        <Route
          path="orders/customer/:customerId"
          element={<CustomerOrders />}
        />
        <Route path="orders/update/:orderId" element={<UpdateOrder />} />

        {/* ✅ FIXED */}
        <Route path="renew-list" element={<RenewList />} />
        <Route path="dns-order" element={<DnsOrder />} />

        <Route path="categories" element={<Categories />} />
        <Route path="user-types" element={<UserTypes />} />
        <Route path="domain-source" element={<DomainSource />} />
      </Route>
    </Routes>
  );
}
