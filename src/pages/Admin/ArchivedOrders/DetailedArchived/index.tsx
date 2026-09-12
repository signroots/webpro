import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  fetchOrderById,
  updateOrderStatus,
  activatePlanStatus,
} from "../../Order/api";

import {
  FaArrowLeft,
  FaEdit,
  FaRedo,
  FaCheckCircle,
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

/* ===================== INFO COMPONENT ===================== */

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

/* ===================== ACTIVE STATUS ===================== */

const ActiveStatus: React.FC = () => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
    <FaCheckCircle className="text-xs" />
    Active
  </span>
);

/* ===================== ACTIVATE BUTTON ===================== */

const ActivateButton: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center justify-center px-3.5 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
  >
    Active
  </button>
);

/* ===================== MAIN COMPONENT ===================== */

const ArchivedOrderDetails: React.FC = () => {
  const { orderId } = useParams<{
    orderId: string;
  }>();

  const navigate = useNavigate();

  /* ===================== STATES ===================== */

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

        const data =
          await fetchOrderById(orderId);

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

  /* ===================== SECTION ===================== */

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
        <h2 className="text-lg font-semibold text-gray-800">
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

  /* ===================== DATE ===================== */

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

  /* ===================== STATUS CHECK ===================== */

  const isActiveStatus = (
    status?: {
      name?: string;
      code?: string;
    } | null
  ) => {
    const value =
      status?.code ||
      status?.name ||
      "";

    return value
      .trim()
      .toUpperCase() === "ACTIVE";
  };

  /* ===================== PLAN ACTIVATE ===================== */

  const handleActivatePlan = async (
    plan: Plan
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to make this plan Active?"
      );

    if (!confirmed) return;

    try {
      const updatedPlan =
        await activatePlanStatus(
          plan._id,
          {
            status: "ACTIVE",
            type: "plan",
          }
        );

      setOrder((prev) => {
        if (!prev) return prev;

        return {
          ...prev,

          plans: prev.plans?.map(
            (p) =>
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
    } catch (error: any) {
      console.error(
        "Plan activation error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to activate plan"
      );
    }
  };

  /* ===================== ORDER ACTIVATE ===================== */

  const handleActivateOrder = async () => {
    if (!order._id) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to make this order Active?"
      );

    if (!confirmed) return;

    try {
      const updatedOrder =
        await updateOrderStatus(
          order._id,
          {
            status: "ACTIVE",
            type: "order",
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
    } catch (error: any) {
      console.error(
        "Failed to activate order:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to activate order"
      );
    }
  };

  /* ===================== DOMAIN ACTIVATE ===================== */

  const handleActivateDomain = async () => {
    if (!order._id) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to make this domain Active?"
      );

    if (!confirmed) return;

    try {
      const updatedOrder =
        await updateOrderStatus(
          order._id,
          {
            status: "ACTIVE",
            type: "domain",
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
    } catch (error: any) {
      console.error(
        "Failed to activate domain:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to activate domain"
      );
    }
  };

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

            {/* ORDER STATUS */}

            {isActiveStatus(
              order.order_status
            ) ? (
              <ActiveStatus />
            ) : (
              <ActivateButton
                onClick={
                  handleActivateOrder
                }
              />
            )}

          </div>

          {/* BACK */}

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            <FaArrowLeft />
            Back
          </button>

        </div>

        {/* ===================== DOMAIN INFORMATION ===================== */}

        <Section
          title="Domain Information"
          rightContent={
            isActiveStatus(
              order.domain_status
            ) ? (
              <ActiveStatus />
            ) : (
              <ActivateButton
                onClick={
                  handleActivateDomain
                }
              />
            )
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

            <label className="text-sm font-medium text-gray-700">
              Registrar:
            </label>

            <div className="flex items-center gap-2">

              {order.domainSource?.image && (
                <img
                  src={
                    order.domainSource.image.startsWith(
                      "/"
                    )
                      ? `${import.meta.env.VITE_API_BASE_URL}${order.domainSource.image}`
                      : `${import.meta.env.VITE_API_BASE_URL}/${order.domainSource.image}`
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

            <Info
              label="Name"
              value={order.customer.name}
            />

            <Info
              label="Company"
              value={order.customer.company}
            />

            <Info
              label="Email"
              value={order.customer.email}
            />

            <Info
              label="Phone"
              value={order.customer.phone}
            />

            <Info
              label="Address"
              value={order.customer.address}
            />

            <Info
              label="City"
              value={order.customer.city}
            />

            <Info
              label="State"
              value={order.customer.state}
            />

            <Info
              label="Country"
              value={order.customer.country}
            />

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

                      <th className="border px-2 py-2 text-left">
                        Email Type
                      </th>

                      <th className="border px-2 py-2 text-left">
                        Plan Name
                      </th>

                      <th className="border px-2 py-2 text-left">
                        Type
                      </th>

                      <th className="border px-2 py-2 text-left">
                        Users
                      </th>

                      <th className="border px-2 py-2 text-left">
                        Reg Date
                      </th>

                      <th className="border px-2 py-2 text-left">
                        Exp Date
                      </th>

                      <th className="border px-2 py-2 text-center">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {order.plans.map(
                      (plan) => {

                        const planIsActive =
                          isActiveStatus(
                            plan.primary_status
                          );

                        return (
                          <tr
                            key={plan._id}
                            className="hover:bg-gray-50"
                          >

                            <td className="border px-2 py-2">
                              {plan.emailType ||
                                "-"}
                            </td>

                            <td className="border px-2 py-2">
                              {plan.planName}
                            </td>

                            <td className="border px-2 py-2">
                              {plan.type}
                            </td>

                            <td className="border px-2 py-2">
                              {plan.noOfUsers ??
                                "-"}
                            </td>

                            <td className="border px-2 py-2">
                              {formatDate(
                                plan.registrationDate
                              )}
                            </td>

                            <td className="border px-2 py-2">
                              {formatDate(
                                plan.expiryDate
                              )}
                            </td>

                            {/* ===============================
                                PLAN STATUS / ACTION
                            ================================ */}

                            <td className="border px-2 py-2 text-center">

                              {planIsActive ? (
                                <ActiveStatus />
                              ) : (
                                <ActivateButton
                                  onClick={() =>
                                    handleActivatePlan(
                                      plan
                                    )
                                  }
                                />
                              )}

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </Section>
          )}

        {/* ===================== ACTIONS ===================== */}

        <div className="flex justify-end gap-3">

          <button
            onClick={() =>
              navigate(
                `/admin/orders/update/${order._id}`
              )
            }
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
          >
            <FaEdit />
            Edit
          </button>

          <button
            onClick={() =>
              navigate(
                `/admin/orders/renew/${order._id}`
              )
            }
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            <FaRedo />
            Renew
          </button>

        </div>

      </div>
    </div>
  );
};

export default ArchivedOrderDetails;