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

  primary_status?:
  {
    _id: string;
    name: string;
    code?: string;
    type?: string;
    category?: "primary" | "secondary";
    is_active?: boolean;
    is_custom?: boolean;
  } | null;
  secondary_status?:
  {
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

  /* ===================== LOAD ORDER ===================== */

  useEffect(() => {
    if (!orderId) return;

    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        /* ===============================
           FETCH ORDER
        =============================== */

        const data =
          await fetchOrderById(orderId);

        /* ===============================
           MAP CUSTOMER / CLIENT
        =============================== */

        const mapPerson = (source: any) =>
          source
            ? {
              name: source.c_name,
              email: source.c_email,
              phone: source.c_phone,
              company: source.c_company,
              address: source.c_address,
              city: source.c_city,
              state: source.c_state?.name,
              country: source.c_country?.name,
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

        /* ===============================
           ORDER STATUS
        =============================== */

        const orderStatusData =
          await fetchOrderStatuses(orderId);

        setStatuses(
          Array.isArray(orderStatusData)
            ? orderStatusData
            : []
        );

        /* ===============================
           DOMAIN STATUS
        =============================== */

        const domainStatusData =
          await fetchDomainStatuses(orderId);

        setDomainStatuses(
          Array.isArray(domainStatusData)
            ? domainStatusData
            : []
        );

        /* ===============================
           PLAN STATUSES
        =============================== */

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

        /* ===============================
           ASSIGN STATUS LISTS TO PLANS
        =============================== */

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

            {/* ===============================
                ORDER STATUS
            =============================== */}

            <select
              value={
                order.order_status?._id || ""
              }
              onChange={async (e) => {
                const newStatusId =
                  e.target.value;

                if (
                  !newStatusId ||
                  newStatusId ===
                  order.order_status?._id
                ) {
                  return;
                }

                const selectedStatus =
                  statuses.find(
                    (status) =>
                      status._id ===
                      newStatusId
                  );

                const confirmed =
                  window.confirm(
                    `Are you sure you want to change the status to "${selectedStatus?.name}"?`
                  );

                if (!confirmed) return;

                try {
                  const updatedOrder =
                    await updateOrderStatus(
                      order._id,
                      {
                        order_status:
                          newStatusId,
                      }
                    );

                  setOrder((prev) => {
                    if (!prev) return prev;

                    return {
                      ...prev,
                      order_status:
                        updatedOrder.order_status,
                    };
                  });
                } catch (error) {
                  console.error(
                    "Order status update error:",
                    error
                  );

                  alert(
                    "Failed to update order status"
                  );
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              <option
                value={
                  order.order_status?._id || ""
                }
              >
                {order.order_status?.name ||
                  "Select Order Status"}
              </option>

              {statuses
                .filter(
                  (status) =>
                    status.is_active &&
                    status._id !==
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

          {/* BACK */}

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
          rightContent={
            <select
              value={
                order.domain_status?._id || ""
              }
              onChange={async (e) => {
                const newStatusId =
                  e.target.value;

                if (
                  !newStatusId ||
                  newStatusId ===
                  order.domain_status?._id
                ) {
                  return;
                }

                const selectedStatus =
                  domainStatuses.find(
                    (status) =>
                      status._id ===
                      newStatusId
                  );

                const confirmed =
                  window.confirm(
                    `Are you sure you want to change the status to "${selectedStatus?.name}"?`
                  );

                if (!confirmed) return;

                try {
                  const updatedOrder =
                    await updateOrderStatus(
                      order._id,
                      {
                        domain_status:
                          newStatusId,
                      }
                    );

                  setOrder((prev) => {
                    if (!prev) return prev;

                    return {
                      ...prev,
                      domain_status:
                        updatedOrder.domain_status,
                    };
                  });
                } catch (error) {
                  console.error(
                    "Domain status update error:",
                    error
                  );

                  alert(
                    "Failed to update domain status"
                  );
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              <option
                value={
                  order.domain_status?._id || ""
                }
              >
                {order.domain_status?.name ||
                  "Select Domain Status"}
              </option>

              {domainStatuses
                .filter(
                  (status) =>
                    status.is_active
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
          }
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
                    order.domainSource.image.startsWith(
                      "/"
                    )
                      ? `${API_BASE_URL}${order.domainSource.image}`
                      : `${API_BASE_URL}/${order.domainSource.image}`
                  }
                  className="w-6 h-6 object-contain"
                  alt={
                    order.domainSource.name
                  }
                />
              )}

              <span className="text-sm text-gray-700">
                {order.domainSource?.name ||
                  "-"}
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
                value={
                  order.customer.name
                }
              />
            )}

            {order.customer.company && (
              <Info
                label="Company"
                value={
                  order.customer.company
                }
              />
            )}

            {order.customer.email && (
              <Info
                label="Email"
                value={
                  order.customer.email
                }
              />
            )}

            {order.customer.phone && (
              <Info
                label="Phone"
                value={
                  order.customer.phone
                }
              />
            )}

            {order.customer.address && (
              <Info
                label="Address"
                value={
                  order.customer.address
                }
              />
            )}

            {order.customer.city && (
              <Info
                label="City"
                value={
                  order.customer.city
                }
              />
            )}

            {order.customer.state && (
              <Info
                label="State"
                value={
                  order.customer.state
                }
              />
            )}

            {order.customer.country && (
              <Info
                label="Country"
                value={
                  order.customer.country
                }
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

                          {/* EMAIL TYPE */}

                          <td className="border px-2 py-1">
                            {plan.emailType ||
                              "-"}
                          </td>

                          {/* PLAN NAME */}

                          <td className="border px-2 py-1">
                            {plan.planName}
                          </td>

                          {/* TYPE */}

                          <td className="border px-2 py-1">
                            {plan.type}
                          </td>

                          {/* USERS */}

                          <td className="border px-2 py-1">
                            {plan.noOfUsers ??
                              "-"}
                          </td>

                          {/* REG DATE */}

                          <td className="border px-2 py-1">
                            {formatDate(
                              plan.registrationDate
                            )}
                          </td>

                          {/* EXP DATE */}

                          <td className="border px-2 py-1">
                            {formatDate(
                              plan.expiryDate
                            )}
                          </td>

                          {/* ===================== STATUS ===================== */}

              
{/* ===================== STATUS ===================== */}
<td className="border px-2 py-1">
<div className="flex flex-col gap-2">

    {/* ===============================
        PRIMARY STATUS
    =============================== */}

    <select
      value={plan.primary_status?._id || ""}
      onChange={async (e) => {
        const newStatusId = e.target.value;

        if (
          !newStatusId ||
          newStatusId === plan.primary_status?._id
        ) {
          return;
        }

        const selectedStatus = (
          primaryPlanStatuses[plan._id] || []
        ).find(
          (status) => status._id === newStatusId
        );

        const confirmed = window.confirm(
          `Are you sure you want to change the primary status to "${selectedStatus?.name}"?`
        );

        if (!confirmed) {
          return;
        }

        try {
          const updatedPlan = await updatePlanStatus(
            plan._id,
            {
              primary_status: newStatusId,
            }
          );

          console.log(
            "UPDATED PLAN:",
            updatedPlan
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
        } catch (error) {
          console.error(
            "Primary status update error:",
            error
          );

          alert(
            "Failed to update primary status"
          );
        }
      }}
      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
    >
      <option value="">
        Select Primary Status
      </option>

      {/* CURRENT PRIMARY STATUS */}
      {plan.primary_status &&
        !(
          primaryPlanStatuses[plan._id] || []
        ).some(
          (status) =>
            status._id ===
            plan.primary_status?._id
        ) && (
          <option
            value={plan.primary_status._id}
          >
            {plan.primary_status.name}
          </option>
        )}

      {/* AVAILABLE PRIMARY STATUSES */}
      {(
        primaryPlanStatuses[plan._id] || []
      )
        .filter(
          (status) => status.is_active
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

    {/* ===============================
        SECONDARY STATUS
    =============================== */}

    <select
      value={plan.secondary_status?._id || ""}
      onChange={async (e) => {
        const newStatusId = e.target.value;

        if (
          newStatusId ===
          plan.secondary_status?._id
        ) {
          return;
        }

        const selectedStatus = (
          secondaryPlanStatuses[plan._id] || []
        ).find(
          (status) => status._id === newStatusId
        );

        const confirmed = window.confirm(
          `Are you sure you want to change the secondary status to "${selectedStatus?.name || "None"}"?`
        );

        if (!confirmed) {
          return;
        }

        try {
          const updatedPlan =
            await updatePlanStatus(
              plan._id,
              {
                secondary_status:
                  newStatusId || null,
              }
            );

          console.log(
            "UPDATED PLAN:",
            updatedPlan
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
        } catch (error) {
          console.error(
            "Secondary status update error:",
            error
          );

          alert(
            "Failed to update secondary status"
          );
        }
      }}
      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
    >
      <option value="">
        Select Secondary Status
      </option>

      {/* CURRENT SECONDARY STATUS */}
      {plan.secondary_status &&
        !(
          secondaryPlanStatuses[plan._id] || []
        ).some(
          (status) =>
            status._id ===
            plan.secondary_status?._id
        ) && (
          <option
            value={plan.secondary_status._id}
          >
            {plan.secondary_status.name}
          </option>
        )}

      {/* AVAILABLE SECONDARY STATUSES */}
      {(
        secondaryPlanStatuses[plan._id] || []
      )
        .filter(
          (status) => status.is_active
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
</td>



                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </Section>
          )}

        {/* ===================== ACTIONS ===================== */}

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
