import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  fetchOrderById,
  updateOrderStatus,
  updatePlanStatus,
  fetchOrderStatuses,
  fetchPrimaryPlanStatuses,
  fetchSecondaryPlanStatuses,
  fetchDomainStatuses,
} from "../api";

import {
  FaArrowLeft,
  FaEdit,
  FaRedo,
  FaTimes,
  FaCopy,
} from "react-icons/fa";

/* ===================== TYPES ===================== */

interface Plan {
  _id: string;
  planName: string;
  serviceType: string;
  type: string;
  registrationDate: string;
  expiryDate: string;
  provider?: string;
  noOfUsers?: number;
  orderId: string;
  planId: string;
  emailType?: string;

  // Admin login information
  adminEmail?: string;
  adminPassword?: string;
  username?: string;

  primary_status?: {
    _id: string;
    name: string;
    code?: string;
    type?: string;
    category?: "primary" | "secondary";
    is_active?: boolean;
    is_custom?: boolean;
  } | null;

  secondary_status?: {
    _id: string;
    name: string;
    code?: string;
    type?: string;
    category?: "primary" | "secondary";
    is_active?: boolean;
    is_custom?: boolean;
  } | null;
}

interface Customer {
  name?: string;
  email?: string | string[];
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface Client {
  name?: string;
  email?: string | string[];
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface DomainSource {
  _id: string;
  name: string;
  code: string;
  image?: string;
}

interface Status {
  _id: string;
  name: string;
  code?: string;
  category?: "primary" | "secondary";
  is_active: boolean;

  typeEmail?: {
    _id: string;
    name: string;
  } | null;
}

interface Order {
  _id: string;
  domainName: string;

  status?: {
    _id: string;
    name: string;
  } | null;

  order_status?: {
    _id: string;
    name: string;
    code: string;
    type: string;
    is_active: boolean;
  } | null;

  domain_status?: {
    _id: string;
    name: string;
    code: string;
    type: string;
    is_active: boolean;
  } | null;

  managedBy?: string;
  registrationDate?: string;
  expiryDate?: string;
  provider?: string;

  domainSource?: DomainSource | null;

  /* FLAGS */

  domain_flag?: boolean;
  email_flag?: boolean;
  host_flag?: boolean;
  ssl_flag?: boolean;
  website_flag?: boolean;
  storage_services_flag?: boolean;

  lockStatus?: string;
  email_status?: string;
  businessEmail?: boolean;
  cloudflareRegistered?: boolean;
  google_email?: boolean;
  microsoft_email?: boolean;

  username?: string;
  nameServers?: string[];

  customer?: Customer;
  client?: Client;

  plans?: Plan[];
}

/* ===================== SMALL COMPONENTS ===================== */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const copyToClipboard = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value);
    alert(`${label} copied successfully`);
  } catch (error) {
    console.error("Copy failed:", error);
    alert(`Failed to copy ${label.toLowerCase()}`);
  }
};

const Info: React.FC<{
  label: string;
  value?: any;
}> = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">
      {label}
    </p>

    <p className="font-medium text-gray-800">
      {Array.isArray(value)
        ? value.join(", ")
        : value ?? "-"}
    </p>
  </div>
);

