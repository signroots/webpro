import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import OrdersTable from "../Order/OrdersTable";
import { fetchRenewListOrders } from "../Order/api";

type PlanType =
  | "email"
  | "storage"
  | "msoffice"
  | "hosting"
  | "website"
  | "ssl";

type Tab = "previous" | "current" | "next";
type RenewalTarget = "domain" | "plan";
type RenewalDuration = 1 | 12;

interface Plan {
  _id: string;
  type: PlanType;
  expiryDate?: string | null;
  emailType?: string;
  emailTypeImage?: string;
  planId?: string;
  monthly_renewlaed?: boolean;
  noOfUsers?: number;
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
    _id?: string;
    c_name?: string;
    c_company?: string;
  };
  archived_status?: any;
  domain_status?: any;
}

interface RenewalItem {
  key: string;
  target: RenewalTarget;
  label: string;
  planId?: string;
  currentExpiry?: string | null;
  durationMonths: RenewalDuration;
  monthlyLocked?: boolean;
  currentUsers?: number;
}
const API_URL = import.meta.env.VITE_API_BASE_URL;

/* =========================================================
   DATE HELPERS
========================================================= */

function toDateInputValue(
  value?: string | Date | null
): string {
  if (!value) return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";

    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, "0"),
      String(value.getDate()).padStart(2, "0"),
    ].join("-");
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    if (
      parsed.getFullYear() !== Number(year) ||
      parsed.getMonth() !== Number(month) - 1 ||
      parsed.getDate() !== Number(day)
    ) {
      return "";
    }

    return `${year}-${month}-${day}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addMonthsSafely(
  date: Date,
  months: number
): Date {
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

function calculateNewExpiry(
  currentExpiry: string | null | undefined,
  durationMonths: number
): string {
  const currentInput = toDateInputValue(currentExpiry);

  let baseDate: Date;

  if (currentInput) {
    const [year, month, day] = currentInput
      .split("-")
      .map(Number);

    baseDate = new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0
    );
  } else {
    const today = new Date();

    baseDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
      0,
      0
    );
  }

  return toDateInputValue(
    addMonthsSafely(baseDate, durationMonths)
  );
}

function formatExpiryDate(
  value?: string | null
): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })
    .replace(/ /g, "-");
}

function displayDate(
  value?: string | null
): string {
  const date = toDateInputValue(value);

  if (!date) return "Not available";

  const [year, month, day] = date.split("-");

  return `${day}-${month}-${year}`;
}

/* =========================================================
   STATUS
========================================================= */

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

const getStatusClass = (status?: any | null): string => {
  const statusName =
    typeof status === "string"
      ? status
      : status?.name || "";

  return statusClass(statusName);
};

/* =========================================================
   COPY RENEWAL NOTIFICATION
========================================================= */


const copyRenewalNotification = async (
  order: Order
): Promise<boolean> => {
  const plans = order.Plans || [];

  const emailPlans = plans.filter(
    (plan) =>
      plan.type === "email" ||
      plan.type === "msoffice"
  );

  const hostingPlans = plans.filter(
    (plan) => plan.type === "hosting"
  );

  const notification = [
    "RENEWAL NOTIFICATION",
    "",
    order.domainName,
    `Domain: ${order.domainSource?._id ? "Yes" : "No"}`,
    "",
    emailPlans.length
      ? emailPlans
          .map(
            (plan) =>
              `Email: ${plan.emailType || "N/A"}\n` +
              `No. of Users: ${plan.noOfUsers ?? 0}\n` +
              `Expiry Date: ${formatExpiryDate(plan.expiryDate)}`
          )
          .join("\n\n")
      : "Email: No",
    "",
    hostingPlans.length
      ? hostingPlans
          .map(
            (plan) =>
              `Hosting: Yes\n` +
              `Expiry Date: ${formatExpiryDate(plan.expiryDate)}`
          )
          .join("\n\n")
      : "Hosting: No",
  ].join("\n");

  try {
    let copied = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(notification);
        copied = true;
      } catch (error) {
        console.warn("Clipboard API failed:", error);
      }
    }

    if (!copied) {
      const textarea = document.createElement("textarea");

      textarea.value = notification;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        copied = document.execCommand("copy");
      } finally {
        document.body.removeChild(textarea);
      }
    }

    if (!copied) {
      throw new Error("Copy command failed");
    }

    return true;
  } catch (error) {
    console.error("Copy failed:", error);

    window.alert("Unable to copy. Please try again.");

    return false;
  }
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const RenewList: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedTab, setSelectedTab] =
    useState<Tab>("current");

  const [search, setSearch] = useState("");

  const [renewOrder, setRenewOrder] =
    useState<Order | null>(null);

  const [renewDates, setRenewDates] = useState<
    Record<string, string>
  >({});

  const [renewalDurations, setRenewalDurations] =
    useState<Record<string, RenewalDuration>>({});

  const [selectedItems, setSelectedItems] =
    useState<string[]>([]);
  const [licenseCounts, setLicenseCounts] = useState<
  Record<string, number>
>({});
  const [renewStep, setRenewStep] = useState<
    "dates" | "confirm"
  >("dates");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const itemsPerPage = 50;

  /* =====================================================
     LOAD ORDERS
  ===================================================== */

  const loadOrders = async () => {
    setLoading(true);

    try {
      const response =
        await fetchRenewListOrders(selectedTab);

      setOrders(response?.data?.data || []);
      setCurrentPage(1);
      setError("");
    } catch (err) {
      console.error(
        "Failed to load renewal orders:",
        err
      );

      setError("Failed to load renewal orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [selectedTab]);

  /* =====================================================
     GET RENEWAL ITEMS
  ===================================================== */

  const getRenewalItems = (order: Order): RenewalItem[] => {
  const items: RenewalItem[] = [];

  // Domain renewal
  if (order.domainSource?._id && order.expiryDate) {
    items.push({
      key: "domain",
      target: "domain",
      label: `Domain — ${order.domainName}`,
      currentExpiry: order.expiryDate,
      durationMonths: 12,
    });
  }

  // Service plan renewal - add each plan only once
  (order.Plans || []).forEach((plan) => {
    if (!plan._id || !plan.expiryDate) return;

    const monthlyLocked =
      plan.monthly_renewlaed === true;

    const isEmailPlan =
      plan.type === "email" ||
      plan.type === "msoffice";

    items.push({
      key: `plan-${plan._id}`,
      target: "plan",
      planId: plan._id,
      label: `${plan.type.toUpperCase()} Plan`,
      currentExpiry: plan.expiryDate,
      durationMonths: monthlyLocked ? 1 : 12,
      monthlyLocked,

      // License quantity only for Email and MS Office
      currentUsers: isEmailPlan
        ? plan.noOfUsers ?? 0
        : undefined,
    });
  });

  return items;
};

  /* =====================================================
     OPEN RENEW POPUP
  ===================================================== */

  const openRenewPopup = (order: Order) => {
    const items = getRenewalItems(order);

    if (!items.length) {
      window.alert(
        "No renewable domain or service plan was found."
      );

      return;
    }

    const dates: Record<string, string> = {};
    const durations: Record<
      string,
      RenewalDuration
    > = {};

const initialLicenseCounts: Record<string, number> = {};

items.forEach((item) => {
  durations[item.key] = item.durationMonths;

  dates[item.key] = calculateNewExpiry(
    item.currentExpiry,
    item.durationMonths
  );

  if (item.currentUsers !== undefined) {
    initialLicenseCounts[item.key] = item.currentUsers;
  }
});

    setRenewOrder(order);
    setRenewDates(dates);
    setRenewalDurations(durations);
setLicenseCounts(initialLicenseCounts);
    setSelectedItems(
      items.map((item) => item.key)
    );

    setRenewStep("dates");
    setError("");
    setSuccess("");
  };

  /* =====================================================
     CLOSE RENEW POPUP
  ===================================================== */

  const closeRenewPopup = () => {
    if (saving) return;

    setRenewOrder(null);
    setRenewDates({});
    setRenewalDurations({});
    setSelectedItems([]);
    setRenewStep("dates");
    setError("");
  };

  /* =====================================================
     RENEWAL ITEMS
  ===================================================== */

  const renewalItems = renewOrder
    ? getRenewalItems(renewOrder)
    : [];

  const itemsWithSelectedDuration =
    renewalItems.map((item) => ({
      ...item,
      durationMonths:
        renewalDurations[item.key] ??
        item.durationMonths,
    }));

  const selectedRenewalItems =
    itemsWithSelectedDuration.filter((item) =>
      selectedItems.includes(item.key)
    );

  /* =====================================================
     CHANGE DURATION
  ===================================================== */

  const handleDurationChange = (
    item: RenewalItem,
    duration: RenewalDuration
  ) => {
    if (item.monthlyLocked) return;

    setRenewalDurations((previous) => ({
      ...previous,
      [item.key]: duration,
    }));

    setRenewDates((previous) => ({
      ...previous,
      [item.key]: calculateNewExpiry(
        item.currentExpiry,
        duration
      ),
    }));

    setError("");
  };

  /* =====================================================
     SEARCH AND PAGINATION
  ===================================================== */

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) =>
        order.domainName
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [orders, search]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOrders.length / itemsPerPage
    )
  );

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* =====================================================
     EXPIRY STATUS
  ===================================================== */

  const getExpiryStatus = (order: Order) => {
    const dates = [
      order.expiryDate,
      ...(order.Plans || []).map(
        (plan) => plan.expiryDate
      ),
    ]
      .filter(Boolean)
      .map((date) =>
        new Date(date as string).getTime()
      )
      .filter(Number.isFinite);

    if (!dates.length) return "normal";

    const nearest = new Date(
      Math.min(...dates)
    );

    nearest.setHours(0, 0, 0, 0);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const days = Math.ceil(
      (nearest.getTime() - today.getTime()) /
        86400000
    );

    if (days < 0) return "expired";

    if (days <= 15) return "warning";

    return "active";
  };

  const expiredCount = orders.filter(
    (order) =>
      getExpiryStatus(order) === "expired"
  ).length;

  const warningCount = orders.filter(
    (order) =>
      getExpiryStatus(order) === "warning"
  ).length;

  const activeCount =
    orders.length -
    expiredCount -
    warningCount;

  /* =====================================================
     EDIT ORDER
  ===================================================== */

  const handleEdit = (order: Order) => {
    navigate(
      `/admin/orders/update/${order._id}`,
      {
        state: {
          from: "renewal",
        },
      }
    );
  };

  /* =====================================================
     CONFIRM RENEWAL
  ===================================================== */

  const confirmRenewal = async () => {
    if (
      !renewOrder ||
      !selectedRenewalItems.length
    ) {
      setError(
        "Select at least one service to renew."
      );

      return;
    }

    for (const item of selectedRenewalItems) {
      const selectedDate =
        renewDates[item.key];

      if (
        !selectedDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
          selectedDate
        )
      ) {
        setError(
          `Select a valid expiry date for ${item.label}.`
        );

        return;
      }

      const [year, month, day] =
        selectedDate.split("-").map(Number);

      const parsed = new Date(
        year,
        month - 1,
        day
      );

      if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
      ) {
        setError(
          `Select a valid expiry date for ${item.label}.`
        );

        return;
      }

      const minimumDate =
        toDateInputValue(new Date());

      if (selectedDate < minimumDate) {
        setError(
          `The new expiry date for ${item.label} cannot be in the past.`
        );

        return;
      }

      if (
        item.monthlyLocked &&
        item.durationMonths !== 1
      ) {
        setError(
          `${item.label} is configured for monthly renewal only.`
        );

        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/orders/${renewOrder._id}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify({
            renewals: selectedRenewalItems.map(
              (item) => ({
                target: item.target,

                ...(item.target === "plan"
                  ? {
                      planId: item.planId,
                    }
                  : {}),

                durationMonths:
                  item.durationMonths,

                expiryDate:
                  renewDates[item.key],
              })
            ),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Renewal failed."
        );
      }

      setSuccess(
        "Renewal completed successfully."
      );

      setRenewOrder(null);
      setRenewDates({});
      setRenewalDurations({});
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

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <p className="mt-10 text-center text-gray-500">
        Loading renewals...
      </p>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* PAGE HEADER */}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Renewal Management
        </h1>

        <p className="mt-1 text-gray-500">
          Manage domain and service plan expiry dates.
        </p>
      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="mb-4 rounded-lg bg-green-100 p-3 text-green-800">
          {success}

          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setSuccess("")}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && !renewOrder && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">
          {error}

          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setError("")}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* RENEWAL SUMMARY CARDS */}

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Expired
          </p>

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
          <p className="text-sm text-gray-500">
            Active
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {activeCount}
          </h2>
        </div>

      </div>

      {/* TABS AND SEARCH */}

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

      {/* RENEWAL ORDERS TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="flex items-center justify-between p-4">

          <h3 className="text-base font-semibold text-gray-700">
            Renewal Orders
          </h3>

          <span className="text-sm text-gray-500">
            Total: {filteredOrders.length}
          </span>

        </div>

        <div className="w-full overflow-x-auto">

          <OrdersTable
            paginatedOrders={paginatedOrders}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            handleEdit={handleEdit}
            getStatusClass={getStatusClass}
            navigate={navigate}
            showRenewalActions={true}
            handleRenew={openRenewPopup}
            handleCopyNotification={(order) =>
  copyRenewalNotification(order)
}
          />

        </div>

        {/* PAGINATION */}

        <div className="mt-2 flex items-center justify-center gap-5 p-4">

          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() =>
              setCurrentPage((p) =>
                Math.max(1, p - 1)
              )
            }
            className="rounded-lg border bg-white px-4 py-2 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(totalPages, p + 1)
              )
            }
            className="rounded-lg border bg-white px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>

        </div>

      </div>

      {/* =====================================================
          RENEWAL POPUP
      ===================================================== */}

      {renewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">

            {/* POPUP HEADER */}

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
              Domain:{" "}
              <strong>{renewOrder.domainName}</strong>
            </p>

            {error && (
              <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">
                {error}
              </p>
            )}

            {/* DATE SELECTION STEP */}

            {renewStep === "dates" ? (
              <>

                <p className="mb-4 text-sm text-gray-600">
                  Select the domain or plans you want to renew.
                  Yearly is the default for plans unless monthly
                  renewal is already configured.
                </p>

                <div className="space-y-4">

                  {itemsWithSelectedDuration.map(
                    (item) => {
                      const checked =
                        selectedItems.includes(item.key);

                      const duration =
                        item.durationMonths;

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
                                setSelectedItems(
                                  (previous) =>
                                    event.target.checked
                                      ? [
                                          ...previous,
                                          item.key,
                                        ]
                                      : previous.filter(
                                          (key) =>
                                            key !== item.key
                                        )
                                );
                              }}
                            />

                            {item.label}

                            <span className="text-xs text-gray-500">
                              ({duration} month
                              {duration === 1 ? "" : "s"})
                            </span>

                          </label>

                          {/* PLAN RENEWAL TYPE */}

                          {item.target === "plan" && (
                            <div className="mt-4">

                              <p className="mb-2 text-sm font-medium text-gray-700">
                                Renewal Type
                              </p>

                              <div className="flex flex-wrap gap-5">

                                <label
                                  className={`flex items-center gap-2 ${
                                    item.monthlyLocked
                                      ? "cursor-not-allowed text-gray-400"
                                      : "cursor-pointer"
                                  }`}
                                >

                                  <input
                                    type="radio"
                                    name={`duration-${item.key}`}
                                    value="12"
                                    checked={duration === 12}
                                    disabled={
                                      item.monthlyLocked ||
                                      !checked
                                    }
                                    onChange={() =>
                                      handleDurationChange(
                                        item,
                                        12
                                      )
                                    }
                                  />

                                  Yearly (12 months)

                                </label>

                                <label
                                  className={`flex items-center gap-2 ${
                                    !item.monthlyLocked &&
                                    checked
                                      ? "cursor-pointer"
                                      : "cursor-not-allowed text-gray-400"
                                  }`}
                                >

                                  <input
                                    type="radio"
                                    name={`duration-${item.key}`}
                                    value="1"
                                    checked={duration === 1}
                                    disabled={
                                      item.monthlyLocked ||
                                      !checked
                                    }
                                    onChange={() =>
                                      handleDurationChange(
                                        item,
                                        1
                                      )
                                    }
                                  />

                                  Monthly (1 month)

                                </label>

                              </div>

                              {item.monthlyLocked && (
                                <p className="mt-2 text-xs text-orange-600">
                                  This plan is configured for monthly
                                  renewal. The renewal type cannot be changed.
                                </p>
                              )}

                            </div>
                          )}

                          {/* DOMAIN RENEWAL TYPE */}

                          {item.target === "domain" && (
                            <p className="mt-2 text-xs text-gray-500">
                              Domain renewal: Yearly (12 months)
                            </p>
                          )}

                          {/* EXPIRY DATES */}

                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">

                            <div>
                              <p className="text-sm text-gray-500">
                                Current expiry
                              </p>

                              <p>
                                {displayDate(
                                  item.currentExpiry
                                )}
                              </p>
                            </div>

                            <div>

                              <label className="mb-1 block text-sm">
                                New expiry date
                              </label>

                              <input
                                type="date"
                                disabled={!checked}
                                min={toDateInputValue(
                                  new Date()
                                )}
                                value={
                                  renewDates[item.key] || ""
                                }
                                onChange={(event) => {
                                  setRenewDates(
                                    (previous) => ({
                                      ...previous,
                                      [item.key]:
                                        event.target.value,
                                    })
                                  );

                                  setError("");
                                }}
                                className="w-full rounded-lg border p-2 disabled:bg-gray-100"
                              />

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

                {/* DATE STEP BUTTONS */}

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={closeRenewPopup}
                    className="rounded-lg border px-4 py-2"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      !selectedRenewalItems.length ||
                      selectedRenewalItems.some(
                        (item) =>
                          !renewDates[item.key]
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

              /* CONFIRMATION STEP */

              <>

                <p className="mb-4 text-sm text-gray-600">
                  Check the selected services, renewal types and expiry
                  dates before saving.
                </p>

                <div className="space-y-3 rounded-lg border p-4">

                  {selectedRenewalItems.map(
                    (item) => (
                      <div
                        key={item.key}
                        className="flex justify-between gap-4 border-b pb-3 last:border-0"
                      >

                        <div>

                          <p className="font-medium">
                            {item.label}
                          </p>

                          <p className="text-sm text-gray-500">
                            Old:{" "}
                            {displayDate(
                              item.currentExpiry
                            )}
                          </p>

                          <p className="text-sm text-gray-500">
                            Renewal type:{" "}
                            {item.target === "domain"
                              ? "Yearly"
                              : item.durationMonths === 1
                                ? "Monthly"
                                : "Yearly"}
                          </p>

                          <p className="text-xs text-gray-500">
                            Duration:{" "}
                            {item.durationMonths} month
                            {item.durationMonths === 1
                              ? ""
                              : "s"}
                          </p>

                        </div>

                        <p className="font-semibold text-green-700">
                          {displayDate(
                            renewDates[item.key]
                          )}
                        </p>

                      </div>
                    )
                  )}

                </div>

                {/* CONFIRMATION BUTTONS */}

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      setRenewStep("dates")
                    }
                    className="rounded-lg border px-4 py-2"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={confirmRenewal}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Confirm Renewal"}
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