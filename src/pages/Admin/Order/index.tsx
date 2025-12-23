import React, { useEffect, useState, useMemo } from "react";
import {
  FaEye,
  FaEdit,
  FaEnvelope,
  FaServer,
  FaLock,
  FaLaptopCode,
  FaGlobe,
  
} from "react-icons/fa";
import { SiCloudflare,SiHostinger } from "react-icons/si";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchOrders,fetchOrdersByProvider ,fetchCustomerOrder} from "./api";
import { fetchOrderById } from "./update/api";
import { createOrder } from "./new/api";
import axios from "axios";
import { updateOrder } from "./update/api";
import { fetchCountries, fetchStatesByCountry } from "../Customer/api";
import { notify } from "../../../Common/Toastify";

// -------------------- Types --------------------
interface Customer {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
 
}
interface Client {
  _id: string;
  c_name?: string;
  c_email?: string[];
  c_phone?: string;
  c_company?: string;
  c_address?: string;
  c_city?: string;
  c_country?: string;

}
interface ICountry {
  _id: string;
  name: string;
}
interface MSOfficeDetails {
  _id: string;
  orderId: string;
  planName: string;
  emailType: string;
  noOfUsers: number;
  serviceType: string;
  type: string;
  registrationDate: string;
  expiryDate: string;
  planId?: string;
}

interface Order {
  _id: string;
  domainName: string;
  lockStatus?: string;
  status?: string;
  users?: number;
  managedBy?: string;
  registrationDate?: string;
  expiryDate?: string;
  domainSource?: string;
  google_email?: boolean;
  microsoft_email?: boolean;
  cloudflareRegistered?: boolean;
  hosting?: boolean;
  email_flag?: boolean;
  website_flag?: boolean;
  ssl_flag?: boolean;
  host_flag?: boolean;
  msoffice_services_flag?: boolean;
  customer?: Customer | null;
  client?: Client | null;
  subResellerName?: string;
  subResellerEmail?: string;
  subscription?: string;
  provider?: string;
  email_status?: string;

  // ✅ Email Plans (OrderPlanSchema)
  emailPlans?: {
    _id: string;
    orderId: string;
    planId: {
      _id: string;
      plan: string;
      emailType: string;
      isActive: boolean;
    };
    emailTypeId: {
      _id: string;
      name: string;
    };
    registrationDate: string;
    expiryDate: string; // 👈 IMPORTANT
    noOfUsers: number;
    type: "email" | "storage" | "msoffice";
    adminEmail: string;
    adminPassword: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];

  // ✅ Plans array (From your previous system)
  plans?: {
    _id: string;
    orderId: string;
    planName: string;
    emailType: string;
    noOfUsers: number;
    serviceType: string;
    type: string;
    registrationDate: string;
    expiryDate: string;
    planId?: string;
  }[];

  // Flags merged from API
  email_service?: "Google Workspace" | "Microsoft 365";
  email_expiryDate?: string;

  // Customer Details
  // Customer Details
newCustomer?: {
  c_salutation?: string;
  c_firstName?: string;
  c_lastName?: string;
  c_name?: string;
  c_email?: string[];
  c_phone?: string;
  c_company?: string;
  c_address?: string;
  c_address2?: string;
  c_city?: string;
  c_state?: string;
  c_country?: string;
  c_zipCode?: string;
  c_gst?: string;
  c_bankAccountPayment?: string;
  c_placeOfContact?: string;
  c_placeOfContactWithStateCode?: string;
  c_portalEnabled?: boolean;
};

}
const PHONE_CODES = [
  { code: "IN", dial: "+91", name: "India" },
  { code: "US", dial: "+1", name: "USA" },
  { code: "AE", dial: "+971", name: "UAE" },
  { code: "UK", dial: "+44", name: "UK" },
];


// -------------------- Component --------------------
const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const { orderId } = useParams<{ orderId: string }>();
  const [error, setError] = useState<string | null>(null);
   const [client, setClient] = useState<Client[]>([]);
  const navigate = useNavigate();
  const [phoneCode, setPhoneCode] = useState("+91");
  const [formData, setFormData] = useState<Order>({
    _id: "",
    domainName: "",
    managedBy: "Signroots",
    users: 1,
    // domainSource:"",
newCustomer: {
  c_salutation: "",
  c_firstName: "",
  c_lastName: "",
  c_name: "",
  c_email: [],
  c_phone: "",
  c_company: "",
  c_address: "",
  c_address2: "",
  c_city: "",
  c_state: "",
  c_country: "",
  c_zipCode: "",
  c_gst: "",
  c_bankAccountPayment: "",
  c_placeOfContact: "",
  c_placeOfContactWithStateCode: "",
  c_portalEnabled: false,
}

  });

  // Filters
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [customerType, setCustomerType] = useState<"existing" | "new" | undefined>(undefined);
  const [emailChecked, setEmailChecked] = useState(false);