/* ===================== MAIN COMPONENT ===================== */

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{
    orderId: string;
  }>();

  const navigate = useNavigate();

  /* ===================== STATES ===================== */

  const [statuses, setStatuses] =
    useState<Status[]>([]);

  const [domainStatuses, setDomainStatuses] =
    useState<Status[]>([]);

  const [primaryPlanStatuses, setPrimaryPlanStatuses] =
    useState<Record<string, Status[]>>({});

  const [secondaryPlanStatuses, setSecondaryPlanStatuses] =
    useState<Record<string, Status[]>>({});

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ===================== STATUS MODAL ===================== */

  const [statusModalOpen, setStatusModalOpen] =
    useState(false);

  const [updateOrderStatusChecked, setUpdateOrderStatusChecked] =
    useState(false);

  const [updateDomainStatusChecked, setUpdateDomainStatusChecked] =
    useState(false);

  const [updatePlanStatusChecked, setUpdatePlanStatusChecked] =
    useState(false);

  const [selectedOrderStatus, setSelectedOrderStatus] =
    useState("");

  const [selectedDomainStatus, setSelectedDomainStatus] =
    useState("");

  const [selectedPrimaryPlanStatuses, setSelectedPrimaryPlanStatuses] =
    useState<Record<string, string>>({});

  const [selectedSecondaryPlanStatuses, setSelectedSecondaryPlanStatuses] =
    useState<Record<string, string>>({});

  const [statusUpdating, setStatusUpdating] =
    useState(false);

  /* ===================== OPEN STATUS MODAL ===================== */

  const openStatusModal = () => {
    setSelectedOrderStatus(
      order?.order_status?._id || ""
    );

    setSelectedDomainStatus(
      order?.domain_status?._id || ""
    );

    const primary: Record<string, string> = {};
    const secondary: Record<string, string> = {};

    (order?.plans || []).forEach((plan) => {
      primary[plan._id] =
        plan.primary_status?._id || "";

      secondary[plan._id] =
        plan.secondary_status?._id || "";
    });

    setSelectedPrimaryPlanStatuses(primary);
    setSelectedSecondaryPlanStatuses(secondary);

    setUpdateOrderStatusChecked(false);
    setUpdateDomainStatusChecked(false);
    setUpdatePlanStatusChecked(false);

    setStatusModalOpen(true);
  };

  /* ===================== HANDLE STATUS UPDATE ===================== */

  const handleStatusUpdate = async () => {
    if (!order) return;

    if (
      !updateOrderStatusChecked &&
      !updateDomainStatusChecked &&
      !updatePlanStatusChecked
    ) {
      alert("Please select at least one status to update");
      return;
    }

    try {
      setStatusUpdating(true);

      /* ===================== ORDER STATUS ===================== */

      if (
        updateOrderStatusChecked &&
        selectedOrderStatus &&
        selectedOrderStatus !== order.order_status?._id
      ) {
        const updatedOrder = await updateOrderStatus(
          order._id,
          {
            order_status: selectedOrderStatus,
          }
        );

        setOrder((prev) =>
          prev
            ? {
                ...prev,
                order_status:
                  updatedOrder.order_status,
              }
            : prev
        );
      }

      /* ===================== DOMAIN STATUS ===================== */

      if (
        updateDomainStatusChecked &&
        selectedDomainStatus &&
        selectedDomainStatus !== order.domain_status?._id
      ) {
        const updatedOrder = await updateOrderStatus(
          order._id,
          {
            domain_status: selectedDomainStatus,
          }
        );

        setOrder((prev) =>
          prev
            ? {
                ...prev,
                domain_status:
                  updatedOrder.domain_status,
              }
            : prev
        );
      }

      /* ===================== PLAN STATUS ===================== */

      if (updatePlanStatusChecked) {
        for (const plan of order.plans || []) {

          /*
           * Only email plans are allowed
           * to be updated from this popup.
           */
          if (!plan.emailType) {
            continue;
          }

          const primaryStatus =
            selectedPrimaryPlanStatuses[plan._id] || "";

          const secondaryStatus =
            selectedSecondaryPlanStatuses[plan._id] || "";

          const primaryChanged =
            primaryStatus !==
            (plan.primary_status?._id || "");

          const secondaryChanged =
            secondaryStatus !==
            (plan.secondary_status?._id || "");

          if (!primaryChanged && !secondaryChanged) {
            continue;
          }

          const payload: {
            primary_status?: string;
            secondary_status?: string | null;
          } = {};

          if (
            primaryChanged &&
            primaryStatus
          ) {
            payload.primary_status =
              primaryStatus;
          }

          if (secondaryChanged) {
            payload.secondary_status =
              secondaryStatus || null;
          }

          const updatedPlan =
            await updatePlanStatus(
              plan._id,
              payload
            );

          setOrder((prev) => {
            if (!prev) return prev;

            return {
              ...prev,

              plans: prev.plans?.map((p) =>
                p._id === plan._id
                  ? {
                      ...p,
                      primary_status:
                        updatedPlan.primary_status,
                      secondary_status:
                        updatedPlan.secondary_status,
                    }
                  : p
              ),
            };
          });
        }
      }

      setStatusModalOpen(false);

      alert("Status updated successfully");

    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert("Failed to update status");

    } finally {
      setStatusUpdating(false);
    }
  };

  /* ===================== LOAD ORDER ===================== */

  useEffect(() => {
    if (!orderId) return;

    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        /* ===================== FETCH ORDER ===================== */

        const data =
          await fetchOrderById(orderId);

        /* ===================== MAP CUSTOMER / CLIENT ===================== */

        const mapPerson = (source: any) =>
          source
            ? {
                name: source.c_name,
                email: source.c_email,
                phone: source.c_phone,
                company: source.c_company,
                address: source.c_address,
                city: source.c_city,
                state:
                  source.c_state?.name,
                country:
                  source.c_country?.name,
              }
            : undefined;

        const mappedOrder: Order = {
          ...data,

          domainSource:
            data.domainSource || null,

          customer: mapPerson(
            data.customer
          ),

          client: mapPerson(
            data.client
          ),
        };

        setOrder(mappedOrder);

        /* ===================== ORDER STATUS ===================== */

        const orderStatusData =
          await fetchOrderStatuses(orderId);

        setStatuses(
          Array.isArray(orderStatusData)
            ? orderStatusData
            : []
        );

        /* ===================== DOMAIN STATUS ===================== */

        const domainStatusData =
          await fetchDomainStatuses(orderId);

        setDomainStatuses(
          Array.isArray(domainStatusData)
            ? domainStatusData
            : []
        );

        /* ===================== PLAN STATUSES ===================== */

        const primaryStatuses =
          await fetchPrimaryPlanStatuses();

        const secondaryStatuses =
          await fetchSecondaryPlanStatuses();

        const primaryStatusMap: Record<
          string,
          Status[]
        > = {};

        const secondaryStatusMap: Record<
          string,
          Status[]
        > = {};

        for (
          const plan of mappedOrder.plans || []
        ) {
          primaryStatusMap[plan._id] =
            Array.isArray(primaryStatuses)
              ? primaryStatuses
              : [];

          secondaryStatusMap[plan._id] =
            Array.isArray(secondaryStatuses)
              ? secondaryStatuses
              : [];
        }

        setPrimaryPlanStatuses(
          primaryStatusMap
        );

        setSecondaryPlanStatuses(
          secondaryStatusMap
        );

      } catch (error) {
        console.error(
          "Failed to load order details:",
          error
        );

        setError(
          "Failed to load order details"
        );

      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();

  }, [orderId]);

  /* ===================== SECTION COMPONENT ===================== */

  const Section: React.FC<{
    title: string;
    children: React.ReactNode;
    fullWidth?: boolean;
    rightContent?: React.ReactNode;
  }> = ({
    title,
    children,
    fullWidth,
    rightContent,
  }) => (
    <section className="mb-6">

      <div className="flex items-center justify-between mb-3 border-b pb-2">

        <h2 className="text-lg font-semibold">
          {title}
        </h2>

        {rightContent}

      </div>

      <div
        className={
          fullWidth
            ? ""
            : "grid grid-cols-1 md:grid-cols-2 gap-4"
        }
      >
        {children}
      </div>

    </section>
  );

  /* ===================== LOADING ===================== */

  if (loading) {
    return (
      <p className="p-6">
        Loading order details…
      </p>
    );
  }

  /* ===================== ERROR ===================== */

  if (error) {
    return (
      <p className="p-6 text-red-600">
        {error}
      </p>
    );
  }

  /* ===================== NO ORDER ===================== */

  if (!order) {
    return (
      <p className="p-6">
        Order not found
      </p>
    );
  }

  /* ===================== DATE FORMAT ===================== */

  const formatDate = (date?: string) =>
    date
      ? new Date(date)
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replaceAll(" ", "-")
      : "-";

  /* ===================== RETURN ===================== */

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6 space-y-8">

        {/* ===================== HEADER ===================== */}

        <div className="flex justify-between items-center">

          <div className="flex items-center gap-3">

            <h1 className="text-2xl font-bold text-gray-800">
              Order – {order.domainName}
            </h1>

            <button
              type="button"
              onClick={openStatusModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              <FaEdit />
              Status Update
            </button>

          </div>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            <FaArrowLeft />
            Back
          </button>

        </div>

        {/* ===================== DOMAIN INFORMATION ===================== */}

        <Section
          title="Domain Information"
          rightContent={null}
        >

          <Info
            label="Domain Name"
            value={order.domainName}
          />

          <Info
            label="Managed By"
            value={order.managedBy}
          />

          {/* REGISTRAR */}

          <div className="flex items-center gap-2">

            <label className="text-sm font-medium">
              Registrar:
            </label>

            <div className="flex items-center gap-2">

              {order.domainSource?.image && (
                <img
                  src={
                    order.domainSource.image.startsWith("/")
                      ? `${API_BASE_URL}${order.domainSource.image}`
                      : `${API_BASE_URL}/${order.domainSource.image}`
                  }
                  className="w-6 h-6 object-contain"
                  alt={order.domainSource.name}
                />
              )}

              <span className="text-sm text-gray-700">
                {order.domainSource?.name || "-"}
              </span>

            </div>

          </div>

          <Info
            label="Registration Date"
            value={formatDate(
              order.registrationDate
            )}
          />

          <Info
            label="Expiry Date"
            value={formatDate(
              order.expiryDate
            )}
          />

          <Info
            label="Lock Status"
            value={order.lockStatus}
          />

          <Info
            label="Name Servers"
            value={order.nameServers}
          />

        </Section>

        {/* ===================== CUSTOMER ===================== */}

        {order.customer && (
          <Section title="Customer Details">

            {order.customer.name && (
              <Info
                label="Name"
                value={order.customer.name}
              />
            )}

            {order.customer.company && (
              <Info
                label="Company"
                value={order.customer.company}
              />
            )}

            {order.customer.email && (
              <Info
                label="Email"
                value={order.customer.email}
              />
            )}

            {order.customer.phone && (
              <Info
                label="Phone"
                value={order.customer.phone}
              />
            )}

            {order.customer.address && (
              <Info
                label="Address"
                value={order.customer.address}
              />
            )}

            {order.customer.city && (
              <Info
                label="City"
                value={order.customer.city}
              />
            )}

            {order.customer.state && (
              <Info
                label="State"
                value={order.customer.state}
              />
            )}

            {order.customer.country && (
              <Info
                label="Country"
                value={order.customer.country}
              />
            )}

          </Section>
        )}

        {/* ===================== CLIENT ===================== */}

        {order.client && (
          <Section title="Client Details">

            <Info
              label="Name"
              value={order.client.name}
            />

            <Info
              label="Company"
              value={order.client.company}
            />

            <Info
              label="Email"
              value={order.client.email}
            />

            <Info
              label="Phone"
              value={order.client.phone}
            />

            <Info
              label="Address"
              value={order.client.address}
            />

            <Info
              label="City"
              value={order.client.city}
            />

            <Info
              label="State"
              value={order.client.state}
            />

            <Info
              label="Country"
              value={order.client.country}
            />

          </Section>
        )}

        {/* ===================== PLANS ===================== */}

        {order.plans &&
          order.plans.length > 0 && (

          <Section
            title="Plans & Services"
            fullWidth
          >

            <div className="overflow-x-auto">

              <table className="w-full border border-gray-300">

                <thead className="bg-gray-100">

                  <tr>

                    <th className="border px-2 py-1">
                      Email Type
                    </th>

                    <th className="border px-2 py-1">
                      Plan Name
                    </th>

                    <th className="border px-2 py-1">
                      Type
                    </th>

                    <th className="border px-2 py-1">
                      Users
                    </th>

                    <th className="border px-2 py-1">
                      Admin Email
                    </th>

                    <th className="border px-2 py-1">
                      Admin Password
                    </th>

                    <th className="border px-2 py-1">
                      Reg Date
                    </th>

                    <th className="border px-2 py-1">
                      Exp Date
                    </th>

                    <th className="border px-2 py-1">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {order.plans.map(
                    (plan) => (

                    <tr key={plan._id}>

                      <td className="border px-2 py-1">
                        {plan.emailType || "-"}
                      </td>

                      <td className="border px-2 py-1">
                        {plan.planName}
                      </td>

                      <td className="border px-2 py-1">
                        {plan.type}
                      </td>

                      <td className="border px-2 py-1">
                        {plan.noOfUsers ?? "-"}
                      </td>

                      {/* ADMIN EMAIL WITH COPY BUTTON */}
                      <td className="border px-2 py-1">
                        <div className="flex items-center gap-2">
                          <span className="break-all">
                            {plan.adminEmail || "-"}
                          </span>

                          {plan.adminEmail && (
                            <button
                              type="button"
                              title="Copy Admin Email"
                              aria-label="Copy Admin Email"
                              onClick={() =>
                                copyToClipboard(
                                  plan.adminEmail!,
                                  "Admin Email"
                                )
                              }
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FaCopy />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* MASKED ADMIN PASSWORD WITH COPY BUTTON */}
                      <td className="border px-2 py-1">
                        <div className="flex items-center gap-2">
                          <span>
                            {plan.adminPassword ? "••••••••" : "-"}
                          </span>

                          {plan.adminPassword && (
                            <button
                              type="button"
                              title="Copy Admin Password"
                              aria-label="Copy Admin Password"
                              onClick={() =>
                                copyToClipboard(
                                  plan.adminPassword!,
                                  "Admin Password"
                                )
                              }
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FaCopy />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="border px-2 py-1">
                        {formatDate(
                          plan.registrationDate
                        )}
                      </td>

                      <td className="border px-2 py-1">
                        {formatDate(
                          plan.expiryDate
                        )}
                      </td>

                      <td className="border px-2 py-1">

                        <div className="flex flex-col gap-1">

                          <span className="text-sm font-medium text-gray-700">
                            Primary:{" "}
                            {plan.primary_status?.name || "-"}
                          </span>

                          <span className="text-sm text-gray-600">
                            Secondary:{" "}
                            {plan.secondary_status?.name || "-"}
                          </span>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </Section>
        )}

        {/* ===================== STATUS UPDATE MODAL ===================== */}

        {statusModalOpen && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">

              {/* ===================== MODAL HEADER ===================== */}

              <div className="flex items-center justify-between border-b px-5 py-4">

                <div>

                  <h2 className="text-lg font-semibold text-gray-800">
                    Update Status
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Select the status you want to update.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setStatusModalOpen(false)
                  }
                  disabled={statusUpdating}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <FaTimes size={18} />
                </button>

              </div>

              {/* ===================== MODAL CONTENT ===================== */}

              <div className="p-5 space-y-4">

                {/* ===================== ORDER STATUS ===================== */}

                <div className="border rounded-lg p-4">

                  <label className="flex items-center gap-3 cursor-pointer">

                    <input
                      type="checkbox"
                      checked={
                        updateOrderStatusChecked
                      }
                      onChange={(e) =>
                        setUpdateOrderStatusChecked(
                          e.target.checked
                        )
                      }
                      className="w-4 h-4"
                    />

                    <span className="font-medium text-gray-800">
                      Order Status
                    </span>

                  </label>

                  {updateOrderStatusChecked && (

                    <div className="mt-3 ml-7">

                      <select
                        value={selectedOrderStatus}
                        onChange={(e) =>
                          setSelectedOrderStatus(
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >

                        <option value="">
                          Select Order Status
                        </option>

                        {statuses
                          .filter(
                            (status) =>
                              status.is_active ||
                              status._id ===
                                order.order_status?._id
                          )
                          .map((status) => (

                            <option
                              key={status._id}
                              value={status._id}
                            >
                              {status.name}
                            </option>

                          ))}

                      </select>

                    </div>

                  )}

                </div>

                {/* ===================== DOMAIN STATUS ===================== */}

                {order.domainSource && (

                  <div className="border rounded-lg p-4">

                    <label className="flex items-center gap-3 cursor-pointer">

                      <input
                        type="checkbox"
                        checked={
                          updateDomainStatusChecked
                        }
                        onChange={(e) =>
                          setUpdateDomainStatusChecked(
                            e.target.checked
                          )
                        }
                        className="w-4 h-4"
                      />

                      <span className="font-medium text-gray-800">
                        Domain Status
                      </span>

                    </label>

                    {updateDomainStatusChecked && (

                      <div className="mt-3 ml-7">

                        <select
                          value={selectedDomainStatus}
                          onChange={(e) =>
                            setSelectedDomainStatus(
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >

                          <option value="">
                            Select Domain Status
                          </option>

                          {domainStatuses
                            .filter(
                              (status) =>
                                status.is_active ||
                                status._id ===
                                  order.domain_status?._id
                            )
                            .map((status) => (

                              <option
                                key={status._id}
                                value={status._id}
                              >
                                {status.name}
                              </option>

                            ))}

                        </select>

                      </div>

                    )}

                  </div>

                )}

                {/* ===================== PLAN STATUS ===================== */}

                {(order.plans || []).length > 0 && (

                  <div className="border rounded-lg p-4">

                    <label className="flex items-center gap-3 cursor-pointer">

                      <input
                        type="checkbox"
                        checked={
                          updatePlanStatusChecked
                        }
                        onChange={(e) =>
                          setUpdatePlanStatusChecked(
                            e.target.checked
                          )
                        }
                        className="w-4 h-4"
                      />

                      <span className="font-medium text-gray-800">
                        Plan Status
                      </span>

                    </label>

                    {updatePlanStatusChecked && (

                      <div className="mt-4 ml-7 space-y-4">

                        {(order.plans || []).map(
                          (plan) => (

                          <div
                            key={plan._id}
                            className="border rounded-lg p-3 bg-gray-50"
                          >

                            {/* PLAN NAME / EMAIL TYPE */}

                            <p className="font-medium text-gray-800 mb-3">
                              {plan.emailType ||
                                plan.planName ||
                                "-"}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                              {/* ================= PRIMARY STATUS ================= */}

                              <div>

                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Primary Status
                                </label>

                                <select
                                  value={
                                    selectedPrimaryPlanStatuses[
                                      plan._id
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    setSelectedPrimaryPlanStatuses(
                                      (prev) => ({
                                        ...prev,
                                        [plan._id]:
                                          e.target.value,
                                      })
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm bg-white"
                                >

                                  <option value="">
                                    Select Primary Status
                                  </option>

                                  {/* CURRENT STATUS */}

                                  {plan.primary_status &&
                                    !(
                                      primaryPlanStatuses[
                                        plan._id
                                      ] || []
                                    ).some(
                                      (status) =>
                                        status._id ===
                                        plan.primary_status?._id
                                    ) && (

                                      <option
                                        value={
                                          plan.primary_status._id
                                        }
                                      >
                                        {
                                          plan.primary_status.name
                                        }
                                      </option>

                                    )}

                                  {/* ACTIVE STATUS LIST */}

                                  {(
                                    primaryPlanStatuses[
                                      plan._id
                                    ] || []
                                  )
                                    .filter(
                                      (status) =>
                                        status.is_active ||
                                        status._id ===
                                          plan.primary_status?._id
                                    )
                                    .map(
                                      (status) => (

                                      <option
                                        key={status._id}
                                        value={status._id}
                                      >
                                        {status.name}
                                      </option>

                                    )
                                  )}

                                </select>

                              </div>

                              {/* ================= SECONDARY STATUS ================= */}

                              <div>

                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Secondary Status
                                </label>

                                <select
                                  value={
                                    selectedSecondaryPlanStatuses[
                                      plan._id
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    setSelectedSecondaryPlanStatuses(
                                      (prev) => ({
                                        ...prev,
                                        [plan._id]:
                                          e.target.value,
                                      })
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm bg-white"
                                >

                                  <option value="">
                                    None / Select Secondary Status
                                  </option>

                                  {/* CURRENT STATUS */}

                                  {plan.secondary_status &&
                                    !(
                                      secondaryPlanStatuses[
                                        plan._id
                                      ] || []
                                    ).some(
                                      (status) =>
                                        status._id ===
                                        plan.secondary_status?._id
                                    ) && (

                                      <option
                                        value={
                                          plan.secondary_status._id
                                        }
                                      >
                                        {
                                          plan.secondary_status.name
                                        }
                                      </option>

                                    )}

                                  {/* ACTIVE STATUS LIST */}

                                  {(
                                    secondaryPlanStatuses[
                                      plan._id
                                    ] || []
                                  )
                                    .filter(
                                      (status) =>
                                        status.is_active ||
                                        status._id ===
                                          plan.secondary_status?._id
                                    )
                                    .map(
                                      (status) => (

                                      <option
                                        key={status._id}
                                        value={status._id}
                                      >
                                        {status.name}
                                      </option>

                                    )
                                  )}

                                </select>

                              </div>

                            </div>

                          </div>

                        ))}

                      </div>

                    )}

                  </div>

                )}

                {/* ===================== MODAL ACTIONS ===================== */}

                <div className="flex justify-end gap-3 pt-3 border-t">

                  <button
                    type="button"
                    onClick={() =>
                      setStatusModalOpen(false)
                    }
                    disabled={statusUpdating}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleStatusUpdate}
                    disabled={statusUpdating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {statusUpdating
                      ? "Updating..."
                      : "Update Status"}
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

        {/* ===================== PAGE ACTIONS ===================== */}

        <div className="flex justify-end gap-3">

          {/* EDIT */}

          <button
            onClick={() =>
              navigate(
                `/admin/orders/update/${order._id}`
              )
            }
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded"
          >
            <FaEdit />
            Edit
          </button>

          {/* RENEW */}

          <button
            onClick={() =>
              navigate(
                `/admin/orders/renew/${order._id}`
              )
            }
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded"
          >
            <FaRedo />
            Renew
          </button>

        </div>

      </div>

    </div>
  );
};

export default OrderDetails;