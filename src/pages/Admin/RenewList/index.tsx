import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaLock, FaEdit, FaSyncAlt } from "react-icons/fa";
import ServiceIcons from "../Order/ServiceIcons";
import ExpiryBadge from "../Order/ExpiryBadge";
import { fetchRenewListOrders } from "../Order/api";

type PlanType =
  | "email"
  | "storage"
  | "msoffice"
  | "hosting"
  | "website"
  | "ssl";

interface Plan {
  _id: string;
  type: PlanType;
  expiryDate?: string | null;
  emailType?: string;
  emailTypeImage?: string;
  planId?: string;
  monthly_renewlaed?: boolean;
}

interface Order {
  _id: string;
  domainName: string;
  expiryDate?: string | null;
  lockStatus?: string;
  order_status?: { _id: string; name: string } | null;
  domainSource?: { _id: string; name?: string } | null;
  Plans?: Plan[];
  client?: {
    c_name?: string;
    c_company?: string;
  };
}

interface RenewalItem {
  key: string;
  target: "domain" | "plan";
  label: string;
  planId?: string;
  currentExpiry?: string | null;
  durationMonths: number;
}

type Tab = "previous" | "current" | "next";

const API_URL = import.meta.env.VITE_API_BASE_URL;

function toDateInputValue(value?: string | Date | null): string {
  if (!value) return "";

  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Adds months while preserving the day where possible.
 * Example: 31 January + 1 month = 28 February
 * (or 29 February in a leap year).
 */
function addMonthsSafely(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();

  result.setDate(Math.min(originalDay, lastDay));

  return result;
}

/**
 * Matches the backend policy:
 * - Future expiry: extend from existing expiry.
 * - Expired/no expiry: start from today.
 */
function calculateNewExpiry(
  currentExpiry: string | null | undefined,
  durationMonths: number
): string {
  const now = new Date();
  const currentInput = toDateInputValue(currentExpiry);

  let baseDate: Date;

  if (currentInput) {
    const [year, month, day] = currentInput.split("-").map(Number);

    baseDate = new Date(year, month - 1, day, 12, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDay = new Date(year, month - 1, day);
    expiryDay.setHours(0, 0, 0, 0);

    if (expiryDay.getTime() < today.getTime()) {
      baseDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        12,
        0,
        0
      );
    }
  } else {
    baseDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      12,
      0,
      0
    );
  }

  return toDateInputValue(addMonthsSafely(baseDate, durationMonths));
}

function displayDate(value?: string | null): string {
  const date = toDateInputValue(value);

  if (!date) return "Not available";

  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
}