const [dropdownOpen, setDropdownOpen] = useState(false);


  // Selected order & modal type
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | "addCustomer" | null>(null);
const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
const [msofficeDetails, setMsofficeDetails] = useState<MSOfficeDetails[]>([]);
const [isHovering, setIsHovering] = useState(false);
const [hasFetchedMsoffice, setHasFetchedMsoffice] = useState(false);
const [msofficeCache, setMsofficeCache] = useState<Record<string, any[]>>({});
const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);




  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
     const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) => (
  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
    <p className="font-semibold">{label}</p>
    <p>{value || "N/A"}</p>
  </div>
);

  // -------------------- Load Orders --------------------
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const orders = await fetchOrders();
        setOrders(orders);
        setAllOrders(orders);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

useEffect(() => {
  const loadCountries = async () => {
    const data = await fetchCountries();
    setCountries(data);
  };

  if (modalType === "addCustomer") loadCountries();
}, [modalType]);
  // Fetch existing customers when "existing" is selected
  useEffect(() => {
    if (customerType === "existing") {
      axios
        .get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/existing_customers`)
        .then((res) => setClient(res.data.data))
        .catch((err) => console.error(err));
    }
  }, [customerType]);

  // -------------------- Apply Filters --------------------
  useEffect(() => {
    const applyFilters = async () => {
      let filtered: Order[] = allOrders;

      if (provider) {
        try {
          const providerOrders = await fetchOrdersByProvider(provider);
          filtered = providerOrders;
        } catch (err) {
          console.error("Failed to fetch provider orders", err);
        }
      }

      if (statusFilter) {
        filtered = filtered.filter(
          (o) => o.status?.toLowerCase() === statusFilter.toLowerCase()
        );
      }

      setOrders(filtered);
      setCurrentPage(1);
    };

    applyFilters();
  }, [provider, statusFilter, allOrders,customerType]);

  // -------------------- Handlers --------------------
const handleView = async (order: Order) => {
  // 👇 open modal immediately
  setModalType("view");
  setSelectedOrder(null); // clear previous data
  // setLoading(true);

  try {
    const latestOrder = await fetchCustomerOrder(order._id);
    setSelectedOrder(latestOrder.data);
    console.log("Fetched order:", latestOrder.data);
  } catch (err) {
    console.error("Failed to fetch order details:", err);
    alert("Failed to fetch order details. Please try again.");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  const setDefaultCountryAndState = async () => {
    // Only run when creating a new customer
    if (customerType === "new" && !formData.newCustomer?.c_country) {
      // Find India from the country list
      const india = countries.find(
        (c) => c.name.toLowerCase() === "india" || c.code === "IN"
      );

      if (india) {
        // Update formData with India
        setFormData((prev) => ({
          ...prev,
          newCustomer: {
            ...(prev.newCustomer || {}),
            c_country: india.code,
          },
        }));

        try {
          // Fetch states for India
          const stateList = await fetchStatesByCountry(india.code);
          setStates(stateList);

          // Find Kerala
          const kerala = stateList.find(
            (s) => s.name.toLowerCase() === "kerala"
          );

          // Update formData with Kerala
          setFormData((prev) => ({
            ...prev,
            newCustomer: {
              ...(prev.newCustomer || {}),
              c_country: india.code,
              c_state: kerala ? kerala.name : stateList[0]?.name || "",
            },
          }));
        } catch (err) {
          console.error("Failed to fetch Indian states:", err);
        }
      }
    }
  };

  setDefaultCountryAndState();
}, [customerType, countries]);


  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setModalType("edit");
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
  };
const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  if (customerType === "new" && name.startsWith("newCustomer.")) {
    const key = name.split(".")[1] as keyof NonNullable<Order["newCustomer"]>; // type-safe key
    setFormData(prev => ({
      ...prev,
      newCustomer: {
        ...(prev.newCustomer || {
          resellerCustomerId: "",
          c_name: "",
           c_email: [],
          c_phone: "",
          c_company: "",
          c_address: "",
          c_city: "",
          c_state: "",
          c_country: "",
          c_zipCode: "",
        }),
        [key]: value,
      },
    }));
  } else {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }
};

  // -------------------- Search & Pagination --------------------
const filteredOrders = useMemo(
  () =>
    orders.filter((o) =>
      (o.domainName ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [orders, searchTerm]
);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // setLoading(true);
  setError(null);

  try {
    const payload: any = {
      ...formData,
      is_customer: customerType === "existing",
    };

    if (customerType === "existing" && formData.client) {
      payload.client = formData.client;
      delete payload.newCustomer;
      payload.is_customer = true;
      payload.domainName = selectedOrder?.domainName;
    } else if (customerType === "new" && formData.newCustomer?.c_name && formData.newCustomer?.c_email) {
      payload.newCustomer = formData.newCustomer;
      if (formData.newCustomer.c_email.length === 0) {
        alert("At least one email is required.");
        return;
      }
      delete payload.client;
      payload.domainName = selectedOrder?.domainName;
      payload.is_customer = false;
    } else {
      delete payload.client;
      delete payload.newCustomer;
      delete payload.is_customer;
    }

    // Remove unnecessary _id property
    delete payload._id;

    const orderId = selectedOrder?._id;
    if (!orderId) {
      setError("Order ID is missing");
      setLoading(false);
      return;
    }

    console.log("Payload for updateOrder:", payload);

    // Call your updateOrder API
    await updateOrder(orderId, payload);

    // Update orders in the state after successful submission
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, ...payload } : o))
    );

    // Success notification
    notify("Order Updated Successfully...", "success");

    // Close modal after submission
    closeModal();

    // Reset the form data only after submission
    resetFormData();

    // Redirect to orders page
    navigate("/admin/orders");

  } catch (err) {
    console.error(err);
    setError((err as Error).message || "Failed to update order");
  } finally {
    setLoading(false); // Hide loading indicator
  }
};

const resetFormData = () => {
  setFormData({
    _id: "",
    domainName: "",
    managedBy: "Signroots",
    users: 1,
    newCustomer: {
      c_name: "",
      c_email: [],
      c_phone: "",
      c_company: "",
      c_address: "",
      c_city: "",
      c_state: "",
      c_country: "",
      c_zipCode: "",
      c_gst: "",
    },
  });
};

// Close modal and reset selectedOrder
// const closeModal = () => {
//   setSelectedOrder(null);
//   setModalType(null); // Close the modal
// };



  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    if (provider) return filteredOrders;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage, provider]);

  if (loading)
    return <p className="text-center text-gray-500 mt-6">Loading orders...</p>;

  // -------------------- JSX --------------------
  return (
    <div className="min-h-screen w-full bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-4 text-black">Orders</h1>
        <Link
          to="/admin/orders/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
  {/* 🔍 Search Field */}
  <input
    type="text"
    placeholder="Search domain..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="border px-3 py-2 rounded-lg text-black"
  />

  {/* 🌐 Provider Dropdown */}
  {/* Provider Dropdown */}
<div className="relative inline-block w-60">
  <button
    type="button"
    onClick={() => setDropdownOpen((prev) => !prev)}
    className="w-full border px-4 py-2 rounded-lg bg-white flex items-center justify-between text-black"
  >
    <div className="flex items-center gap-2">
      {provider === "Google Workspace" && (
        <img src="/download.png" alt="Google Workspace" className="w-5 h-5" />
      )}
      {provider === "Microsoft 365" && (
        <img src="/microsoft.png" alt="Microsoft 365" className="w-5 h-5" />
      )}
      {!provider && (
        <img src="/reset.png" alt="All Providers" className="w-5 h-5" />
      )}
      <span>
        {provider || "All Providers"}
      </span>
    </div>
    <span className="text-gray-500">▼</span>
  </button>

  {dropdownOpen && (
    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
      <div
        onClick={() => {
          setProvider(undefined);
          setDropdownOpen(false);
        }}
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
      >
        <img src="/reset.png" alt="All Providers" className="w-5 h-5" />
        <span>All Providers</span>
      </div>

      <div
        onClick={() => {
          setProvider("Google Workspace");
          setDropdownOpen(false);
        }}
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
      >
        <img src="/download.png" alt="Google Workspace" className="w-5 h-5" />
        <span>Google Workspace</span>
      </div>

      <div
        onClick={() => {
          setProvider("Microsoft 365");
          setDropdownOpen(false);
        }}
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
      >
        <img src="/microsoft.png" alt="Microsoft 365" className="w-5 h-5" />
        <span>Microsoft 365</span>
      </div>
    </div>
  )}
</div>



  {/* ⚙️ Status Filter */}
  <select
    value={statusFilter || ""}
    onChange={(e) => setStatusFilter(e.target.value || undefined)}
    className="border px-3 py-2 rounded-lg text-black bg-white"
  >
    <option value="">All Status</option>
    <option value="Active">Active</option>
    <option value="Inactive">Inactive</option>
    <option value="Expired">Expired</option>
  </select>
</div>

      {/* Orders Table */}
     <div className="bg-white shadow rounded-lg overflow-auto">
  <table className="min-w-full divide-y divide-gray-200 text-sm">
    
    {/* ================= HEADER ================== */}
    <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
      <tr>
        {["SL No", "Domain Name", "Customer", "Services", "Expiry Date", "Status", "Actions"].map(
          (col) => (
            <th key={col} className="px-6 py-3 text-left font-medium">
              {col}
            </th>
          )
        )}
      </tr>
    </thead>

    {/* ================= BODY ================== */}
    <tbody className="divide-y divide-gray-100 text-gray-900">
      {paginatedOrders.map((order, idx) => (
        <tr key={order._id} className="hover:bg-gray-50">

          {/* SL NO */}
          <td className="px-6 py-4">
            {(currentPage - 1) * itemsPerPage + idx + 1}
          </td>

          {/* DOMAIN + LOCK */}
          <td className="px-6 py-4 flex items-center gap-2">
            {order.lockStatus === "Locked" ? (
              <FaLock className="text-red-500 text-lg" />
            ) : (
              <FaLock className="text-green-500 text-lg" />
            )}
            <span className="font-medium">{order.domainName}</span>
          </td>

          {/* CUSTOMER */}
          <td className="px-6 py-4">
            {order.client ? (
              <Link
                to={`/customer/${order.client._id}/orders`}
                className="text-blue-600 hover:underline font-medium"
              >
                {order.client.c_company?.trim() || "N/A"}
              </Link>
            ) : (
              <button
                className="text-red-600 hover:underline font-medium"
                onClick={() => {
                  setSelectedOrder(order);
                  setModalType("addCustomer");
                }}
              >
                Add Customer
              </button>
            )}
          </td>

          {/* SERVICES */}
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">

              {/* Domain Source */}
              {order.domainSource ? (
                order.domainSource.toLowerCase() === "resellerclub" ? (
                  <img src="/images/resellerclub.png" className="w-6 h-6" title="ResellerClub" />
                ) : order.domainSource.toLowerCase() === "cloudflare" ? (
                  <img src="/images/cloudflare.png" className="w-7 h-7" title="Cloudflare" />
                ) : order.domainSource.toLowerCase() === "hostinger" ? (
                  <SiHostinger className="w-6 h-6 text-blue-500" title="Hostinger" />
                ) : order.domainSource.toLowerCase() === "ae server" ? (
                  <img src="/images/aeserverlogo.png" className="w-7 h-7" title="AE Server" />
                ) : (
                  <FaGlobe className="w-6 h-6 text-gray-400" title={order.domainSource} />
                )
              ) : (
                <FaGlobe className="w-6 h-6 text-gray-300" title="No Domain Source" />
              )}

              {/* Email Service */}
              {order.google_email ? (
                <img src="/download.png" className="w-5 h-5" title="Google Workspace" />
              ) : order.microsoft_email ? (
                <img src="/microsoft.png" className="w-5 h-5" title="Microsoft 365" />
              ) : (
                <FaEnvelope className="w-5 h-5 text-gray-300" title="No Email" />
              )}

            {/* MS OFFICE */}
{/* MS OFFICE */}
{order.msoffice_services_flag && (
  <div
    className="relative"
    onMouseEnter={async () => {
      setSelectedOrderId(order._id); // track which row is hovered
      setIsHovering(true);

      // Only fetch if this order's data hasn't been fetched yet
      if (msofficeCache[order._id]) return;

      try {
        const fullOrder = await fetchOrderById(order._id);
        const plans = fullOrder?.data?.plans || [];

        const msofficePlans = plans.filter(
          (p) =>
            p?.serviceType?.toLowerCase() === "msoffice" ||
            p?.type?.toLowerCase() === "msoffice"
        );

        // Save in cache keyed by order ID
        setMsofficeCache((prev) => ({ ...prev, [order._id]: msofficePlans }));
      } catch (err) {
        console.error("Error fetching MS Office details:", err);
      }
    }}
    onMouseLeave={() => setIsHovering(false)}
  >
    <img
      src="/MSOffice.png"
      className="w-5 h-5 cursor-pointer"
      title="MS Office Services"
    />

    {/* POPUP */}
    {isHovering &&
      selectedOrderId === order._id &&
      msofficeCache[order._id]?.length > 0 && (
        <div className="
          absolute left-0 top-full mt-2
          bg-gray-900 text-white text-xs
          p-3 w-64 max-h-64 overflow-y-auto
          rounded-lg shadow-xl z-50
        ">
          {msofficeCache[order._id].map((plan, idx) => (
            <div
              key={idx}
              className="mb-2 pb-2 border-b border-gray-700 last:border-0"
            >
              <p><b>Plan:</b> {plan.planName}</p>
              <p><b>Users:</b> {plan.noOfUsers}</p>
              <p><b>Type:</b> {plan.emailType}</p>
              <p>
                <b>Registered:</b>{" "}
                {plan.registrationDate
                  ? new Date(plan.registrationDate).toLocaleDateString()
                  : "-"}
              </p>
              <p>
                <b>Expires:</b>{" "}
                {plan.expiryDate
                  ? new Date(plan.expiryDate).toLocaleDateString()
                  : "-"}
              </p>
            </div>
          ))}
        </div>
      )}
  </div>
)}



              {/* Hosting */}
              <FaServer
                className={`w-5 h-5 ${
                  order.hosting ? "text-purple-500" : "text-gray-400 opacity-40"
                }`}
                title="Hosting"
              />

              {/* Website */}
              <FaLaptopCode
                className={`w-5 h-5 ${
                  order.website_flag ? "text-purple-500" : "text-gray-400 opacity-40"
                }`}
                title="Website"
              />
            </div>
          </td>
<td className="px-6 py-4 font-medium">
  {(() => {
    const formatDate = (date?: string) => {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleDateString("en-GB");
    };

    // 📌 Get Email Expiry
    const emailExp =
      order.emailPlans?.[0]?.expiryDate ||
      order.emailPlans?.[0]?.expiryDate // fallback if used

    // 📌 Domain Expiry
    const domainExp = order.expiryDate;

    // Compare dates only (no time)
    const sameDate =
      emailExp &&
      domainExp &&
      new Date(emailExp).toDateString() === new Date(domainExp).toDateString();

    return (
      <div className="flex flex-col gap-2">

        {/* If both expiry dates are same → single badge */}
        {sameDate ? (
          <div className="flex items-center gap-2 px-3 h-8 rounded-md bg-green-100 text-green-800 text-xs font-medium">
            <span className="w-5 h-5 flex justify-center items-center rounded-full bg-white text-black text-[10px]">
              EX
            </span>
            {formatDate(emailExp)}
          </div>
        ) : (
          <>
            {/* Show Email Expiry */}
            {emailExp && (
              <div className="flex items-center gap-2 px-3 h-8 rounded-md bg-blue-100 text-blue-800 text-xs font-medium">
                <span className="w-5 h-5 flex justify-center items-center rounded-full bg-white text-black text-[10px]">
                  EE
                </span>
                {formatDate(emailExp)}
              </div>
            )}

            {/* Show Domain Expiry */}
            {domainExp && (
              <div className="flex items-center gap-2 px-3 h-8 rounded-md bg-purple-100 text-purple-800 text-xs font-medium">
                <span className="w-5 h-5 flex justify-center items-center rounded-full bg-white text-black text-[10px]">
                  DE
                </span>
                {formatDate(domainExp)}
              </div>
            )}
          </>
        )}
      </div>
    );
  })()}
</td>



          {/* STATUS */}
          <td className="px-6 py-4 space-y-2">

  {/* Domain */}
  <div
    className={`flex items-center gap-2 px-3 h-8 rounded-md text-xs font-medium
      ${order.status?.toLowerCase() === "active"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"}`}
  >
    <span className="w-5 h-5 flex justify-center items-center rounded-full bg-white text-black text-[10px]">D</span>
    {order.status || "N/A"}
  </div>

  {/* Email */}
  <div
    className={`flex items-center gap-2 px-3 h-8 rounded-md text-xs font-medium
      ${order.email_status?.toLowerCase() === "active"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"}`}
  >
    <span className="w-5 h-5 flex justify-center items-center rounded-full bg-white text-black text-[10px]">E</span>
    {order.email_status || "N/A"}
  </div>
</td>


          {/* ACTIONS */}
          <td className="px-8 py-4 flex gap-3 text-gray-500">
            <button
              className="hover:text-blue-600"
              title="View"
              onClick={() => handleView(order)}
            >
              <FaEye />
            </button>

            <Link
              to={`/admin/orders/update/${order._id}`}
              className="hover:text-yellow-600"
              title="Edit"
            >
              <FaEdit />
            </Link>
          </td>

        </tr>
      ))}
    </tbody>
  </table>
</div>


      {/* Pagination */}
      {!provider && (
        <div className="mt-4 flex justify-center gap-4 text-black">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* -------------------- Modal -------------------- */}
  {modalType && selectedOrder && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-[600px] relative max-h-[90vh] overflow-y-auto">
      <button
        onClick={closeModal}
        className="absolute top-2 right-2 text-gray-600 hover:text-black"
      >
        ✕
      </button>

{/* View Order Modal */}
{modalType === "view" && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    {/* Modal Container */}
    <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-6xl max-h-[90vh] overflow-y-auto">
      
      {/* Close Button */}
      <button
        onClick={closeModal}
        className="absolute top-3 right-3 text-gray-500 hover:text-black text-2xl font-bold"
      >
        ✕
      </button>

      {/* Header */}
      <h2 className="text-2xl font-bold mb-6 border-b pb-3 text-gray-800">
        View Order
      </h2>

      {/* Main Content */}
      {selectedOrder ? (
        <div className="text-gray-900 space-y-10">
          
          {/* Order Details */}
          <section>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-gray-700">
              Order Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <InfoItem label="Domain" value={selectedOrder.domainName} />
              <InfoItem label="Status" value={selectedOrder.status || "Unknown"} />
  <InfoItem
  label="Registration Date"
  value={
    selectedOrder.registrationDate
      ? new Date(selectedOrder.registrationDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).replaceAll(" ", "-")
      : "N/A"
  }
/>

<InfoItem
  label="Expiry Date"
  value={
    selectedOrder.expiryDate
      ? new Date(selectedOrder.expiryDate).toLocaleDateString("en-GB",{
        day: "2-digit",
          month: "short",
          year: "numeric",
      }).replaceAll(" ","-")
      : "N/A"
  }
/>

              {/* <InfoItem label="Expiry Date" value={selectedOrder.expiryDate? new Date(selectedOrder.expiryDate).toLocaleDateString("en-GB"):"N/A"} /> */}
              <InfoItem label="Provider" value={selectedOrder.provider} />
              <InfoItem label="Subscription" value={selectedOrder.subscription} />
            </div>
          </section>

          {/* Client Details */}
          <section>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-gray-700">
              Registrant Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <InfoItem label="Name" value={selectedOrder.client?.c_name || "-"} />
              <InfoItem
                label="Email"
                value={
                  Array.isArray(selectedOrder.client?.c_email)
                    ? selectedOrder.client.c_email.join(", ")
                    : selectedOrder.client?.c_email || "-"
                }
              />
              <InfoItem label="Phone" value={selectedOrder.client?.c_phone || "-"} />
              <InfoItem label="Company" value={selectedOrder.client?.c_company || "-"} />
            </div>
          </section>

          {/* Customer Details */}
          <section>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-gray-700">
              Customer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <InfoItem label="Name" value={selectedOrder.customer?.name || "-"} />
              <InfoItem
                label="Email"
                value={
                  Array.isArray(selectedOrder.customer?.email)
                    ? selectedOrder.customer.email.join(", ")
                    : selectedOrder.customer?.email || "-"
                }
              />
              <InfoItem label="Phone" value={selectedOrder.customer?.phone || "-"} />
              <InfoItem label="Company" value={selectedOrder.customer?.company || "-"} />
              <InfoItem label="Address" value={selectedOrder.customer?.address || "-"} />
            </div>
          </section>

        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          No order details found.
        </div>
      )}

      {/* Footer Button */}
      <div className="mt-8 text-right">
        <button
          onClick={closeModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


      {/* Edit Order */}
      {modalType === "edit" && selectedOrder && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-black">Edit Order</h2>
          <form className="space-y-3">
            <label className="block">
              Domain:
              <input
                type="text"
                value={selectedOrder.domainName}
                className="border px-3 py-2 rounded w-full text-black"
                readOnly
              />
                  </label>
                   <label className="block">
              Domain:
              <input
                type="text"
                value={selectedOrder.domainSource}
                className="border px-3 py-2 rounded w-full text-black"
                readOnly
              />
            </label>


            <label className="block">
              Status:
              <select
                defaultValue={selectedOrder.status}
                className="border px-3 py-2 rounded w-full text-black"
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Expired</option>
              </select>
            </label>

            <label className="block">
              Customer Name:
              <input
                type="text"
                defaultValue={selectedOrder.customer?.name}
                className="border px-3 py-2 rounded w-full text-black"
              />
            </label>

            <label className="block">
              Customer Email:
              <input
                type="email"
                defaultValue={selectedOrder.customer?.email}
                className="border px-3 py-2 rounded w-full text-black"
              />
            </label>

            <label className="block">
              Customer Phone:
              <input
                type="text"
                defaultValue={selectedOrder.customer?.phone}
                className="border px-3 py-2 rounded w-full text-black"
              />
            </label>

            <label className="block">
              Expiry Date:
              <input
                type="date"
                defaultValue={selectedOrder.expiryDate}
                className="border px-3 py-2 rounded w-full text-black"
              />
            </label>

            <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg">
              Save Changes
            </button>
          </form>
        </div>
      )}

     {/* Add Customer Modal */}
{/* Add Customer Modal */}
{modalType === "addCustomer" && selectedOrder && (
  // <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4">
  //   <div className="bg-white p-6 rounded w-11/12 max-w-5xl shadow-lg">
  //     {/* Close Button */}
  //     <button
  //       className="absolute top-3 right-3 text-black text-2xl font-bold hover:text-red-500"
  //       onClick={() => setModalType(null)} // Close the modal
  //     >
  //       ×
  //     </button>
   <div
  className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center"
  onClick={() => setModalType(null)}
>
    <div
      className="bg-white rounded w-8/12 max-w-5xl shadow-lg relative p-4"
      onClick={(e) => e.stopPropagation()} // prevent modal close when clicking inside
    >
      {/* Close Button at Top Right */}
      <button
        className="absolute top-3 right-3 text-black text-2xl font-bold hover:text-red-500"
        onClick={() => setModalType(null)}
      >
        ×
      </button>
      <h2 className="text-xl font-bold mb-4 text-black">Add Customer</h2>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Customer Type */}
        <div className="flex gap-4 mb-4">
          <label className="text-black flex items-center gap-1">
            <input
              type="radio"
              value="existing"
              checked={customerType === "existing"}
              onChange={() => setCustomerType("existing")}
            />
            Existing Customer
          </label>
          <label className="text-black flex items-center gap-1">
            <input
              type="radio"
              value="new"
              checked={customerType === "new"}
              onChange={() => setCustomerType("new")}
            />
            New Customer
          </label>
        </div>

        {/* Existing Customer */}
        {customerType === "existing" && (
          <div className="mb-4">
            <label className="block mb-2 text-black">Select Customer</label>
            <select
              value={formData.client?._id || ""}
              onChange={(e) => {
                const selected = client.find((c) => c._id === e.target.value) || null;
                setFormData((prev) => ({ ...prev, client: selected }));
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Select Customer --</option>
              {client.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.c_company} ({Array.isArray(c.c_email) ? c.c_email.join(", ") : c.c_email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* New Customer Form */}
        {customerType === "new" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Salutation */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Salutation</label>
              <input
                type="text"
                name="newCustomer.c_salutation"
                value={formData.newCustomer?.c_salutation || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

           {/* First Name*/}
            {/* <div>
              <label className="block text-gray-700 font-medium mb-2">First Name</label>
              <input
                type="text"
                name="newCustomer.c_firstName"
                value={formData.newCustomer?.c_firstName || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div> */}

            {/* Last Name */}
            {/* <div>
              <label className="block text-gray-700 font-medium mb-2">Last Name</label>
              <input
                type="text"
                name="newCustomer.c_lastName"
                value={formData.newCustomer?.c_lastName || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div> */}

            {/* Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Name</label>
              <input
                type="text"
                name="newCustomer.c_name"
                value={formData.newCustomer?.c_name || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Phone */}
            {/* <div>
              <label className="block text-gray-700 font-medium mb-2">Phone</label>
              <input
                type="text"
                name="newCustomer.c_phone"
                value={formData.newCustomer?.c_phone || ""}
                onChange={handleInputChange}
                maxLength={10}
                placeholder="10-digit phone number"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div> */}
          {/* Phone */}
<div className="col-span-3">
  <label className="block text-gray-700 font-medium mb-2">Phone</label>

  <div className="flex gap-2">
    {/* Phone Code */}
    <select
      value={phoneCode}
      onChange={e => setPhoneCode(e.target.value)}
      className="w-28 border rounded px-3 py-2"
    >
      {PHONE_CODES.map(p => (
        <option key={p.code} value={p.dial}>
          {p.dial} ({p.name})
        </option>
      ))}
    </select>

    {/* Phone Number */}
    <input
      type="text"
      name="newCustomer.c_phone"
      value={formData.newCustomer?.c_phone || ""}
      onChange={e => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);

        // create a fake event so old handler still works
        handleInputChange({
          ...e,
          target: {
            ...e.target,
            value: `${phoneCode}${digits}`,
          },
        } as React.ChangeEvent<HTMLInputElement>);
      }}
      placeholder="10-digit phone number"
      maxLength={10}
      className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      required
    />
  </div>
</div>

            {/* Company */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Company</label>
              <input
                type="text"
                name="newCustomer.c_company"
                value={formData.newCustomer?.c_company || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">Address</label>
              <input
                type="text"
                name="newCustomer.c_address"
                value={formData.newCustomer?.c_address || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Address 2 */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">Address 2</label>
              <input
                type="text"
                name="newCustomer.c_address2"
                value={formData.newCustomer?.c_address2 || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">City</label>
              <input
                type="text"
                name="newCustomer.c_city"
                value={formData.newCustomer?.c_city || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* ZipCode */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Zip Code</label>
              <input
                type="text"
                name="newCustomer.c_zipCode"
                value={formData.newCustomer?.c_zipCode || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* GST */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">GST</label>
              <input
                type="text"
                name="newCustomer.c_gst"
                value={formData.newCustomer?.c_gst || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

         {/* Emails as pills */}
<div className="md:col-span-3 w-full">
  <label className="block text-gray-700 font-medium mb-1">Emails</label>
  <div className="flex flex-wrap gap-1 p-2 border rounded min-h-[40px] bg-gray-50">
    {/* Map emails as pills */}
    {formData.newCustomer?.c_email?.map((email: string, idx: number) => (
      <div
        key={idx}
        className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
      >
        {email}
<button
  type="button"
  className="ml-2 text-red-500 font-bold"
  onClick={() =>
    setFormData((prev: any) => ({
      ...prev,
      newCustomer: {
        ...(prev.newCustomer || {}),
        c_email: (prev.newCustomer?.c_email || []).filter((email: string, i: number) => i !== idx), // Explicitly typing the parameters
      },
    }))
  }
>
  ×
</button>



      </div>
    ))}

    {/* Input for adding new emails */}
    <input
      type="text"
      placeholder="Add email"
      className="flex-1 min-w-[120px] p-1 outline-none"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          const value = (e.currentTarget.value || "").trim();
          if (!value) return;

          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(value)) {
            alert("Invalid email format!"); // You can replace this with custom validation message
            return;
          }

          setFormData((prev: any) => ({
            ...prev,
            newCustomer: {
              ...(prev.newCustomer || {}),
              c_email: prev.newCustomer?.c_email
                ? [...prev.newCustomer.c_email, value]
                : [value],
            },
          }));

          e.currentTarget.value = ""; // Clear input field after adding email
        }
      }}
    />
  </div>
</div>

            {/* Country */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Country</label>
              <select
                name="newCustomer.c_country"
                value={formData.newCustomer?.c_country || ""}
                onChange={async (e) => {
                  const countryCode = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    newCustomer: { ...(prev.newCustomer || {}), c_country: countryCode, c_state: "" },
                  }));
                  if (countryCode) {
                    try {
                      const statesData = await fetchStatesByCountry(countryCode);
                      setStates(statesData);
                    } catch {
                      setStates([]);
                    }
                  } else setStates([]);
                }}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">-- Select Country --</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">State</label>
              <select
                name="newCustomer.c_state"
                value={formData.newCustomer?.c_state || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">-- Select State --</option>
                {states.map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bank Account Payment */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Bank Account Payment</label>
              <input
                type="text"
                name="newCustomer.c_bankAccountPayment"
                value={formData.newCustomer?.c_bankAccountPayment || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Place of Contact */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Place of Contact</label>
              <input
                type="text"
                name="newCustomer.c_placeOfContact"
                value={formData.newCustomer?.c_placeOfContact || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Place of Contact (State Code) */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Place of Contact (State Code)</label>
              <input
                type="text"
                name="newCustomer.c_placeOfContactWithStateCode"
                value={formData.newCustomer?.c_placeOfContactWithStateCode || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Portal Enabled */}
            <div className="md:col-span-3 flex items-center gap-2">
              <input
                type="checkbox"
                name="newCustomer.c_portalEnabled"
                checked={!!formData.newCustomer?.c_portalEnabled}
                onChange={handleInputChange}
              />
              <span>Portal Enabled</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add Customer
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  </div>
)}
    </div>
  );
};

export default Orders;
