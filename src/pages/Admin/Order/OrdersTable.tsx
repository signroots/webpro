
import React, { useState } from "react";
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
  handleCopyNotification?: (order: any) => Promise<boolean>;
  showEditAction?: boolean;
}

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
  const canShowEdit = user?.type === "admin" && showEditAction;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showCopied = (key: string) => {
    setCopiedKey(key);

    window.setTimeout(() => {
      setCopiedKey((current) =>
        current === key ? null : current
      );
    }, 2000);
  };

  const copyDomain = async (order: any) => {
    try {
      await navigator.clipboard.writeText(order.domainName);
      showCopied(`domain-${order._id}`);
    } catch (error) {
      console.error("Domain copy failed:", error);
      window.alert("Unable to copy domain.");
    }
  };

  const copyNotification = async (order: any) => {
    try {
      const copied = await handleCopyNotification?.(order);

      if (copied) {
        showCopied(`notification-${order._id}`);
      }
    } catch (error) {
      console.error("Notification copy failed:", error);
    }
  };

  // Open Order Details
  const handleView = (order: any) => {
    navigate(
      showDomainStatus
        ? `/admin/archived/order-details/${order._id}`
        : `/admin/orders/order-details/${order._id}`,
      {
        state: {
          fromPage: currentPage,
          from: showRenewalActions ? "renewal" : undefined,
        },
      }
    );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-x-auto">
      <table className="w-full min-w-[1100px] table-fixed divide-y divide-gray-200 text-sm">

        <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
          <tr>
            <th className="w-[60px] px-3 py-3 text-center">SL No</th>
            <th className="w-[350px] px-3 py-3 text-left">Domain Name</th>
            <th className="w-[200px] px-3 py-3 text-left">Services</th>
            <th className="w-[140px] px-3 py-3 text-center">Expiry Date</th>
            <th className="w-[150px] px-3 py-3 text-center">Status</th>
            <th className="w-[150px] px-3 py-3 text-center">Actions</th>
          </tr>
        </thead>

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
              <td className="px-3 py-4 text-center">
                {currentPage && itemsPerPage
                  ? (currentPage - 1) * itemsPerPage + idx + 1
                  : idx + 1}
              </td>

              {/* DOMAIN AND CUSTOMER */}
              <td className="px-3 py-4">
                <div className="flex items-center">
                  <FaLock
                    className={`w-4 h-4 shrink-0 mr-1.5 ${
                      order.lockStatus === "Locked"
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                    title={
                      order.lockStatus === "Locked"
                        ? "Locked"
                        : "Unlocked"
                    }
                  />

                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className="truncate font-medium text-[16px] leading-5"
                        title={order.domainName}
                      >
                        {order.domainName}
                      </span>

                      {/* COPY DOMAIN */}
                      <div className="relative flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          title="Copy Domain"
                          className="text-gray-400 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            void copyDomain(order);
                          }}
                        >
                          <FaCopy className="w-3 h-3" />
                        </button>

                        {copiedKey === `domain-${order._id}` && (
                          <span className="text-xs font-medium text-green-600 whitespace-nowrap">
                            Copied
                          </span>
                        )}
                      </div>

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
                      ? `Order: ${order.order_status?.name || "N/A"}`
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
                      {/* VIEW - RENEWAL PAGE */}
                      <button
                        type="button"
                        onClick={() => handleView(order)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="View Order Details"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>

                      {/* RENEW */}
                      <button
                        type="button"
                        onClick={() => handleRenew?.(order)}
                        className="text-green-600 hover:text-green-700 transition-colors"
                        title="Renew"
                      >
                        <FaSyncAlt className="w-4 h-4" />
                      </button>

                      {/* COPY NOTIFICATION */}
                      <div className="relative flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void copyNotification(order)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Copy Renewal Notification"
                        >
                          <FaCopy className="w-4 h-4" />
                        </button>

                        {copiedKey === `notification-${order._id}` && (
                          <span className="text-xs font-medium text-green-600 whitespace-nowrap">
                            Copied
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* VIEW */}
                      <button
                        type="button"
                        className="hover:text-blue-600"
                        title="View"
                        onClick={() => handleView(order)}
                      >
                        <FaEye className="w-4 h-4" />
                      </button>

                      {/* EDIT - OTHER PAGES */}
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
