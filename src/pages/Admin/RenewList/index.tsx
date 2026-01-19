import React, { useEffect, useState } from "react";
import {
  FaEye,
  FaEdit,
  FaEnvelope,
  FaServer,
  FaLock,
  FaLaptopCode,
  FaGlobe,
  FaSyncAlt
} from "react-icons/fa";
import { SiCloudflare, SiHostinger } from "react-icons/si";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { fetchRenewListOrders, fetchCustomerOrder } from "../Order/api";
import { fetchCountries } from "../Customer/api";

interface Customer {
  _id: string;
  name?: string;
  company?: string;
}

interface Order {
  _id: string;
  domainName: string;
  lockStatus?: string;
  status?: string;
  expiryDate?: string;
  domainSource?: string;
  google_email?: boolean;
  microsoft_email?: boolean;
  customer?: string | Customer;
}

const RenewList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const { orderId } = useParams<{ orderId: string }>();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | "addCustomer" | null>(null);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const navigate = useNavigate();

  // -------------------- Load Orders --------------------
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetchRenewListOrders();

        // ✅ CORRECT
        const ordersArray = response.data.data;

        console.log("Orders:", ordersArray);
        setOrders(ordersArray);
      } catch (error) {
        console.error("Failed to fetch orders", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);


  // -------------------- Pagination --------------------
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <p className="text-center text-gray-500 mt-6">Loading orders...</p>;

  return (
    <div className="min-h-screen w-full bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-black">Orders</h1>
        {/* <Link
          to="/admin/orders/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Order
        </Link> */}
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["SL No", "Domain Name", "Customer", "Services", "Expiry Date", "Actions"].map((col) => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order, idx) => (
              <tr key={order._id} className="hover:bg-gray-50 text-black">
                <td className="px-6 py-4">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  {order.lockStatus === "Locked" ? <FaLock className="text-red-500" /> : <FaLock className="text-green-500" />}
                  {order.domainName}
                </td>
                <td className="px-6 py-4">
                  {typeof order.customer === "string" ? (
                    <span className="text-gray-500">
                      Customer ID: {order.customer}
                    </span>
                  ) : order.customer?.name ? (
                    <span>{order.customer.name}</span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                  {order.domainSource?.toLowerCase() === "resellerclub" ? (
                    <img src="/resellerclub-logo-2x.png" className="w-6 h-6" title="ResellerClub" />
                  ) : order.domainSource?.toLowerCase() === "cloudflare" ? (
                    <SiCloudflare className="w-6 h-6 text-orange-500" title="Cloudflare" />
                  ) : order.domainSource?.toLowerCase() === "hostinger" ? (
                    <SiHostinger className="w-6 h-6 text-blue-500" title="Hostinger" />
                  ) : (
                    <FaGlobe className="w-6 h-6 text-gray-400" title={order.domainSource || "No Domain Source"} />
                  )}
                  {order.google_email ? (
                    <img src="/download.png" className="w-5 h-5" title="Google Workspace" />
                  ) : order.microsoft_email ? (
                    <img src="/microsoft.png" className="w-5 h-5" title="Microsoft 365" />
                  ) : (
                    <FaEnvelope className="w-5 h-5 text-gray-300" title="No Email" />
                  )}
                  <FaServer className="w-5 h-5 text-purple-400" title="Hosting" />
                  <FaLaptopCode className="w-5 h-5 text-pink-400" title="Website" />
                </td>
                <td className="px-6 py-4">{order.expiryDate
                  ? new Date(order.expiryDate)
                    .toLocaleDateString("en-GB")
                    .replace(/\//g, "-")
                  : "N/A"}</td>
                {/* <td className="px-6 py-4">
  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
    {order.expiryDate
      ? new Date(order.expiryDate)
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-")
      : "N/A"}
  </span>
</td> */}
                {/* <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.google_email || order.microsoft_email ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {(order.google_email || order.microsoft_email) ? "Active" : "Inactive"}
                  </span>
                </td> */}
                <td className="px-10 py-4 flex gap-3 text-gray-400">
                  <button
                    className="text-blue-400 hover:text-blue-600"
                    title="View"
                    onClick={() => {/* handleView */ }}
                  >
                    <FaEye />
                  </button>

                  <Link
                    to={`/admin/orders/update/${order._id}`}
                    className="text-yellow-400 hover:text-yellow-600"
                    title="Edit"
                  >
                    <FaEdit />
                  </Link>

                  {/* Renew Button */}
                  <Link
                    to={`/admin/orders/renew/${order._id}`}
                    className="text-green-500 hover:text-green-700"
                    title="Renew Domain"
                  >
                    <FaSyncAlt />
                  </Link>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center gap-4 text-black">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">Prev</button>
        <span className="py-2">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};

export default RenewList;