function statusClass(status?: string): string {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "EXPIRED":
      return "bg-red-100 text-red-700";
    case "WARNING":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

const RenewList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState<Tab>("current");
  const [search, setSearch] = useState("");

  const [renewOrder, setRenewOrder] = useState<Order | null>(null);
  const [renewDates, setRenewDates] = useState<Record<string, string>>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [renewStep, setRenewStep] = useState<"dates" | "confirm">("dates");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const itemsPerPage = 50;

  const loadOrders = async () => {
    setLoading(true);

    try {
      const response = await fetchRenewListOrders(selectedTab);
      setOrders(response?.data?.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load renewal orders:", err);
      setError("Failed to load renewal orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [selectedTab]);

  const getRenewalItems = (order: Order): RenewalItem[] => {
    const items: RenewalItem[] = [];

    if (order.domainSource?._id && order.expiryDate) {
      items.push({
        key: "domain",
        target: "domain",
        label: `Domain — ${order.domainName}`,
        currentExpiry: order.expiryDate,
        durationMonths: 12,
      });
    }

    (order.Plans || []).forEach((plan) => {
      if (!plan._id || !plan.expiryDate) return;

      const durationMonths =
        plan.monthly_renewlaed === true ? 1 : 12;

      items.push({
        key: `plan-${plan._id}`,
        target: "plan",
        planId: plan._id,
        label: `${plan.type.toUpperCase()} Plan`,
        currentExpiry: plan.expiryDate,
        durationMonths,
      });
    });

    return items;
  };

  const openRenewPopup = (order: Order) => {
    const items = getRenewalItems(order);

    if (!items.length) {
      window.alert("No renewable domain or service plan was found.");
      return;
    }

    const dates: Record<string, string> = {};

    items.forEach((item) => {
      dates[item.key] = calculateNewExpiry(
        item.currentExpiry,
        item.durationMonths
      );
    });

    setRenewOrder(order);
    setRenewDates(dates);
    setSelectedItems(items.map((item) => item.key));
    setRenewStep("dates");
    setError("");
    setSuccess("");
  };

  const closeRenewPopup = () => {
    if (saving) return;

    setRenewOrder(null);
    setRenewDates({});
    setSelectedItems([]);
    setRenewStep("dates");
    setError("");
  };

  const renewalItems = renewOrder
    ? getRenewalItems(renewOrder)
    : [];

  const selectedRenewalItems = renewalItems.filter((item) =>
    selectedItems.includes(item.key)
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) =>
        order.domainName.toLowerCase().includes(search.toLowerCase())
      ),
    [orders, search]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / itemsPerPage)
  );

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getExpiryStatus = (order: Order) => {
    const dates = [
      order.expiryDate,
      ...(order.Plans || []).map((plan) => plan.expiryDate),
    ]
      .filter(Boolean)
      .map((date) => new Date(date as string).getTime())
      .filter(Number.isFinite);

    if (!dates.length) return "normal";

    const nearest = new Date(Math.min(...dates));
    nearest.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Math.ceil(
      (nearest.getTime() - today.getTime()) / 86400000
    );

    if (days < 0) return "expired";
    if (days <= 15) return "warning";

    return "active";
  };

  const expiredCount = orders.filter(
    (order) => getExpiryStatus(order) === "expired"
  ).length;

  const warningCount = orders.filter(
    (order) => getExpiryStatus(order) === "warning"
  ).length;

  const activeCount = orders.length - expiredCount - warningCount;

  const confirmRenewal = async () => {
    if (!renewOrder || !selectedRenewalItems.length) {
      setError("Select at least one service to renew.");
      return;
    }

    for (const item of selectedRenewalItems) {
      const selectedDate = renewDates[item.key];

      if (
        !selectedDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
      ) {
        setError(`Select a valid expiry date for ${item.label}.`);
        return;
      }

      const [year, month, day] = selectedDate.split("-").map(Number);
      const parsed = new Date(year, month - 1, day);

      if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
      ) {
        setError(`Select a valid expiry date for ${item.label}.`);
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/orders/${renewOrder._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            renewals: selectedRenewalItems.map((item) => ({
              target: item.target,
              ...(item.target === "plan"
                ? { planId: item.planId }
                : {}),
              durationMonths: item.durationMonths,
              expiryDate: renewDates[item.key],
            })),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Renewal failed.");
      }

      setSuccess("Renewal completed successfully.");
      setRenewOrder(null);
      setRenewDates({});
      setSelectedItems([]);
      setRenewStep("dates");

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to renew selected services."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="mt-10 text-center text-gray-500">
        Loading renewals...
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Renewal Management
        </h1>
        <p className="mt-1 text-gray-500">
          Manage domain and service plan expiry dates.
        </p>
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-green-100 p-3 text-green-800">
          {success}
          <button
            className="ml-3 underline"
            onClick={() => setSuccess("")}
          >
            Dismiss
          </button>
        </div>
      )}

      {error && !renewOrder && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">
          {error}
          <button
            className="ml-3 underline"
            onClick={() => setError("")}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Expired</p>
          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {expiredCount}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Expires Within 15 Days
          </p>
          <h2 className="mt-2 text-3xl font-bold text-orange-500">
            {warningCount}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {activeCount}
          </h2>
        </div>
      </div>

      <div className="mb-5 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="inline-flex rounded-xl bg-gray-200 p-1">
          {(
            [
              ["previous", "Previous Month"],
              ["current", "Current Month"],
              ["next", "Next Month"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedTab(tab)}
              className={`rounded-lg px-5 py-2 text-sm ${
                selectedTab === tab
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search domain..."
          className="w-full rounded-lg border bg-white px-4 py-2 md:w-80"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-16 px-4 py-4">SL No</th>
                <th className="w-64 px-4 py-4 text-left">Domain</th>
                <th className="w-56 px-4 py-4 text-left">Customer</th>
                <th className="w-44 px-4 py-4">Services</th>
                <th className="w-36 px-4 py-4">Expiry Date</th>
                <th className="w-32 px-4 py-4">Status</th>
                <th className="w-48 px-4 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedOrders.map((order, index) => (
                <tr
                  key={order._id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-4 py-4 text-center">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <FaLock
                        className={
                          order.lockStatus === "Locked"
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      />
                      <span className="truncate">{order.domainName}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {order.client?.c_company ||
                      order.client?.c_name ||
                      "N/A"}
                  </td>

                  <td className="px-4 py-4">
                    <ServiceIcons order={order} />
                  </td>

                  <td className="px-4 py-4 text-center">
                    <ExpiryBadge order={order} />
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`rounded-md px-2 py-1 text-xs ${statusClass(
                        order.order_status?.name
                      )}`}
                    >
                      {order.order_status?.name || "-"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        to={`/admin/orders/update/${order._id}`}
                        state={{ from: "renewal" }}
                        title="Edit"
                        className="text-yellow-500"
                      >
                        <FaEdit />
                      </Link>

                      <button
                        type="button"
                        onClick={() => openRenewPopup(order)}
                        title="Renew"
                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white"
                      >
                        <FaSyncAlt />
                        Renew
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!paginatedOrders.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    No renewal orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-5">
        <button
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="rounded-lg border bg-white px-4 py-2 disabled:opacity-50"
        >
          Previous
        </button>

        <span>
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage >= totalPages}
          onClick={() =>
            setCurrentPage((p) => Math.min(totalPages, p + 1))
          }
          className="rounded-lg border bg-white px-4 py-2 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {renewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {renewStep === "dates"
                  ? "Select Renewal Items"
                  : "Confirm Renewal"}
              </h2>

              <button
                type="button"
                onClick={closeRenewPopup}
                disabled={saving}
                className="text-2xl text-gray-500"
              >
                ×
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              Domain: <strong>{renewOrder.domainName}</strong>
            </p>

            {error && (
              <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">
                {error}
              </p>
            )}

            {renewStep === "dates" ? (
              <>
                <p className="mb-4 text-sm text-gray-600">
                  Select the domain or plans you want to renew.
                  The suggested date follows the monthly/yearly renewal rule.
                </p>

                <div className="space-y-4">
                  {renewalItems.map((item) => {
                    const checked = selectedItems.includes(item.key);

                    return (
                      <div
                        key={item.key}
                        className="rounded-lg border p-4"
                      >
                        <label className="flex items-center gap-3 font-medium">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setSelectedItems((previous) =>
                                event.target.checked
                                  ? [...previous, item.key]
                                  : previous.filter(
                                      (key) => key !== item.key
                                    )
                              );
                            }}
                          />
                          {item.label}
                          <span className="text-xs text-gray-500">
                            ({item.durationMonths} month
                            {item.durationMonths === 1 ? "" : "s"})
                          </span>
                        </label>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-sm text-gray-500">
                              Current expiry
                            </p>
                            <p>{displayDate(item.currentExpiry)}</p>
                          </div>

                          <div>
                            <label className="mb-1 block text-sm">
                              New expiry date
                            </label>
                            <input
                              type="date"
                              disabled={!checked}
                              min={toDateInputValue(new Date())}
                              value={renewDates[item.key] || ""}
                              onChange={(event) =>
                                setRenewDates((previous) => ({
                                  ...previous,
                                  [item.key]: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border p-2 disabled:bg-gray-100"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={closeRenewPopup}
                    className="rounded-lg border px-4 py-2"
                  >
                    Cancel
                  </button>

                  <button
                    disabled={
                      !selectedRenewalItems.length ||
                      selectedRenewalItems.some(
                        (item) => !renewDates[item.key]
                      )
                    }
                    onClick={() => {
                      setError("");
                      setRenewStep("confirm");
                    }}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600">
                  Check the selected services and expiry dates before saving.
                </p>

                <div className="space-y-3 rounded-lg border p-4">
                  {selectedRenewalItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex justify-between gap-4 border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-500">
                          Old: {displayDate(item.currentExpiry)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Duration: {item.durationMonths} month
                          {item.durationMonths === 1 ? "" : "s"}
                        </p>
                      </div>

                      <p className="font-semibold text-green-700">
                        {displayDate(renewDates[item.key])}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    disabled={saving}
                    onClick={() => setRenewStep("dates")}
                    className="rounded-lg border px-4 py-2"
                  >
                    Back
                  </button>

                  <button
                    disabled={saving}
                    onClick={confirmRenewal}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Confirm Renewal"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RenewList;