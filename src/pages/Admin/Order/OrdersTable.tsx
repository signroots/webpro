
import React from "react";
import {
  FaEye,
  FaEdit,
  FaLock,
  FaExternalLinkAlt,
  FaCopy,
  FaSyncAlt,
} from "react-icons/fa";

import {
  Link,
  NavigateFunction,
} from "react-router-dom";

import ServiceIcons from "./ServiceIcons";
import ExpiryBadge from "./ExpiryBadge";
import { useAuth } from "../../../Common/AuthContext/Auth";

/* =========================================================
   PROPS
========================================================= */

interface OrdersTableProps {
  paginatedOrders: any[];

  currentPage?: number;
  itemsPerPage?: number;

  highlightedOrderId?: string | null;

  handleEdit: (order: any) => void;

  getStatusClass: (status?: any | null) => string;

  navigate: NavigateFunction;

  showDomainStatus?: boolean;

  hideExpiredDates?: boolean;

  showRenewalActions?: boolean;

  handleRenew?: (order: any) => void;

  handleCopyNotification?: (order: any) => void;

  showEditAction?: boolean;
}

/* =========================================================
   COMPONENT
========================================================= */

const OrdersTable: React.FC<OrdersTableProps> = ({
  paginatedOrders,
  currentPage,
  itemsPerPage,
  highlightedOrderId,
  handleEdit,
  getStatusClass,
  navigate,
  showDomainStatus = false,
  hideExpiredDates = false,
  showRenewalActions = false,
  handleRenew,
  handleCopyNotification,
  showEditAction = true,
}) => {
  const { user } = useAuth();

  const userType = user?.type;

  const isArchivedPage = showDomainStatus === true;

  // Edit is available only when explicitly enabled for an admin.
  const canShowEdit = user?.type === "admin" && showEditAction;
  console.log("ORDERS TABLE DEBUG:", {
  userType: user?.type,
  showEditAction,
  canShowEdit,
});

  return (
    <div className="bg-white shadow rounded-lg overflow-x-auto">
      <table className="w-full min-w-[1100px] table-fixed divide-y divide-gray-200 text-sm">

        {/* HEADER */}
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

            <th className="w-[140px] px-3 py-3 text-center">
              Expiry Date
            </th>

            <th className="w-[150px] px-3 py-3 text-center">
              Status
            </th>

            <th className="w-[150px] px-3 py-3 text-center">
              Actions
            </th>
          </tr>
        </thead>

        {/* BODY */}
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

              {/* DOMAIN AND CUSTOMER */}
              <td className="px-3 py-4">
                <div className="flex items-center">
                  {order.lockStatus === "Locked" ? (
                    <FaLock
                      className="text-red-500 w-4 h-4 shrink-0 mr-1.5"
                      title="Locked"
                    />
                  ) : (
                    <FaLock
                      className="text-green-500 w-4 h-4 shrink-0 mr-1.5"
                      title="Unlocked"
                    />
                  )}

                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className="truncate font-medium text-[16px] leading-5"
                        title={order.domainName}
                      >
                        {order.domainName}
                      </span>

                      {/* COPY DOMAIN */}
                      <button
                        type="button"
                        title="Copy Domain"
                        className="shrink-0 text-gray-400 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();

                          navigator.clipboard.writeText(
                            order.domainName
                          );
                        }}
                      >
                        <FaCopy className="w-3 h-3" />
                      </button>

                      {/* OPEN DOMAIN */}
                      <FaExternalLinkAlt
                        className="w-3 h-3 shrink-0 text-gray-500 cursor-pointer hover:text-blue-600"
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

                    {/* CUSTOMER */}
                    {userType === "admin" && order.client ? (
                      <Link
                        to={`/admin/orders/customer/${order.client._id}`}
                        className="truncate text-sm text-blue-600 leading-5 hover:underline"
                        title={
                          order.client.c_company ||
                          order.client.c_name
                        }
                      >
                        {order.client.c_company ||
                          order.client.c_name ||
                          "N/A"}
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-xs leading-5">
                        &nbsp;
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* SERVICES */}
              <td className="px-4 py-4 text-left">
                <div className="flex items-center">
                  <ServiceIcons
                    order={order}
                    isArchivedPage={isArchivedPage}
                  />
                </div>
              </td>

              {/* EXPIRY */}
              <td className="px-3 py-4 text-center align-middle">
                <div className="flex w-full items-center justify-center text-center">
                  <ExpiryBadge
                    order={order}
                    isArchivedPage={isArchivedPage}
                    hideExpiredDates={hideExpiredDates}
                  />
                </div>
              </td>

              {/* STATUS */}
              <td className="px-3 py-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(
                      order.order_status
                    )}`}
                  >
                    {showDomainStatus
                      ? `Order: ${
                          order.order_status?.name || "N/A"
                        }`
                      : order.order_status?.name || "N/A"}
                  </span>

                  {showDomainStatus && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(
                        order.archived_status ||
                          order.domain_status
                      )}`}
                    >
                      Domain:{" "}
                      {order.archived_status?.name ||
                        order.domain_status?.name ||
                        "N/A"}
                    </span>
                  )}
                </div>
              </td>

              {/* ACTIONS */}
              <td className="px-3 py-4">
                <div className="flex justify-center items-center gap-4 text-gray-500">
                  {showRenewalActions ? (
                    <>
                      {/* EDIT */}
                      {canShowEdit && (
                        <button
                          type="button"
                          onClick={() => handleEdit(order)}
                          className="text-yellow-500 hover:text-yellow-600"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      )}

                      {/* RENEW */}
                      <button
                        type="button"
                        onClick={() => handleRenew?.(order)}
                        className="text-green-600 hover:text-blue-600"
                        title="Renew"
                      >
                        <FaSyncAlt className="w-4 h-4" />
                      </button>

                      {/* COPY NOTIFICATION */}
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyNotification?.(order)
                        }
                        className="text-blue-600 hover:text-blue-800"
                        title="Copy Renewal Notification"
                      >
                        <FaCopy className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* VIEW */}
                      <button
                        type="button"
                        className="hover:text-blue-600"
                        title="View"
                        onClick={() =>
                          navigate(
                            showDomainStatus
                              ? `/admin/archived/order-details/${order._id}`
                              : `/admin/orders/order-details/${order._id}`,
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
                      {canShowEdit && (
                        <button
                          type="button"
                          onClick={() => handleEdit(order)}
                          className="hover:text-yellow-600"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {!paginatedOrders.length && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-gray-500"
              >
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
