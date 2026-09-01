import React from "react";
import { FaEye, FaEdit, FaLock, FaExternalLinkAlt,FaCopy } from "react-icons/fa";
import { Link, NavigateFunction } from "react-router-dom";
// import { Order } from "./index";
import { Order } from "../../../types/order";
import ServiceIcons from "./ServiceIcons";
import ExpiryBadge from "./ExpiryBadge";
import { useAuth } from "../../../Common/AuthContext/Auth";
// interface Order {
//   _id: string;
//   domainName: string;
//   lockStatus?: string;
//   order_status?: string;

//   client?: {
//     _id: string;
//     c_company?: string;
//     c_name?: string;
//   };
// }

interface OrdersTableProps {
  paginatedOrders: Order[];
  currentPage?: number;
  itemsPerPage?: number;
  highlightedOrderId?: string | null;
  userType?: string;
  //  isArchived?: boolean;
  // setSelectedOrder: (order: Order) => void;

  // setModalType: (
  //   type: "view" | "edit" | "addCustomer" | null
  // ) => void;

  handleEdit: (order: Order) => void;

  getStatusClass: (status?: string) => string;

  navigate: NavigateFunction;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  paginatedOrders,
  currentPage,
  itemsPerPage,
  highlightedOrderId,
  handleEdit,
  getStatusClass,
  navigate,
  // isArchived = false,
}) => {
  const { user } = useAuth();

  const userType = user?.type;

  console.log("AUTH USER:", user);
  console.log("USER TYPE:", userType);

  return (
    <div className="bg-white shadow rounded-lg overflow-x-auto">

      <table className="w-full table-fixed divide-y divide-gray-200 text-sm">

        {/* ================= HEADER ================= */}

        <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">

          <tr>

            <th className="w-[60px] px-3 py-3 text-center">
              SL No
            </th>

            <th className="w-[350px] px-3 py-3 text-left">
              Domain Name
            </th>

            <th className="w-[200px] px-3 py-3 text-left">
              Services
            </th>

            <th className="w-[140px] px-3 py-3 text-left">
              Expiry Date
            </th>

            <th className="w-[120px] px-3 py-3 text-center">
              Status
            </th>

            <th className="w-[120px] px-3 py-3 text-center">
              Actions
            </th>

          </tr>

        </thead>


        {/* ================= BODY ================= */}

        <tbody className="divide-y divide-gray-100 text-gray-900">

          {paginatedOrders.map((order, idx) => (

            <tr
              key={order._id}
              className={`transition-all duration-500 ${
                highlightedOrderId === order._id
                  ? "bg-blue-50 border-l-4 border-blue-500"
                  : "hover:bg-gray-50"
              }`}
            >

              {/* SL NO */}

              <td className="px-3 py-4 text-center">

       {currentPage && itemsPerPage
  ? (currentPage - 1) * itemsPerPage + idx + 1
  : idx + 1}

              </td>


              {/* DOMAIN */}
<td className="px-3 py-4">
  <div className="flex items-center">

    {/* LOCK - vertically centered between domain & customer */}
    {order.lockStatus === "Locked" ? (
      <FaLock className="text-red-500 w-4 h-4 shrink-0 mr-1.5" />
    ) : (
      <FaLock className="text-green-500 w-4 h-4 shrink-0 mr-1.5" />
    )}

    {/* DOMAIN + CUSTOMER */}
    <div className="flex flex-col">

      {/* Domain */}
      <div className="flex items-center gap-1">
        <span className="font-medium text-[16px] leading-5">
          {order.domainName}
        </span>
 {/* Copy Domain */}
          <button
            type="button"
            title="Copy Domain"
            className="text-gray-400 hover:text-blue-600"
            onClick={(e) => {
              e.stopPropagation();

              navigator.clipboard.writeText(
                order.domainName
              );
            }}
          >
            <FaCopy className="w-3 h-3" />
          </button>
        <FaExternalLinkAlt
          className="w-3 h-3 text-gray-500 cursor-pointer hover:text-blue-600"
          title="Open Domain"
          onClick={(e) => {
            e.stopPropagation();

            window.open(
              `https://${order.domainName}`,
              "_blank"
            );
          }}
        />
      </div>

{/* Customer */}
{userType === "admin" && order.client ? (
  <Link
    to={`/admin/orders/customer/${order.client._id}`}
    className="text-sm text-blue-600 leading-5"
  >
    {order.client.c_company || order.client.c_name}
  </Link>
) : (
  <span className="text-gray-400 text-xs leading-5"></span>
)}
    </div>

  </div>
</td>


              {/* SERVICES */}

              <td className="px-4 py-4 text-left">

                <div className="flex items-center">

                  <ServiceIcons order={order} />

                </div>

              </td>


              {/* EXPIRY */}

              <td className="px-3 py-4 text-center">

                <ExpiryBadge order={order} />

              </td>


              {/* STATUS */}

              <td className="px-3 py-4 text-center">

                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(
                    order.order_status
                  )}`}
                >
                  {order.order_status || "N/A"}
                </span>

              </td>


              {/* ACTIONS */}

              <td className="px-3 py-4">

                <div className="flex justify-center gap-3 text-gray-500">

                  {/* VIEW */}

                  <button
                    className="hover:text-blue-600"
                    title="View"
                    onClick={() =>
                      navigate(
                        `/admin/orders/order-details/${order._id}`,
                        {
                          state: {
                            fromPage: currentPage,
                          },
                        }
                      )
                    }
                  >
                    <FaEye className="w-4 h-4" />
                  </button>


                  {/* EDIT */}

                  <button
                    onClick={() => handleEdit(order)}
                    className="hover:text-yellow-600"
                    title="Edit"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>

                </div>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
};

export default OrdersTable;