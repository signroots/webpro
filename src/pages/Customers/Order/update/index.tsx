import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Select from "react-select"; 
interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface OrderForm {
  domainName: string;
  status?: string;
  managedBy: "Signroots" | "Customer";
  registrationDate?: string;
  expiryDate?: string;
  subscription?: string;
  plan?: string;
  email_status?: string;
  username?: string;
  password?: string;
  users?: number;
  customer?: string;
  provider?: string;
  email_expiryDate?: string;
  email_service?: "Google Workspace" | "Microsoft 365";
  hosting?: boolean;
  cloudflareRegistered?: boolean;
  website_flag?: boolean;
  ssl_flag?: boolean;
  host_flag?: boolean;
  lockStatus?: string;
  domainSource?: string[];
  subResellerName?: string;
  subResellerEmail?: string;

  newCustomer: {
    resellerCustomerId?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

const UpdateOrder: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const [formData, setFormData] = useState<OrderForm>({
    domainName: "",
    managedBy: "Signroots",
    users: 1,
    newCustomer: {
      resellerCustomerId: "",
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [customerType, setCustomerType] = useState<"existing" | "new">("new");
  const [customers, setCustomers] = useState<Customer[]>([]);

  // ✅ Fetch order data
  useEffect(() => {
    if (!orderId) {
      setLoadingOrder(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/orders/${orderId}`
        );

        const orderData = res.data;
        const order = orderData.data || orderData;

        setCustomerType(order.customer ? "existing" : "new");
        setEmailChecked(!!order.email_flag);

        setFormData({
          domainName: order.domainName || "",
          managedBy: order.managedBy || "Signroots",
          registrationDate: order.registrationDate?.slice(0, 10) || "",
          expiryDate: order.expiryDate?.slice(0, 10) || "",
          status: order.status || "Active",
          customer: order.customer?._id || "",
          newCustomer: order.customer || {
            resellerCustomerId: "",
            name: "",
            email: "",
            phone: "",
            company: "",
            address: "",
            city: "",
            state: "",
            country: "",
            zipCode: "",
          },

          // ✅ Correctly set email_service string
          email_service: order.google_email
            ? "Google Workspace"
            : order.microsoft_email
            ? "Microsoft 365"
            : undefined,

          // Flags
          hosting: !!order.hosting,
          website_flag: !!order.website_flag,
          ssl_flag: !!order.ssl_flag,
          host_flag: !!order.host_flag,
        });
      } catch (err) {
        console.error("❌ Fetch order error:", err);
        setError("Failed to fetch order data");
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // ✅ Fetch existing customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      if (customerType === "existing") {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/orders/existing_customers`
          );
          setCustomers(res.data.data);
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchCustomers();
  }, [customerType]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

   if (customerType === "new" && name.startsWith("newCustomer.")) {
  const key = name.split(".")[1] as keyof OrderForm["newCustomer"];
  setFormData((prev) => ({
    ...prev,
    newCustomer: {
      ...prev.newCustomer,
      [key]: value,
    },
  }));
} else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    if (name === "email_services") {
      setEmailChecked(checked);
      if (!checked) {
        setFormData((prev) => ({ ...prev, email_service: undefined }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        ...formData,
        is_customer: customerType === "existing",
      };

      if (customerType === "existing") {
        payload.customer = formData.customer;
        delete payload.newCustomer;
      } else {
        payload.newCustomer = formData.newCustomer;
        delete payload.customer;
      }

      if (emailChecked) {
        payload.email_flag = true;
        payload.google_email = formData.email_service === "Google Workspace";
        payload.microsoft_email = formData.email_service === "Microsoft 365";
      } else {
        payload.email_flag = false;
        payload.google_email = false;
        payload.microsoft_email = false;
      }

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/orders/${orderId}`,
        payload
      );
      alert("✅ Order updated successfully!");
      navigate("/order");
    } catch (err) {
      setError((err as Error).message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  if (loadingOrder) return <p>Loading order data...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-700">Update Order</h1>

        {error && (
          <p className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</p>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Customer Type */}
          <div>
            <label className="mr-4 text-black">
              <input
                type="radio"
                value="existing"
                checked={customerType === "existing"}
                onChange={() => setCustomerType("existing")}
              />
              Existing Customer
            </label>
            <label className="ml-4 text-black">
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
  <div className="mb-4 text-black">
    <label className="block mb-2 text-black">Select Customer</label>
    <Select
      options={customers.map((c) => ({
        label: `${c.name} (${c.email})`,
        value: c._id,
      }))}
      value={
        customers
          .map((c) => ({
            label: `${c.name} (${c.email})`,
            value: c._id,
          }))
          .find((option) => option.value === formData.customer) || null
      }
      onChange={(selectedOption) => {
        setFormData((prev) => ({
          ...prev,
          customer: selectedOption?.value || "",
        }));
      }}
      isClearable
      placeholder="Search and select a customer..."
      className="react-select-container"
      classNamePrefix="react-select"
    />
  </div>
)}

          {/* New Customer */}
          {customerType === "new" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Name", name: "name" },
                { label: "Email", name: "email" },
                { label: "Phone", name: "phone" },
                { label: "Company", name: "company" },
                { label: "Address", name: "address" },
                { label: "City", name: "city" },
                { label: "State", name: "state" },
                { label: "Country", name: "country" },
                { label: "Reseller ID", name: "resellerCustomerId" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-gray-700 font-medium mb-2">{field.label}</label>
                  <input
                    type="text"
                    name={`newCustomer.${field.name}`}
                    value={(formData.newCustomer as any)?.[field.name] || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Domain Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Domain Name</label>
              <input
                type="text"
                name="domainName"
                value={formData.domainName}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Managed By</label>
              <select
                name="managedBy"
                value={formData.managedBy}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="Signroots">Signroots</option>
                <option value="Customer">Customer</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Registration Date</label>
              <input
                type="date"
                name="registrationDate"
                value={formData.registrationDate || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Services */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Services</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-black">
                <input
                  type="checkbox"
                  name="email_services"
                  checked={emailChecked}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4"
                />
                Email Services
              </label>

              {emailChecked && (
                <div className="flex gap-4 ml-6 mt-1">
                  <label className="flex items-center gap-2 text-black">
                    <input
                      type="radio"
                      name="email_service"
                      value="Google Workspace"
                      checked={formData.email_service === "Google Workspace"}
                      onChange={handleInputChange}
                    />
                    Google Workspace
                  </label>

                  <label className="flex items-center gap-2 text-black">
                    <input
                      type="radio"
                      name="email_service"
                      value="Microsoft 365"
                      checked={formData.email_service === "Microsoft 365"}
                      onChange={handleInputChange}
                    />
                    Microsoft 365
                  </label>
                </div>
              )}

              {["hosting", "website_flag", "ssl_flag", "host_flag"].map((field) => (
                <label key={field} className="flex items-center gap-2 text-black">
                  <input
                    type="checkbox"
                    name={field}
                    checked={(formData as any)[field] || false}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4"
                  />
                  <span>{field.replace("_", " ").replace("flag", "").toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/order")}
              className="bg-gray-500 text-white font-medium py-2 px-4 rounded hover:bg-gray-600 transition"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              {loading ? "Updating..." : "Update Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateOrder;
