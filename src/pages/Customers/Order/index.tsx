
import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchOrders, fetchOrdersByProvider } from "./api";
import OrdersTable from "../../Admin/Order/OrdersTable";
import type { Order } from "../../../types/order";

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  const navigate = useNavigate();

  // Filters
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  // Load Orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const fetchedOrders = await fetchOrders();
        setOrders(fetchedOrders);
        setAllOrders(fetchedOrders);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Status Class
  const getStatusClass = (
    status?: {
      _id: string;
      name: string;
      code: string;
      type: "order" | "plan" | "domain";
      is_active: boolean;
    } | null
  ): string => {
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

    return "bg-gray-200 text-gray-800";
  };

  // Apply Filters
  useEffect(() => {
    const applyFilters = async () => {
      let filtered: Order[] = allOrders;

      if (provider) {
        try {
          const providerOrders = await fetchOrdersByProvider(provider);
          filtered = providerOrders;
        } catch (err) {
          console.error("Failed to fetch provider orders", err);
        }
      }

      if (statusFilter) {
        filtered = filtered.filter(
          (order) =>
            order.status?.name?.toLowerCase() ===
            statusFilter.toLowerCase()
        );
      }

      setOrders(filtered);
      setCurrentPage(1);
    };

    applyFilters();
  }, [provider, statusFilter, allOrders]);

  // Search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      (order.domainName ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginatedOrders = useMemo(() => {
    if (provider) {
      return filteredOrders;
    }

    const start = (currentPage - 1) * itemsPerPage;

    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage, provider]);

  if (loading) {
    return (
      <p className="text-center text-gray-500 mt-6">
        Loading orders...
      </p>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-4 text-black">
          Orders
        </h1>

        <Link
          to="/orders/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Order
        </Link>
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Search domain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded-lg text-black"
        />
      </div>

      {/* Orders Table - Edit Hidden for Customer */}
      <OrdersTable
        paginatedOrders={paginatedOrders}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        handleEdit={() => {}}
        getStatusClass={getStatusClass}
        navigate={navigate}
        showEditAction={false}
      />

      {/* Pagination */}
      {!provider && (
        <div className="mt-4 flex justify-center gap-4 text-black">
          <button
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((page) => Math.max(1, page - 1))
            }
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="py-2">
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={
              currentPage === totalPages || totalPages === 0
            }
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(totalPages, page + 1)
              )
            }
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Orders;
