import React, { useEffect, useState, useMemo } from "react";
import {
  FaEye,
  FaEdit,
  FaEnvelope,
  FaServer,
  FaLock,
  FaLaptopCode,
  FaGlobe,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { fetchOrders, fetchOrdersByProvider } from "./api"; // your API call
import { useNavigate,useParams  } from "react-router-dom";
import { SiCloudflare,SiHostinger } from "react-icons/si";
// -------------------- Types --------------------
interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  c_name?: string;
  c_email?: string;
}

interface Order {
  _id: string;
  domainName: string;
  lockStatus?: string;
  status?: string;
  managedBy?: string;
  registrationDate?: string;
  expiryDate?: string;
  domainSource?: string;
  google_email?: boolean;
  microsoft_email?: boolean;
  cloudflareRegistered?: boolean;
  hosting?: boolean;
  email_flag?: boolean;
  website_flag?: boolean;
  ssl_flag?: boolean;
  host_flag?: boolean;
  customer?: Customer | null;
  subResellerName?: string;
  subResellerEmail?: string;
  subscription?: string;
  provider?: string;
  email_status?: string;
  email_expiryDate?: string;
}

// -------------------- Component --------------------
const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const { orderId } = useParams<{ orderId: string }>();
const navigate = useNavigate();
  // Filters
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | null>(null);

  // -------------------- Load Orders --------------------
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const orders = await fetchOrders(); // fetchOrders returns Order[]
        setOrders(orders);
        setAllOrders(orders);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  // -------------------- Apply Filters --------------------
  useEffect(() => {
    const applyFilters = async () => {
      let filtered: Order[] = allOrders;

      if (provider) {
        try {
          // 🔥 fetch orders by provider from backend
          const providerOrders = await fetchOrdersByProvider(provider);
          filtered = providerOrders;
        } catch (err) {
          console.error("Failed to fetch provider orders", err);
        }
      }

      if (statusFilter) {
        filtered = filtered.filter(
          (o) => o.status?.toLowerCase() === statusFilter.toLowerCase()
        );
      }

      setOrders(filtered);
      setCurrentPage(1);
    };

    applyFilters();
  }, [provider, statusFilter, allOrders]);

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setModalType("view");
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setModalType("edit");
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
  };

  // -------------------- Search --------------------
  const filteredOrders = useMemo(() => {
    return orders.filter((o) =>
      (o.domainName ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  // -------------------- Pagination --------------------
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    if (provider) {
      return filteredOrders; // show all if provider filter is applied
    }
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage, provider]);

  if (loading)
    return <p className="text-center text-gray-500 mt-6">Loading orders...</p>;

  // -------------------- JSX --------------------
return (
  <div className="min-h-screen w-full bg-gray-100 p-6">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold mb-4 text-black">Orders</h1>
      <Link
        to="/orders/new"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        + New Order
      </Link>
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-4 mb-4 items-center">
      <input
        type="text"
        placeholder="Search domain..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border px-3 py-2 rounded-lg text-black"
      />
    </div>

    {/* Table */}
    <div className="bg-white shadow rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {[
              "SL No",
              "Domain Name",
              "Services",
              "Expiry Date",
              "Domain Status",
              "Email Expiry",
              "Email Status",
              "Actions",
            ].map((col) => (
              <th
                key={col}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {paginatedOrders.map((order, idx) => (
         <tr key={order._id} className="hover:bg-gray-50 text-black">
  {/* SL No */}
  <td className="px-6 py-4">
    {(currentPage - 1) * itemsPerPage + idx + 1}
  </td>

  {/* Domain Name */}
  <td className="px-6 py-4 flex items-center gap-2">
    {order.lockStatus === "Locked" ? (
      <FaLock className="text-red-500" />
    ) : (
      <FaLock className="text-green-500" />
    )}
    {order.domainName}
  </td>

  {/* ✅ Services (Separate column) */}
  <td className="px-6 py-4 flex items-center gap-3">
    {/* Domain Source */}
    {order.domainSource ? (
      order.domainSource.toLowerCase() === "resellerclub" ? (
        <img
          src="/resellerclub-logo-2x.png"
          className="w-6 h-6"
          title="ResellerClub"
        />
      ) : order.domainSource.toLowerCase() === "cloudflare" ? (
        <SiCloudflare
          className="w-6 h-6 text-orange-500"
          title="Cloudflare"
        />
      ) : order.domainSource.toLowerCase() === "hostinger" ? (
        <SiHostinger className="w-6 h-6 text-blue-500" title="Hostinger" />
      ) : (
        <FaGlobe className="w-6 h-6 text-gray-400" title={order.domainSource} />
      )
    ) : (
      <FaGlobe className="w-6 h-6 text-gray-300" title="No Domain Source" />
    )}

    {/* Email Service */}
    {order.google_email ? (
      <img src="/download.png" className="w-5 h-5" title="Google Workspace" />
    ) : order.microsoft_email ? (
      <img src="/microsoft.png" className="w-5 h-5" title="Microsoft 365" />
    ) : (
      <FaEnvelope className="w-5 h-5 text-gray-300" title="No Email" />
    )}

    {/* Hosting */}
    <FaServer className="w-5 h-5 text-purple-400" title="Hosting" />

    {/* Website */}
    <FaLaptopCode className="w-5 h-5 text-pink-400" title="Website" />
  </td>

  {/* Expiry Date */}
  <td className="px-6 py-4">
    {order.expiryDate
      ? new Date(order.expiryDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "N/A"}
  </td>

  {/* Domain Status */}
  <td className="px-6 py-4 text-center">
    {order.status ? (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          order.status.toLowerCase() === "active"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {order.status}
      </span>
    ) : (
      <span className="text-gray-400 text-sm font-medium">N/A</span>
    )}
  </td>

  {/* Email Expiry */}
  <td className="px-6 py-4">
    {order.email_expiryDate
      ? new Date(order.email_expiryDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "N/A"}
  </td>

  {/* Email Status */}
  <td className="px-6 py-4">
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        order.email_status?.toLowerCase() === "active"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {order.email_status || "Unknown"}
    </span>
  </td>

  {/* Actions */}
  <td className="px-6 py-4 text-center">
    <button
      className="text-blue-500 hover:text-blue-700"
      title="View"
      onClick={() => handleView(order)}
    >
      <FaEye />
    </button>
  </td>
</tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    {!provider && (
      <div className="mt-4 flex justify-center gap-4 text-black">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="py-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    )}

    {/* Modal */}
    {modalType && selectedOrder && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-[900px] max-h-[90vh] overflow-y-auto relative">
          <button
            onClick={closeModal}
            className="absolute top-2 right-2 text-gray-600 hover:text-black"
          >
            ✕
          </button>

          {modalType === "view" && (
            <div className="text-black">
              <h2 className="text-xl font-bold mb-4">View Order</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Domain", selectedOrder.domainName],
                  ["Status", selectedOrder.status],
                  [
                    "Registration Date",
                    selectedOrder.registrationDate
                      ? new Date(selectedOrder.registrationDate).toLocaleDateString("en-GB")
                      : "N/A",
                  ],
                  [
                    "Expiry Date",
                    selectedOrder.expiryDate
                      ? new Date(selectedOrder.expiryDate).toLocaleDateString("en-GB")
                      : "N/A",
                  ],
                  ["Provider", selectedOrder.provider],
                  ["Subscription", selectedOrder.subscription],
                ].map(([label, value]) => (
                  <div key={label} className="p-3 border rounded-lg shadow-sm bg-gray-50">
                    <p className="font-semibold">{label}</p>
                    <p>{value || "N/A"}</p>
                  </div>
                ))}
              </div>

              {/* Customer Info */}
              <h3 className="text-lg font-semibold mt-6 mb-3">Customer Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Name", selectedOrder.customer?.name],
                  ["Email", selectedOrder.customer?.email],
                  ["Phone", selectedOrder.customer?.phone],
                  ["Company", selectedOrder.customer?.company],
                  ["Address", selectedOrder.customer?.address],
                  ["City", selectedOrder.customer?.city],
                  ["Country", selectedOrder.customer?.country],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="p-3 border rounded-lg shadow-sm bg-gray-50"
                  >
                    <p className="font-semibold">{label}</p>
                    <p>{value || "N/A"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {modalType === "edit" && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-black">Edit Order</h2>
              <form className="space-y-3">
                <label className="block">
                  Domain:
                  <input
                    type="text"
                    value={selectedOrder.domainName}
                    className="border px-3 py-2 rounded w-full text-black"
                    readOnly
                  />
                </label>

                <label className="block">
                  Status:
                  <select
                    defaultValue={selectedOrder.status}
                    className="border px-3 py-2 rounded w-full text-black"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Expired</option>
                  </select>
                </label>

                <label className="block">
                  Customer Name:
                  <input
                    type="text"
                    defaultValue={selectedOrder.customer?.name}
                    className="border px-3 py-2 rounded w-full text-black"
                  />
                </label>

                <label className="block">
                  Customer Email:
                  <input
                    type="email"
                    defaultValue={selectedOrder.customer?.email}
                    className="border px-3 py-2 rounded w-full text-black"
                  />
                </label>

                <label className="block">
                  Customer Phone:
                  <input
                    type="text"
                    defaultValue={selectedOrder.customer?.phone}
                    className="border px-3 py-2 rounded w-full text-black"
                  />
                </label>

                <label className="block">
                  Expiry Date:
                  <input
                    type="date"
                    defaultValue={selectedOrder.expiryDate}
                    className="border px-3 py-2 rounded w-full text-black"
                  />
                </label>

                <button
                  type="submit"
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

};

export default Orders;
