import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createOrder } from "../api";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface NewOrderForm {
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
  customer?: string; // customer ID
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
      // New customer fields
   newCustomer: {   // remove optional ?
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


const NewOrder: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<NewOrderForm>({
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
  const [error, setError] = useState<string | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [customerType, setCustomerType] = useState<"existing" | "new" | undefined>(undefined);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Fetch existing customers when "existing" is selected
  useEffect(() => {
    if (customerType === "existing") {
      axios
        .get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/existing_customers`)
        .then((res) => setCustomers(res.data.data))
        .catch((err) => console.error(err));
    }
  }, [customerType]);

  // Generic input handler
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;

  if (customerType === "new" && name.startsWith("newCustomer.")) {
    const key = name.split(".")[1];
    setFormData(prev => ({
      ...prev,
      newCustomer: {
        ...(prev.newCustomer || {}),
        [key]: value,
      },
    }));
  } else {
    setFormData(prev => ({ ...prev, [name]: value }));
  }
};

  // Checkbox handler
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

     if (customerType === "existing" && formData.customer) {
      payload.is_customer = true;
      payload.customer = formData.customer;
    } else if (customerType === "new" && formData.newCustomer?.name && formData.newCustomer?.email) {
      payload.is_customer = false;
      payload.newCustomer = formData.newCustomer;
    } else {
      // No customer selected — remove both just in case
      delete payload.customer;
      delete payload.newCustomer;
      delete payload.is_customer;
    }

    // ✅ Email flags
    if (emailChecked) {
      payload.email_flag = true;
      payload.google_email = formData.email_service === "Google Workspace";
      payload.microsoft_email = formData.email_service === "Microsoft 365";
    } else {
      payload.email_flag = false;
      payload.google_email = false;
      payload.microsoft_email = false;
    }

    await createOrder(payload);
    alert("Order created successfully!");
    navigate("/order");
  } catch (err) {
    setError((err as Error).message || "Failed to create order");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-700">Create New Order</h1>

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

          {/* Existing customer dropdown */}
          {customerType === "existing" && (
            <div className="mb-4">
              <label className="block mb-2 text-black">Select Customer</label>
              <select
                name="customer"
                value={formData.customer || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
            
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* New customer fields */}
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
                // { label: "ZIP Code", name: "zipCode" },
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  {/* Domain Name */}
  <div>
    <label className="block text-gray-700 font-medium mb-2">Domain Name</label>
    <input
      type="text"
      name="domainName"
      value={formData.domainName}
      onChange={handleInputChange}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      required
    />
  </div>

  {/* Managed By */}
  <div>
    <label className="block text-gray-700 font-medium mb-2">Managed By</label>
    <select
      name="managedBy"
      value={formData.managedBy}
      onChange={handleInputChange}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <option value="Signroots">Signroots</option>
      <option value="Customer">Customer</option>
    </select>
  </div>

  {/* Registration Date */}
  <div>
    <label className="block text-gray-700 font-medium mb-2">Registration Date</label>
    <input
      type="date"
      name="registrationDate"
      value={formData.registrationDate || ""}
      onChange={handleInputChange}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>

  {/* Expiry Date */}
  <div>
    <label className="block text-gray-700 font-medium mb-2">Expiry Date</label>
    <input
      type="date"
      name="expiryDate"
      value={formData.expiryDate || ""}
      onChange={handleInputChange}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>

  {/* Provider */}
  {/* <div className="md:col-span-2">
    <label className="block text-gray-700 font-medium mb-2">Provider</label>
    <select
      name="provider"
      value={formData.provider || ""}
      onChange={handleInputChange}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <option value="">Select Provider</option>
      <option value="Google Workspace">Google Workspace</option>
      <option value="Microsoft 365">Microsoft 365</option>
    </select>
  </div> */}
</div>


          {/* Services */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Services</label>
            <div className="flex flex-col gap-2">
              {/* Email Services */}
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
                      className="h-4 w-4 text-blue-600 accent-blue-600"
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
                      className="h-4 w-4 text-blue-600 accent-blue-600"
                    />
                    Microsoft 365
                  </label>
                </div>
              )}

              {/* Other service checkboxes */}
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

          {/* Submit Button */}
         <div className="flex justify-end gap-3">
  {/* Back Button */}
  <button
    type="button"
    onClick={() => navigate("/order")}
    className="bg-gray-500 text-white font-medium py-2 px-4 rounded hover:bg-gray-600 transition"
  >
    Back
  </button>

  {/* Submit Button */}
  <button
    type="submit"
    disabled={loading}
    className="bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 transition"
  >
    {loading ? "Creating..." : "Create Order"}
  </button>
</div>
        </form>
      </div>
    </div>
  );
};

export default NewOrder;
