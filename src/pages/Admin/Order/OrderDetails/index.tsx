import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrderById ,fetchStatuses,updateOrderStatus,updatePlanStatus,fetchOrderStatuses,fetchPlanStatuses} from "../api";
import { FaArrowLeft, FaEdit, FaRedo } from "react-icons/fa";

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
  status?: {
  _id: string;
  name: string;
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
const CheckboxValue: React.FC<{ checked?: boolean }> = ({ checked }) => (
  <input type="checkbox" checked={!!checked} readOnly className="cursor-default" />
);


const Info: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium text-gray-800">
      {Array.isArray(value) ? value.join(", ") : value ?? "-"}
    </p>
  </div>
);

/* ===================== MAIN COMPONENT ===================== */

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
const [statuses, setStatuses] = useState<Status[]>([]);
const [planStatuses, setPlanStatuses] = useState<
  Record<string, Status[]>
>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  if (!orderId) return;

  const loadOrderDetails = async () => {
    try {
      const data = await fetchOrderById(orderId);

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
        domainSource: data.domainSource || null,
        customer: mapPerson(data.customer),
        client: mapPerson(data.client),
      };

      setOrder(mappedOrder);

      // ===============================
      // ORDER STATUSES
      // ===============================

      const orderStatusData = await fetchOrderStatuses(orderId);

      setStatuses(orderStatusData);

      // ===============================
      // PLAN STATUSES
      // ===============================

      const planStatusMap: Record<string, Status[]> = {};

      for (const plan of mappedOrder.plans || []) {
        const statusData = await fetchPlanStatuses(plan._id);

        planStatusMap[plan._id] = statusData;
      }

      setPlanStatuses(planStatusMap);

    } catch (error) {
      console.error(error);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  loadOrderDetails();

}, [orderId]);
const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  rightContent?: React.ReactNode;
}> = ({ title, children, fullWidth, rightContent }) => (
  <section className="mb-6">

    <div className="flex items-center justify-between mb-3 border-b pb-2">
      <h2 className="text-lg font-semibold">
        {title}
      </h2>

      {rightContent}
    </div>

    <div className={fullWidth ? "" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
      {children}
    </div>

  </section>
);

  if (loading) return <p className="p-6">Loading order details…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!order) return <p className="p-6">Order not found</p>;

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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6 space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Domain Details – {order.domainName}
          </h1>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            <FaArrowLeft /> Back
          </button>
        </div>

