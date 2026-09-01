import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getArchivedOrders,
} from "./api";

import OrdersTable from "../../Admin/Order/OrdersTable";

import { Order } from "../../../types/order";


// =====================================================
// ARCHIVED ORDER TYPE
// =====================================================



// =====================================================
// PAGE
// =====================================================

const ArchivedOrders: React.FC = () => {

  const navigate = useNavigate();


  // =====================================================
  // STATE
  // =====================================================

const [orders, setOrders] = useState<Order[]>([]);


  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [limit] =
    useState(25);

  const [total, setTotal] =
    useState(0);

  const [search, setSearch] =
    useState("");

  const [highlightedOrderId] =
    useState<string | null>(null);


  // =====================================================
  // FETCH ARCHIVED ORDERS
  // =====================================================

  const fetchArchivedOrders = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await getArchivedOrders(
          page,
          limit,
          search
        );


      if (response?.success) {

        setOrders(
          response.data || []
        );

        setTotal(
          response.pagination?.total || 0
        );

      } else {

        setOrders([]);

        setTotal(0);

        setError(
          response?.message ||
          "Failed to load archived orders"
        );

      }

    } catch (error: any) {

      console.error(
        "ARCHIVED ORDERS ERROR:",
        error
      );

      setOrders([]);

      setTotal(0);

      setError(
        error?.message ||
        "Failed to load archived orders"
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {

    fetchArchivedOrders();

  }, [page]);


  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    setSearch(e.target.value);

    setPage(1);

  };


  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (
    status?: string
  ) => {

    switch (status) {

      case "REDEMPTION PERIOD":

        return (
          "bg-yellow-100 " +
          "text-yellow-700"
        );


      case "PENDING DELETE RESTORABLE":

        return (
          "bg-red-100 " +
          "text-red-700"
        );


      case "ACTIVE":

        return (
          "bg-green-100 " +
          "text-green-700"
        );


      case "EXPIRED":

        return (
          "bg-orange-100 " +
          "text-orange-700"
        );


      default:

        return (
          "bg-gray-100 " +
          "text-gray-600"
        );

    }

  };


  // =====================================================
  // EDIT
  // =====================================================

const handleEdit = (order: Order) => {
  navigate(`/admin/orders/update/${order._id}`, {
    state: {
      from: "archived",
    },
  });
};


  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages =
    Math.ceil(
      total / limit
    );


  const goToPreviousPage = () => {

    if (page > 1) {

      setPage(
        page - 1
      );

    }

  };


  const goToNextPage = () => {

    if (
      page < totalPages
    ) {

      setPage(
        page + 1
      );

    }

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="p-6">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center justify-between mb-6">

        <div>

          <h1 className="text-2xl font-bold text-gray-800">
            Archived Orders
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Expired orders and deletion status
          </p>

        </div>

      </div>


      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="bg-white rounded-lg shadow p-4 mb-5">

        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search domain or customer..."
          className="
            w-full
            md:w-96
            border
            border-gray-300
            rounded-lg
            px-4
            py-2
            text-sm
            outline-none
            focus:ring-2
            focus:ring-blue-500
          "
        />

      </div>


      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (

        <div className="bg-white rounded-lg shadow p-10 text-center">

          <p className="text-gray-500">
            Loading archived orders...
          </p>

        </div>

      )}


      {/* =================================================
          ERROR
      ================================================= */}

      {!loading && error && (

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">

          <p className="text-red-600">
            {error}
          </p>

        </div>

      )}


      {/* =================================================
          EMPTY
      ================================================= */}

      {!loading &&
        !error &&
        orders.length === 0 && (

          <div className="bg-white rounded-lg shadow p-10 text-center">

            <p className="text-gray-500">
              No archived orders found.
            </p>

          </div>

        )}


      {/* =================================================
          TABLE
      ================================================= */}

      {!loading &&
        !error &&
        orders.length > 0 && (

          <>

            <OrdersTable
              paginatedOrders={
                orders
              }

              currentPage={
                page
              }

              itemsPerPage={
                limit
              }

              highlightedOrderId={
                highlightedOrderId
              }

              handleEdit={
                handleEdit
              }

              getStatusClass={
                getStatusClass
              }

              navigate={
                navigate
              }

              
            />


            {/* =============================================
                PAGINATION
            ============================================= */}

            <div className="flex items-center justify-between mt-5">

              <div className="text-sm text-gray-500">

                Showing{" "}

                {total === 0
                  ? 0
                  : (page - 1) * limit + 1}

                {" "}–{" "}

                {Math.min(
                  page * limit,
                  total
                )}

                {" "}of{" "}

                {total}

              </div>


              <div className="flex items-center gap-2">

                <button
                  onClick={
                    goToPreviousPage
                  }
                  disabled={
                    page === 1
                  }
                  className="
                    px-4
                    py-2
                    border
                    rounded-lg
                    text-sm
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    hover:bg-gray-100
                  "
                >
                  Previous
                </button>


                <span className="px-3 text-sm">

                  Page {page} of{" "}
                  {totalPages || 1}

                </span>


                <button
                  onClick={
                    goToNextPage
                  }
                  disabled={
                    page >= totalPages
                  }
                  className="
                    px-4
                    py-2
                    border
                    rounded-lg
                    text-sm
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    hover:bg-gray-100
                  "
                >
                  Next
                </button>

              </div>

            </div>

          </>

        )}

    </div>

  );

};


export default ArchivedOrders;
