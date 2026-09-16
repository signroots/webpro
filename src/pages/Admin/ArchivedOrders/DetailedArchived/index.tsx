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
  FaTimes,
} from "react-icons/fa";

/* ===================== TYPES ===================== */

interface Status {
  _id: string;
  name: string;
  code?: string;
  type?: string;
  category?: "primary" | "secondary";
  is_active?: boolean;
  is_custom?: boolean;
}

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

  primary_status?: Status | null;
  secondary_status?: Status | null;
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

  status?: Status | null;
  order_status?: Status | null;
  domain_status?: Status | null;

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
  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
    Active
  </span>
);

/* ===================== MAIN COMPONENT ===================== */

const ArchivedOrderDetails: React.FC = () => {
  /*
   * Supports both:
   *
   * /archived/:orderId
   *
   * and
   *
   * /archived/:id
   */

  const params = useParams<{
    orderId?: string;
    id?: string;
  }>();

  const orderId = params.orderId || params.id;

  const navigate = useNavigate();

  /* ===================== ORDER STATES ===================== */

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ===================== STATUS SELECTION ===================== */

  const [selectedStatuses, setSelectedStatuses] =
    useState<{
      order: boolean;
      domain: boolean;
      plans: string[];
    }>({
      order: false,
      domain: false,
      plans: [],
    });

  /* ===================== STATUS MODAL ===================== */

  const [statusModalOpen, setStatusModalOpen] =
    useState(false);

  const [statusUpdating, setStatusUpdating] =
    useState(false);

  /* =========================================================
     MAP API RESPONSE
  ========================================================= */

  const mapApiOrder = (
    data: any
  ): Order => {
    const mapPerson = (
      source: any
    ): Customer | Client | undefined => {
      if (!source) {
        return undefined;
      }

      return {
        name: source.c_name,
        email: source.c_email,
        phone: source.c_phone,
        company: source.c_company,
        address: source.c_address,
        city: source.c_city,
        state: source.c_state?.name,
        country: source.c_country?.name,
      };
    };

    return {
      ...data,

      domainSource:
        data.domainSource || null,

      customer:
        mapPerson(data.customer),

      client:
        mapPerson(data.client),
    };
  };

  /* ===================== LOAD ORDER ===================== */

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await fetchOrderById(orderId);

        const mappedOrder =
          mapApiOrder(data);

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

  /* ===================== DATE ===================== */

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate
      .toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      )
      .replaceAll(" ", "-");
  };

  /* ===================== STATUS HELPERS ===================== */

  const getStatusValue = (
    status?: Status | null
  ) => {
    if (!status) {
      return "";
    }

    return String(
      status.code ||
      status.name ||
      ""
    )
      .trim()
      .toUpperCase();
  };

  const isActiveStatus = (
    status?: Status | null
  ) => {
    return (
      getStatusValue(status) ===
      "ACTIVE"
    );
  };

  const isInactiveStatus = (
    status?: Status | null
  ) => {
    const value =
      getStatusValue(status);

    return (
      value === "TRANSFERRED" ||
      value === "CANCELLED"
    );
  };

  /* =========================================================
     REFRESH ORDER
  ========================================================= */

  const refreshOrder = async () => {
    if (!order) {
      return;
    }

    const data =
      await fetchOrderById(
        order._id
      );

    const mappedOrder =
      mapApiOrder(data);

    setOrder(mappedOrder);
  };

  /* =========================================================
     SAVE SELECTED STATUSES
  ========================================================= */

  const handleSaveStatus = async () => {
    if (!order) {
      return;
    }

    const {
      order: orderSelected,
      domain: domainSelected,
      plans: selectedPlanIds,
    } = selectedStatuses;

    const hasSelection =
      orderSelected ||
      domainSelected ||
      selectedPlanIds.length > 0;

    if (!hasSelection) {
      alert(
        "Please select at least one status."
      );
      return;
    }

    try {
      setStatusUpdating(true);

      /* =====================
         UPDATE ORDER
      ===================== */

      if (orderSelected) {
        await updateOrderStatus(
          order._id,
          {
            status: "ACTIVE",
            type: "order",
          }
        );
      }

      /* =====================
         UPDATE DOMAIN
      ===================== */

      if (domainSelected) {
        await updateOrderStatus(
          order._id,
          {
            status: "ACTIVE",
            type: "domain",
          }
        );
      }

      /* =====================
         UPDATE PLANS
      ===================== */

      for (
        const planId of selectedPlanIds
      ) {
        await activatePlanStatus(
          planId,
          {
            status: "ACTIVE",
            type: "plan",
          }
        );
      }

      /* =====================
         REFRESH ORDER
      ===================== */

      await refreshOrder();

      alert(
        "Selected statuses activated successfully."
      );

      /* =====================
         RESET
      ===================== */

      setSelectedStatuses({
        order: false,
        domain: false,
        plans: [],
      });

      setStatusModalOpen(false);
    } catch (error: any) {
      console.error(
        "Failed to update statuses:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to update statuses."
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  /* ===================== SECTION ===================== */

  const Section: React.FC<{
    title: string;
    children: React.ReactNode;
    fullWidth?: boolean;
  }> = ({
    title,
    children,
    fullWidth,
  }) => (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800">
          {title}
        </h2>
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

  /* ===================== OPEN MODAL ===================== */

  const openStatusModal = () => {
    setSelectedStatuses({
      order: false,
      domain: false,
      plans: [],
    });

    setStatusModalOpen(true);
  };

  /* ===================== CLOSE MODAL ===================== */

  const closeStatusModal = () => {
    if (statusUpdating) {
      return;
    }

    setStatusModalOpen(false);

    setSelectedStatuses({
      order: false,
      domain: false,
      plans: [],
    });
  };

  /* ===================== LOADING ===================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">
          Loading order details...
        </p>
      </div>
    );
  }

  /* ===================== ERROR ===================== */

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-red-600 mb-4">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md"
          >
            <FaArrowLeft />
            Back
          </button>
        </div>
      </div>
    );
  }

  /* ===================== NO ORDER ===================== */

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-600 mb-4">
            Order not found
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md"
          >
            <FaArrowLeft />
            Back
          </button>
        </div>
      </div>
    );
  }

  /* ===================== RETURN ===================== */

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6 space-y-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex justify-between items-center gap-4">

          <div className="flex items-center gap-3">

            <h1 className="text-2xl font-bold text-gray-800">
              Order – {order.domainName}
            </h1>

            <button
              type="button"
              onClick={
                openStatusModal
              }
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Status Update
            </button>

          </div>

          {/* BACK */}

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            <FaArrowLeft />
            Back
          </button>

        </div>

        {/* =================================================
            DOMAIN INFORMATION
        ================================================= */}

        <Section title="Domain Information">

          <Info
            label="Domain Name"
            value={
              order.domainName
            }
          />

          <Info
            label="Managed By"
            value={
              order.managedBy
            }
          />

          {/* REGISTRAR */}

          <div>

            <p className="text-sm text-gray-500">
              Registrar
            </p>

            <div className="flex items-center gap-2 mt-1">

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
                {
                  order.domainSource?.name ||
                  "-"
                }
              </span>

            </div>

          </div>

          <Info
            label="Registration Date"
            value={
              formatDate(
                order.registrationDate
              )
            }
          />

          <Info
            label="Expiry Date"
            value={
              formatDate(
                order.expiryDate
              )
            }
          />

          <Info
            label="Lock Status"
            value={
              order.lockStatus
            }
          />

          <Info
            label="Name Servers"
            value={
              order.nameServers
            }
          />

        </Section>

        {/* =================================================
            CUSTOMER DETAILS
        ================================================= */}

        {order.customer && (
          <Section title="Customer Details">

            <Info
              label="Name"
              value={
                order.customer.name
              }
            />

            <Info
              label="Company"
              value={
                order.customer.company
              }
            />

            <Info
              label="Email"
              value={
                order.customer.email
              }
            />

            <Info
              label="Phone"
              value={
                order.customer.phone
              }
            />

            <Info
              label="Address"
              value={
                order.customer.address
              }
            />

            <Info
              label="City"
              value={
                order.customer.city
              }
            />

            <Info
              label="State"
              value={
                order.customer.state
              }
            />

            <Info
              label="Country"
              value={
                order.customer.country
              }
            />

          </Section>
        )}

        {/* =================================================
            CLIENT DETAILS
        ================================================= */}

        {order.client && (
          <Section title="Client Details">

            <Info
              label="Name"
              value={
                order.client.name
              }
            />

            <Info
              label="Company"
              value={
                order.client.company
              }
            />

            <Info
              label="Email"
              value={
                order.client.email
              }
            />

            <Info
              label="Phone"
              value={
                order.client.phone
              }
            />

            <Info
              label="Address"
              value={
                order.client.address
              }
            />

            <Info
              label="City"
              value={
                order.client.city
              }
            />

            <Info
              label="State"
              value={
                order.client.state
              }
            />

            <Info
              label="Country"
              value={
                order.client.country
              }
            />

          </Section>
        )}

        {/* =================================================
            PLANS & SERVICES
        ================================================= */}

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

                    </tr>

                  </thead>

                  <tbody>

                    {order.plans.map(
                      (plan) => (
                        <tr
                          key={plan._id}
                          className="hover:bg-gray-50"
                        >

                          <td className="border px-2 py-2">
                            {
                              plan.emailType ||
                              "-"
                            }
                          </td>

                          <td className="border px-2 py-2">
                            {
                              plan.planName ||
                              "-"
                            }
                          </td>

                          <td className="border px-2 py-2">
                            {
                              plan.type ||
                              "-"
                            }
                          </td>

                          <td className="border px-2 py-2">
                            {
                              plan.noOfUsers ??
                              "-"
                            }
                          </td>

                          <td className="border px-2 py-2">
                            {
                              formatDate(
                                plan.registrationDate
                              )
                            }
                          </td>

                          <td className="border px-2 py-2">
                            {
                              formatDate(
                                plan.expiryDate
                              )
                            }
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </Section>
          )}

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(
                `/admin/orders/update/${order._id}`
              )
            }
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
          >
            <FaEdit />
            Edit
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/admin/orders/renew/${order._id}`
              )
            }
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <FaRedo />
            Renew
          </button>

        </div>

      </div>

      {/* =====================================================
          STATUS UPDATE MODAL
      ===================================================== */}

      {statusModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex items-center justify-between px-6 py-4 border-b">

              <h2 className="text-xl font-semibold text-gray-800">
                Status Update
              </h2>

              <button
                type="button"
                onClick={
                  closeStatusModal
                }
                disabled={
                  statusUpdating
                }
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <FaTimes />
              </button>

            </div>

            {/* =================================================
                MODAL BODY
            ================================================= */}

            <div className="p-6 space-y-5">

              {/* =================================================
                  ORDER STATUS
              ================================================= */}

              <div className="border rounded-lg p-4">

                <div className="flex items-center justify-between gap-4">

                  <label
                    className={`flex items-center gap-3 ${
                      isInactiveStatus(
                        order.order_status
                      )
                        ? "cursor-pointer"
                        : "cursor-not-allowed"
                    }`}
                  >

                    <input
                      type="checkbox"
                      checked={
                        selectedStatuses.order
                      }
                      disabled={
                        !isInactiveStatus(
                          order.order_status
                        ) ||
                        statusUpdating
                      }
                      onChange={(e) =>
                        setSelectedStatuses(
                          (prev) => ({
                            ...prev,
                            order:
                              e.target.checked,
                          })
                        )
                      }
                      className="w-4 h-4"
                    />

                    <span className="font-semibold text-gray-800">
                      Order Status
                    </span>

                  </label>

                  <span
                    className={
                      isInactiveStatus(
                        order.order_status
                      )
                        ? "font-semibold text-red-600"
                        : "font-semibold text-green-600"
                    }
                  >
                    {order.order_status?.name ||
                      order.order_status?.code ||
                      "-"}
                  </span>

                </div>

              </div>

              {/* =================================================
                  DOMAIN STATUS
              ================================================= */}

              <div className="border rounded-lg p-4">

                <div className="flex items-center justify-between gap-4">

                  <label
                    className={`flex items-center gap-3 ${
                      isInactiveStatus(
                        order.domain_status
                      )
                        ? "cursor-pointer"
                        : "cursor-not-allowed"
                    }`}
                  >

                    <input
                      type="checkbox"
                      checked={
                        selectedStatuses.domain
                      }
                      disabled={
                        !isInactiveStatus(
                          order.domain_status
                        ) ||
                        statusUpdating
                      }
                      onChange={(e) =>
                        setSelectedStatuses(
                          (prev) => ({
                            ...prev,
                            domain:
                              e.target.checked,
                          })
                        )
                      }
                      className="w-4 h-4"
                    />

                    <span className="font-semibold text-gray-800">
                      Domain Status
                    </span>

                  </label>

                  <span
                    className={
                      isInactiveStatus(
                        order.domain_status
                      )
                        ? "font-semibold text-red-600"
                        : "font-semibold text-green-600"
                    }
                  >
                    {order.domain_status?.name ||
                      order.domain_status?.code ||
                      "-"}
                  </span>

                </div>

              </div>

              {/* =================================================
                  PLAN STATUS
              ================================================= */}

              <div className="border rounded-lg p-4">

                <div className="mb-4">

                  <span className="font-semibold text-gray-800">
                    Plan Status
                  </span>

                </div>

                <div className="space-y-3">

                  {(order.plans || [])
                    .filter(
                      (plan) =>
                        !!plan.emailType
                    )
                    .map((plan) => {

                      const inactive =
                        isInactiveStatus(
                          plan.primary_status
                        );

                      const selected =
                        selectedStatuses.plans.includes(
                          plan._id
                        );

                      return (
                        <div
                          key={plan._id}
                          className="bg-gray-50 border rounded-lg p-4"
                        >

                          <div className="flex items-center justify-between gap-4">

                            <label
                              className={`flex items-start gap-3 ${
                                inactive
                                  ? "cursor-pointer"
                                  : "cursor-not-allowed"
                              }`}
                            >

                              <input
                                type="checkbox"
                                checked={selected}
                                disabled={
                                  !inactive ||
                                  statusUpdating
                                }
                                onChange={(e) => {

                                  setSelectedStatuses(
                                    (prev) => ({
                                      ...prev,

                                      plans:
                                        e.target.checked
                                          ? [
                                              ...prev.plans,
                                              plan._id,
                                            ]
                                          : prev.plans.filter(
                                              (id) =>
                                                id !==
                                                plan._id
                                            ),
                                    })
                                  );
                                }}
                                className="w-4 h-4 mt-1"
                              />

                              <div>

                                <p className="font-semibold text-gray-800">
                                  {
                                    plan.emailType ||
                                    plan.planName ||
                                    "Email Plan"
                                  }
                                </p>

                                {plan.planName && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {
                                      plan.planName
                                    }
                                  </p>
                                )}

                              </div>

                            </label>

                            <span
                              className={
                                inactive
                                  ? "font-semibold text-red-600"
                                  : "font-semibold text-green-600"
                              }
                            >
                              {plan.primary_status
                                ?.name ||
                                plan.primary_status
                                  ?.code ||
                                "ACTIVE"}
                            </span>

                          </div>

                        </div>
                      );
                    })}

                  {/* NO EMAIL PLANS */}

                  {(order.plans || [])
                    .filter(
                      (plan) =>
                        !!plan.emailType
                    ).length === 0 && (
                    <div className="bg-gray-50 border rounded-lg p-4">

                      <p className="text-sm text-gray-500">
                        No email plans available.
                      </p>

                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">

              <button
                type="button"
                onClick={
                  closeStatusModal
                }
                disabled={
                  statusUpdating
                }
                className="px-5 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={
                  handleSaveStatus
                }
                disabled={
                  statusUpdating ||
                  (
                    !selectedStatuses.order &&
                    !selectedStatuses.domain &&
                    selectedStatuses.plans
                      .length === 0
                  )
                }
                className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {statusUpdating
                  ? "Saving..."
                  : "Save"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default ArchivedOrderDetails;