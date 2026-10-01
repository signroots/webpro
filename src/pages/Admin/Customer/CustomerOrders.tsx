
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import OrdersTable from "../Order/OrdersTable";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type TabType = "current" | "archived";

const CustomerOrders: React.FC = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<any>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<TabType>("current");

  const [loading, setLoading] = useState(true);
  const [archivedLoading, setArchivedLoading] = useState(false);

  const [error, setError] = useState("");
  const [archivedError, setArchivedError] = useState("");

  // =========================================
  // FETCH CURRENT CUSTOMER ORDERS
  // =========================================

  const fetchCustomerOrders = async () => {
    if (!customerId) return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/orders/customer_order_details/${customerId}`
      );

      console.log("Customer Order API Response:", response.data);

      if (response.data.status === "SUCCESS") {
        setCustomer(response.data.client);
        setOrders(response.data.orders || []);
      } else {
        setError("Unable to fetch customer orders.");
      }
    } catch (err) {
      console.error("Customer orders fetch error:", err);
      setError("Failed to load customer orders.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // FETCH CANCELLED / TRANSFERRED ORDERS
  // =========================================

  const fetchArchivedOrders = async () => {
    if (!customerId) return;

    setArchivedLoading(true);
    setArchivedError("");

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/orders/customer_archived_orders/${customerId}`
      );

      console.log(
        "Customer Cancelled / Transferred Orders:",
        response.data
      );

      if (response.data.success === true) {
        // Archived API response format
        setArchivedOrders(response.data.orders || []);

        // Set customer details if not already available
        if (response.data.client) {
          setCustomer((previous: any) => previous || response.data.client);
        }
      } else {
        setArchivedError(
          response.data.message || "Unable to fetch archived orders."
        );
      }
    } catch (err) {
      console.error("Archived customer orders fetch error:", err);
      setArchivedError("Failed to load cancelled / transferred orders.");
    } finally {
      setArchivedLoading(false);
    }
  };

  // =========================================
  // INITIAL FETCH
  // =========================================

  useEffect(() => {
    if (customerId) {
      setArchivedOrders([]);
      setActiveTab("current");
      fetchCustomerOrders();
    }
  }, [customerId]);

  // Fetch archived orders when the archived tab is opened.
  // Avoid fetching again if already loaded.
  useEffect(() => {
    if (activeTab === "archived" && archivedOrders.length === 0) {
      fetchArchivedOrders();
    }
  }, [activeTab, customerId]);

  // =========================================
  // EDIT ORDER
  // =========================================

  const handleEdit = (order: any) => {
    navigate(`/admin/orders/update/${order._id}`, {
      state: {
        from: "customer",
        customerId,
        highlightOrderId: order._id,
      },
    });
  };

  // =========================================
  // STATUS BADGE
  // =========================================

  const getStatusClass = (status?: {
    _id: string;
    name: string;
    code: string;
    type: "order" | "plan" | "domain";
    is_active: boolean;
  } | null): string => {
    const value = status?.name?.trim().toLowerCase();

    if (!value) {
      return "bg-blue-100 text-blue-800";
    }

    if (value === "expired") {
      return "bg-red-600 text-white";
    }

    if (value === "active") {
      return "bg-gray-100 text-green-700";
    }

    if (value === "cancelled") {
      return "bg-red-100 text-red-800";
    }

    if (value === "transferred") {
      return "bg-purple-100 text-purple-800";
    }

    return "bg-gray-200 text-gray-800";
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return <div className="p-6">Loading customer details...</div>;
  }

  // =========================================
  // SELECT ORDERS BASED ON TAB
  // =========================================

  const displayedOrders =
    activeTab === "current" ? orders : archivedOrders;

  // =========================================
  // UI
  // =========================================

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* CUSTOMER DETAILS */}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Customer Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <p>
            <b>Name:</b> {customer?.c_name || "-"}
          </p>

          <p>
            <b>Email:</b>{" "}
            {Array.isArray(customer?.c_email)
              ? customer.c_email.join(", ")
              : customer?.c_email || "-"}
          </p>

          <p>
            <b>Phone:</b>{" "}
            {customer?.c_countryCode || ""}{" "}
            {customer?.c_mobilePhone || "-"}
          </p>

          <p>
            <b>Company:</b> {customer?.c_company || "-"}
          </p>

          <p>
            <b>Address:</b> {customer?.c_address || "-"}
          </p>

          <p>
            <b>City:</b> {customer?.c_city || "-"}
          </p>

          <p>
            <b>State:</b> {customer?.c_state_name || "-"}
          </p>

          <p>
            <b>Country:</b> {customer?.c_country_name || "-"}
          </p>
        </div>
      </div>

      {/* ORDERS SECTION */}

      <div className="bg-white rounded-xl shadow-sm p-6">

        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-800">
            Customer Orders
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            View current, cancelled and transferred orders.
          </p>
        </div>

        {/* TABS */}

        <div className="flex flex-wrap gap-2 border-b mb-5">

          <button
            type="button"
            onClick={() => setActiveTab("current")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === "current"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Current Orders
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === "archived"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Cancelled / Transferred
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {archivedOrders.length}
            </span>
          </button>

        </div>

        {/* TAB CONTENT */}

        {activeTab === "current" && error && (
          <div className="p-4 mb-4 rounded bg-red-50 text-red-700 text-sm">
            {error}
            <button
              type="button"
              onClick={fetchCustomerOrders}
              className="ml-3 underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {activeTab === "archived" && archivedLoading && (
          <div className="p-6 text-center text-gray-500">
            Loading cancelled / transferred orders...
          </div>
        )}

        {activeTab === "archived" && archivedError && (
          <div className="p-4 mb-4 rounded bg-red-50 text-red-700 text-sm">
            {archivedError}
            <button
              type="button"
              onClick={fetchArchivedOrders}
              className="ml-3 underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {!(activeTab === "archived" && archivedLoading) &&
          !(activeTab === "current" && error) &&
          !(activeTab === "archived" && archivedError) && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-700">
                  {activeTab === "current"
                    ? "Current Orders"
                    : "Cancelled / Transferred Orders"}
                </h3>

                <span className="text-sm text-gray-500">
                  Total: {displayedOrders.length}
                </span>
              </div>

              {displayedOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <OrdersTable
                    paginatedOrders={displayedOrders}
                    handleEdit={handleEdit}
                    getStatusClass={getStatusClass}
                    navigate={navigate}
                  />
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed rounded-lg">
                  <p className="text-gray-500">
                    {activeTab === "current"
                      ? "No current orders found for this customer."
                      : "No cancelled or transferred orders found for this customer."}
                  </p>
                </div>
              )}
            </>
          )}

        {/* BACK BUTTON */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-5 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
        >
          ← Back
        </button>

      </div>
    </div>
  );
};

export default CustomerOrders;