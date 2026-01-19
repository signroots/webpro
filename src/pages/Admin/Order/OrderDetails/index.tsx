import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrderById } from "../api";
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
interface Order {
  _id: string;
  domainName: string;
  status?: string;
  managedBy?: string;
  registrationDate?: string;
  expiryDate?: string;
  provider?: string;
  domainSource?: string;

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

const CheckboxValue: React.FC<{ checked?: boolean }> = ({ checked }) => (
  <input type="checkbox" checked={!!checked} readOnly className="cursor-default" />
);

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}> = ({ title, children, fullWidth }) => (
  <section className="mb-6">
    <h2 className="text-lg font-semibold mb-3 border-b pb-2">{title}</h2>
    <div className={fullWidth ? "" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
      {children}
    </div>
  </section>
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

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    fetchOrderById(orderId)
      .then((data) => {
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
          customer: mapPerson(data.customer),
          client: mapPerson(data.client),
        };

        setOrder(mappedOrder);
      })
      .catch(() => setError("Failed to load order details"))
      .finally(() => setLoading(false));
  }, [orderId]);


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

        {/* Domain Information */}
        <Section title="Domain Information">
          <Info label="Domain Name" value={order.domainName} />
          <Info label="Status" value={order.status} />
          <Info label="Managed By" value={order.managedBy} />

          {/* Registrar + Domain Flag (READ ONLY) */}
          <div>
            <p className="text-sm text-gray-500">Registrar</p>
            <div className="flex items-center gap-4 font-medium text-gray-800">
              <span>{order.domainSource || "-"}</span>

              {order.domainSource === "Cloudflare" && (
                <div className="flex items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    checked={!!order.domain_flag}
                    disabled
                    className="cursor-not-allowed"
                  />
                  <span className="text-sm">Domain Flag</span>
                </div>
              )}
            </div>
          </div>

          <Info label="Registration Date" value={formatDate(order.registrationDate)} />
          <Info label="Expiry Date" value={formatDate(order.expiryDate)} />
          <Info label="Lock Status" value={order.lockStatus} />
          <Info label="Username" value={order.username} />
          <Info label="Business Email" value={order.businessEmail ? "Yes" : "No"} />
          {/* <Info label="Cloudflare Registered" value={order.cloudflareRegistered ? "Yes" : "No"} /> */}
          <Info label="Google Email" value={order.google_email ? "Yes" : "No"} />
          <Info label="Microsoft Email" value={order.microsoft_email ? "Yes" : "No"} />
          <Info label="Email Status" value={order.email_status} />
          <Info label="Name Servers" value={order.nameServers} />
          <Info label="Storage Services" value={order.storage_services_flag ? "Yes" : "No"} />
        </Section>


        {order.customer && (
          <Section title="Customer Details">
            <Info label="Name" value={order.customer.name} />
            <Info label="Company" value={order.customer.company} />
            <Info label="Email" value={order.customer.email} />
            <Info label="Phone" value={order.customer.phone} />
            <Info label="Address" value={order.customer.address} />
            <Info label="City" value={order.customer.city} />
            <Info label="State" value={order.customer.state} />
            <Info label="Country" value={order.customer.country} />
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
        {order.plans && order.plans.length > 0 && (
          <Section title="Plans & Services" fullWidth>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">Plan Name</th>
                    <th className="border px-2 py-1">Service Type</th>
                    <th className="border px-2 py-1">Type</th>
                    <th className="border px-2 py-1">Provider</th>
                    <th className="border px-2 py-1">Users</th>
                    <th className="border px-2 py-1">Reg Date</th>
                    <th className="border px-2 py-1">Exp Date</th>
                    <th className="border px-2 py-1">Email Type</th>
                  </tr>
                </thead>
                <tbody>
                  {order.plans.map((plan) => (
                    <tr key={plan._id}>
                      <td className="border px-2 py-1">{plan.planName}</td>
                      <td className="border px-2 py-1">{plan.serviceType}</td>
                      <td className="border px-2 py-1">{plan.type}</td>
                      <td className="border px-2 py-1">{plan.provider}</td>
                      <td className="border px-2 py-1">{plan.noOfUsers}</td>
                      <td className="border px-2 py-1">{formatDate(plan.registrationDate)}</td>
                      <td className="border px-2 py-1">{formatDate(plan.expiryDate)}</td>
                      <td className="border px-2 py-1">{plan.emailType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Active Services */}
        <Section title="Active Services">
          <ul className="list-disc pl-6">
            {order.email_flag && <li>Email</li>}
            {order.host_flag && <li>Hosting</li>}
            {order.ssl_flag && <li>SSL</li>}
            {order.website_flag && <li>Website</li>}
          </ul>
        </Section>

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