<Section
  title="Domain Information"
  rightContent={
    <select
      value={order.status?._id || ""}
      onChange={async (e) => {
        const newStatusId = e.target.value;

        if (!newStatusId || newStatusId === order.status?._id) {
          return;
        }

        const selectedStatus = statuses.find(
          (status) => status._id === newStatusId
        );

        const confirmed = window.confirm(
          `Are you sure you want to change the status to "${selectedStatus?.name}"?`
        );

        if (!confirmed) {
          return;
        }

        try {
         const updatedOrder = await updateOrderStatus(
  order._id,
  newStatusId
);

setOrder((prev) => {
  if (!prev) return prev;

  return {
    ...prev,
    status: updatedOrder.status,
  };
});
        } catch (error) {
          alert("Failed to update order status");
        }
      }}
      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700"
    >
      <option value="">Select Status</option>

      {statuses
        .filter((status) => status.is_active)
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
  
  <Info label="Domain Name" value={order.domainName} />

  <Info label="Managed By" value={order.managedBy} />

  {/* Registrar */}
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
              : `${API_BASE_URL}/uploads/domainsources/${order.domainSource.image}`
          }
          className="w-6 h-6 object-contain"
        />
      )}

      <span className="text-sm text-gray-700">
        {order.domainSource?.name || "-"}
      </span>
    </div>
  </div>

  <Info
    label="Registration Date"
    value={formatDate(order.registrationDate)}
  />

  <Info
    label="Expiry Date"
    value={formatDate(order.expiryDate)}
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

        {order.customer && (
  <Section title="Customer Details">
    {order.customer.name && (
      <Info label="Name" value={order.customer.name} />
    )}

    {order.customer.company && (
      <Info label="Company" value={order.customer.company} />
    )}

    {order.customer.email && (
      <Info label="Email" value={order.customer.email} />
    )}

    {order.customer.phone && (
      <Info label="Phone" value={order.customer.phone} />
    )}

    {order.customer.address && (
      <Info label="Address" value={order.customer.address} />
    )}

    {order.customer.city && (
      <Info label="City" value={order.customer.city} />
    )}

    {order.customer.state && (
      <Info label="State" value={order.customer.state} />
    )}

    {order.customer.country && (
      <Info label="Country" value={order.customer.country} />
    )}
  </Section>
)}
        {order.client && (
          <Section title="Client Details">
            <Info label="Name" value={order.client.name} />
            <Info label="Company" value={order.client.company} />
            <Info label="Email" value={order.client.email} />
            <Info label="Phone" value={order.client.phone} />
            <Info label="Address" value={order.client.address} />
            <Info label="City" value={order.client.city} />
            <Info label="State" value={order.client.state} />
            <Info label="Country" value={order.client.country} />
          </Section>
        )}


        {/* Plans */}
       {/* Plans */}
{order.plans && order.plans.length > 0 && (
  <Section title="Plans & Services" fullWidth>

    <div className="overflow-x-auto">
      <table className="w-full border border-gray-300">

        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Email Type</th>
            <th className="border px-2 py-1">Plan Name</th>
            <th className="border px-2 py-1">Type</th>
            <th className="border px-2 py-1">Users</th>
            <th className="border px-2 py-1">Reg Date</th>
            <th className="border px-2 py-1">Exp Date</th>
            <th className="border px-2 py-1">Status</th>
          </tr>
        </thead>

        <tbody>
          {order.plans.map((plan) => (
            <tr key={plan._id}>

              <td className="border px-2 py-1">
                {plan.emailType}
              </td>

              <td className="border px-2 py-1">
                {plan.planName}
              </td>

              <td className="border px-2 py-1">
                {plan.type}
              </td>

              <td className="border px-2 py-1">
                {plan.noOfUsers}
              </td>

              <td className="border px-2 py-1">
                {formatDate(plan.registrationDate)}
              </td>

              <td className="border px-2 py-1">
                {formatDate(plan.expiryDate)}
              </td>

              {/* STATUS */}
             <td className="border px-2 py-1 text-center">
  <select
    value={plan.status?._id || ""}
    onChange={async (e) => {
      const newStatusId = e.target.value;

      if (!newStatusId || newStatusId === plan.status?._id) {
        return;
      }

      const availableStatuses =
        planStatuses[plan._id] || [];

      const selectedStatus = availableStatuses.find(
        (status) => status._id === newStatusId
      );

      if (!selectedStatus) {
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to change the status to "${selectedStatus.name}"?`
      );

      if (!confirmed) {
        return;
      }

      try {
        const updatedPlan = await updatePlanStatus(
          plan._id,
          newStatusId
        );

        setOrder((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            plans: prev.plans?.map((item) =>
              item._id === plan._id
                ? {
                    ...item,
                    status: updatedPlan.status,
                  }
                : item
            ),
          };
        });

      } catch (error) {
        console.error("Plan status update error:", error);
        alert("Failed to update plan status");
      }
    }}
    className="border border-gray-300 rounded-md px-2 py-1 text-sm font-medium text-gray-700"
  >
    <option value="">
      Select Status
    </option>

    {(planStatuses[plan._id] || [])
      .filter((status) => status.is_active)
      .map((status) => (
        <option
          key={status._id}
          value={status._id}
        >
          {status.name}
        </option>
      ))}
  </select>
</td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>

  </Section>
)}

        {/* Active Services */}
        {/* <Section title="Active Services">
          <ul className="list-disc pl-6">
            {order.email_flag && <li>Email</li>}
            {order.host_flag && <li>Hosting</li>}
            {order.ssl_flag && <li>SSL</li>}
            {order.website_flag && <li>Website</li>}
          </ul>
        </Section> */}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate(`/admin/orders/update/${order._id}`)}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded"
          >
            <FaEdit /> Edit
          </button>

          <button
            onClick={() => navigate(`/admin/orders/renew/${order._id}`)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded"
          >
            <FaRedo /> Renew
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
