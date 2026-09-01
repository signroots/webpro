import React, { useEffect, useState, useMemo } from "react";
import {
  FaEye,
  FaEdit,
  FaEnvelope,
  FaServer,
  FaLock,
  FaLaptopCode,
  FaGlobe,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { fetchOrders, fetchOrdersByProvider } from "./api"; // your API call
import { useNavigate, useParams } from "react-router-dom";
import { SiCloudflare, SiHostinger } from "react-icons/si";
import ServiceIcons from "../../Admin/Order/ServiceIcons";
import ExpiryBadge from "../../Admin/Order/ExpiryBadge";
import OrdersTable from "../../Admin/Order/OrdersTable";
import type { Order, Client, Customer, MSOfficeDetails } from "../../../types/order";
// -------------------- Types --------------------

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
  const InfoItem = ({
    label,
    value,
  }: {
    label: string;
    value: string | React.ReactNode;
  }) => (
    <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
      <p className="font-semibold">{label}</p>
      <p>{value || "N/A"}</p>
    </div>
  );
  const getStatusClass = (status?: string) => {
    const value = status?.trim().toLowerCase();

    // N/A or empty → YELLOW
    if (!value) {
      return "bg-blue-100 text-blue-800";
    }

    // EXPIRED → RED
    if (value === "expired") {
      return "bg-red-600 text-white";
    }

    // ACTIVE → GREEN
    if (value === "active") {
      return "bg-gray-100 text-green-700";
    }

    // fallback
    return "bg-gray-200 text-gray-800";
  };


  const handleSaveChanges = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selectedOrder) return;

    try {
      // ഇവിടെ backend API call ഇടുക
      console.log("Saving order:", selectedOrder);

      closeModal();

    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  useEffect(() => {
    if (modalType) {
      // Background page scroll disable
      document.body.style.overflow = "hidden";
    } else {
      // Modal close ആകുമ്പോൾ scroll enable
      document.body.style.overflow = "";
    }

    // Cleanup
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalType]);
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
          (o) =>
            o.status?.name?.toLowerCase() ===
            statusFilter.toLowerCase()
        );
      }

      setOrders(filtered);
      setCurrentPage(1);
    };

    applyFilters();
  }, [provider, statusFilter, allOrders]);

  const handleView = (order: Order) => {
    navigate(`/customer/orders/${order._id}`);
  };

  const handleEdit = (order: Order) => {
    navigate(`/customer/orders/update/${order._id}`);
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
      <OrdersTable
        paginatedOrders={paginatedOrders}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        // setSelectedOrder={setSelectedOrder}
        // setModalType={setModalType}
        handleEdit={handleEdit}
        getStatusClass={getStatusClass}
        navigate={navigate}
      />

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
      {/* ==================== VIEW / EDIT MODAL ==================== */}

      {modalType && selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl
                 w-full max-w-5xl
                 max-h-[90vh]
                 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 z-20
                   w-9 h-9 rounded-full
                   flex items-center justify-center
                   text-gray-500 hover:text-gray-800
                   hover:bg-gray-100
                   transition"
            >
              ✕
            </button>

            {/* ================= VIEW ================= */}
            {modalType === "view" && (
              <div className="p-8">

                <div className="border-b pb-4 mb-8">
                  <h2 className="text-2xl font-bold text-gray-800">
                    View Order
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Domain and customer information
                  </p>
                </div>

                {/* Order Details */}
                <section className="mb-8">

                  <h3 className="text-lg font-semibold text-gray-700
                           border-b pb-2 mb-5">
                    Order Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2
                            gap-x-10 gap-y-5">

                    <InfoItem
                      label="Domain"
                      value={selectedOrder.domainName}
                    />

                    <InfoItem
                      label="Status"
                      value={selectedOrder.status?.name || "N/A"}
                    />

                    <InfoItem
                      label="Registration Date"
                      value={
                        selectedOrder.registrationDate
                          ? new Date(
                            selectedOrder.registrationDate
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).replaceAll(" ", "-")
                          : "N/A"
                      }
                    />

                    <InfoItem
                      label="Expiry Date"
                      value={
                        selectedOrder.expiryDate
                          ? new Date(
                            selectedOrder.expiryDate
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).replaceAll(" ", "-")
                          : "N/A"
                      }
                    />

                    <InfoItem
                      label="Subscription"
                      value={selectedOrder.subscription || "N/A"}
                    />

                    <InfoItem
                      label="Managed By"
                      value={
                        selectedOrder.managedBy ||
                        selectedOrder.managedBy ||
                        "N/A"
                      }
                    />

                  </div>
                </section>

                {/* Registrant */}
                <section className="mb-8">

                  <h3 className="text-lg font-semibold text-gray-700
                           border-b pb-2 mb-5">
                    Registrant Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2
                            gap-x-10 gap-y-5">

                    <InfoItem
                      label="Name"
                      value={selectedOrder.client?.c_name || "-"}
                    />

                    <InfoItem
                      label="Company"
                      value={selectedOrder.client?.c_company || "-"}
                    />

                    <InfoItem
                      label="Email"
                      value={
                        Array.isArray(selectedOrder.client?.c_email)
                          ? selectedOrder.client.c_email.join(", ")
                          : selectedOrder.client?.c_email || "-"
                      }
                    />

                    <InfoItem
                      label="Phone"
                      value={selectedOrder.client?.c_phone || "-"}
                    />

                    <InfoItem
                      label="Address"
                      value={selectedOrder.client?.c_address || "-"}
                    />

                    <InfoItem
                      label="City"
                      value={selectedOrder.client?.c_city || "-"}
                    />

                  </div>
                </section>

                {/* Customer */}
                <section>

                  <h3 className="text-lg font-semibold text-gray-700
                           border-b pb-2 mb-5">
                    Customer Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2
                            gap-x-10 gap-y-5">

                    <InfoItem
                      label="Name"
                      value={selectedOrder.customer?.name || "-"}
                    />

                    <InfoItem
                      label="Company"
                      value={selectedOrder.customer?.company || "-"}
                    />

                    <InfoItem
                      label="Email"
                      value={selectedOrder.customer?.email || "-"}
                    />

                    <InfoItem
                      label="Phone"
                      value={selectedOrder.customer?.phone || "-"}
                    />

                    <div className="md:col-span-2">
                      <InfoItem
                        label="Address"
                        value={selectedOrder.customer?.address || "-"}
                      />
                    </div>

                  </div>
                </section>

                {/* Footer */}
                <div className="mt-8 pt-5 border-t flex justify-end">

                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2.5
                         bg-blue-600 hover:bg-blue-700
                         text-white rounded-lg
                         font-medium transition"
                  >
                    Close
                  </button>

                </div>

              </div>
            )}

            {/* ================= EDIT ================= */}
            {modalType === "edit" && (
              <form
                onSubmit={handleSaveChanges}
                className="p-8"
              >

                {/* Header */}
                <div className="border-b pb-4 mb-8">

                  <h2 className="text-2xl font-bold text-gray-800">
                    Edit Order
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Update domain and customer information
                  </p>

                </div>

                {/* Order Information */}
                <section className="mb-8">

                  <h3 className="text-lg font-semibold text-gray-700
                           border-b pb-2 mb-5">
                    Order Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Domain */}
                    <div>
                      <label className="block text-sm font-medium
                                  text-gray-700 mb-1.5">
                        Domain
                      </label>

                      <input
                        type="text"
                        value={selectedOrder.domainName || ""}
                        readOnly
                        className="w-full border border-gray-300
                             bg-gray-100 px-3 py-2.5
                             rounded-lg text-gray-700
                             focus:outline-none"
                      />
                    </div>

                    {/* Managed By */}
                    <div>
                      <label className="block text-sm font-medium
                                  text-gray-700 mb-1.5">
                        Managed By
                      </label>

                      <input
                        type="text"
                        value={
                          selectedOrder.managedBy ||
                          selectedOrder.managedBy ||
                          ""
                        }
                        readOnly
                        className="w-full border border-gray-300
                             bg-gray-100 px-3 py-2.5
                             rounded-lg text-gray-700
                             focus:outline-none"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium
                                  text-gray-700 mb-1.5">
                        Status
                      </label>

                      <select
                        defaultValue={
                          selectedOrder.order_status ||
                          selectedOrder.status?.name ||
                          ""
                        }
                        className="w-full border border-gray-300
                             px-3 py-2.5 rounded-lg
                             text-gray-800
                             focus:outline-none
                             focus:ring-2
                             focus:ring-blue-500"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="EXPIRED">Expired</option>
                      </select>
                    </div>

                    {/* Expiry */}
                    <div>
                      <label className="block text-sm font-medium
                                  text-gray-700 mb-1.5">
                        Expiry Date
                      </label>

                      <input
                        type="date"
                        defaultValue={
                          selectedOrder.expiryDate
                            ? selectedOrder.expiryDate.slice(0, 10)
                            : ""
                        }
                        className="w-full border border-gray-300
                             px-3 py-2.5 rounded-lg
                             text-gray-800
                             focus:outline-none
                             focus:ring-2
                             focus:ring-blue-500"
                      />
                    </div>

                  </div>

                </section>

                {/* Customer Details */}
                <section>

                  <h3 className="text-lg font-semibold text-gray-700
                           border-b pb-2 mb-5">
                    Customer Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium
                                  text-gray-700 mb-1.5">
                        Customer Name
                      </label>

                      <input
                        type="text"
                        defaultValue={
                          selectedOrder.customer?.name || ""
                        }
                        className="w-full border border-gray-300
                             px-3 py-2.5 rounded-lg
                             text-gray-800
                             focus:outline-none
                             focus:ring-2
                             focus:ring-blue-500"
                      />
                    </div>

                    {/* Company */}
                    <div>
                      <label className="block text-sm font-medium
                                  text-gray-700 mb-1.5">
                        Company
                      </label>

                      <input
                        type="text"
                        defaultValue={
                          selectedOrder.customer?.company || ""
                        }
                        className="w-full border border-gray-300
                             px-3 py-2.5 rounded-lg
                             text-gray-800
                             focus:outline-none
                             focus:ring-2
                             focus:ring-blue-500"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium
                                  text-gray-700 mb-1.5">
                        Email
                      </label>

                      <input
                        type="email"
                        defaultValue={
                          selectedOrder.customer?.email || ""
                        }
                        className="w-full border border-gray-300
                             px-3 py-2.5 rounded-lg
                             text-gray-800
                             focus:outline-none
                             focus:ring-2
                             focus:ring-blue-500"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium
                                  text-gray-700 mb-1.5">
                        Phone
                      </label>

                      <input
                        type="text"
                        defaultValue={
                          selectedOrder.customer?.phone || ""
                        }
                        className="w-full border border-gray-300
                             px-3 py-2.5 rounded-lg
                             text-gray-800
                             focus:outline-none
                             focus:ring-2
                             focus:ring-blue-500"
                      />
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium
                                  text-gray-700 mb-1.5">
                        Address
                      </label>

                      <textarea
                        rows={3}
                        defaultValue={
                          selectedOrder.customer?.address || ""
                        }
                        className="w-full border border-gray-300
                             px-3 py-2.5 rounded-lg
                             text-gray-800 resize-none
                             focus:outline-none
                             focus:ring-2
                             focus:ring-blue-500"
                      />
                    </div>

                  </div>

                </section>

                {/* Footer */}
                <div className="mt-8 pt-5 border-t
                          flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5
                         bg-gray-100 hover:bg-gray-200
                         text-gray-700
                         rounded-lg font-medium
                         transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5
                         bg-blue-600 hover:bg-blue-700
                         text-white rounded-lg
                         font-medium transition"
                  >
                    Save Changes
                  </button>

                </div>

              </form>
            )}

          </div>
        </div>
      )}
    </div>



  );
};
export default Orders;