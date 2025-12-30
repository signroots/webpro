import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCustomerOrders, updateCustomer, Order, Client, ICustomer } from "./api";
import { fetchCountryCodes } from "../../Customer/api";
import { SiCloudflare,SiHostinger } from "react-icons/si";
import {
  FaEye,
  FaEdit,
  FaEnvelope,
  FaServer,
  FaLock,
  FaLaptopCode,
  FaGlobe,
  
} from "react-icons/fa";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface EditClient extends Partial<Client> {
  _id: string;
}

interface Country {
  _id: string;
  name: string;
}

interface State {
  _id: string;
  name: string;
}

const CustomerOrders: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<EditClient | null>(null);
  const [phoneCodes, setPhoneCodes] = useState<string[]>([]);
const [phoneCode, setPhoneCode] = useState<string>("");

  const [phoneError, setPhoneError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCustomerOrders = async () => {
    if (!customerId || countries.length === 0) return;

    setLoading(true);
    try {
      const data = await fetchCustomerOrders(customerId);
      if (data.status === "SUCCESS") {
        const cust: Client = {
          _id: data.client._id,
          c_name: data.client.c_name,
          c_email: data.client.c_email || [],
          c_phone: data.client.c_phone,
          // c_phoneCc: data.client.c_phoneCc || "91",
          c_company: data.client.c_company,
          c_address: data.client.c_address,
          c_address2: data.client.c_address2 || "",
          c_city: data.client.c_city,
          c_state: data.client.c_state || "",
          c_state_name: "",
          c_zipCode: data.client.c_zipCode || "",
          c_country: data.client.c_country || "",
          c_countryCode: data.client.c_countryCode || "",
         c_mobilePhone:data.client.c_mobilePhone || "",
          c_country_name:
            countries.find((c) => c._id === data.client.c_country)?.name || "",
          c_gst: data.client.c_gst || "",
          c_bankAccountPayment: data.client.c_bankAccountPayment || "",
          c_salutation: data.client.c_salutation || "",
          c_placeOfContact: data.client.c_placeOfContact || "",
          c_placeOfContactWithStateCode: data.client.c_placeOfContactWithStateCode || "",
          c_portalEnabled: data.client.c_portalEnabled || false,
        };
        setClient(cust);
        setOrders(data.orders);

        // Load states for the country
        if (data.client.c_country) {
          const resStates = await fetch(`${API_BASE_URL}/api/settings/states-by-country?countryId=${data.client.c_country}`);
          const stateData: State[] = await resStates.json();
          setStates(stateData);
          const stateName = stateData.find((s) => s._id === data.client.c_state)?.name || "";
          setClient(prev => prev ? { ...prev, c_state_name: stateName } : prev);
        }
      } else {
        console.error("Error fetching customer orders:", data.message);
      }
    } catch (err) {
      console.error("❌ Error fetching customer orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings/countries`);
        const data: Country[] = await res.json();
        setCountries(data);
      } catch (err) {
        console.error("❌ Failed to load countries:", err);
      }
    };
    loadCountries();
  }, []);

  useEffect(() => {
    if (!editClient?.c_country) return;

    const loadStates = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings/states-by-country?countryId=${editClient.c_country}`);
        const data: State[] = await res.json();
        setStates(data);
      } catch (err) {
        console.error("❌ Failed to load states:", err);
      }
    };

    loadStates();
  }, [editClient?.c_country]);

  useEffect(() => {
    loadCustomerOrders();
  }, [customerId, countries]);
useEffect(() => {
  fetchCountryCodes()
    .then((codes) => {
      setPhoneCodes(codes);
    })
    .catch(console.error);
}, []);

 const handleEditClick = () => {
  if (!client) return;

  // sync both phoneCode (select) and editClient.c_phoneCc
  setEditClient({
    ...client,
    // c_phoneCc: client.c_phoneCc || "91"   // make sure c_phoneCc is set
  });

  setPhoneCode(client.c_phoneCc ? `+${client.c_phoneCc}` : "+91"); // select dropdown
  setIsModalOpen(true);
};

  const handleChange = (field: string, value: any) => {
    setEditClient(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange("c_country", e.target.value);
    handleChange("c_state", "");
  };

  const handleSaveCustomer = async (data: EditClient) => {
    setSaving(true);
    try {
      const payload: ICustomer = {
        _id: data._id,
        c_name: data.c_name || "",
        c_email: data.c_email || [],
        c_phone: data.c_phone || "",
        c_phoneCc: data.c_phoneCc || "",
        c_company: data.c_company || "",
        c_address: data.c_address || "",
        c_address2: data.c_address2 || "",
        c_city: data.c_city || "",
        c_state: data.c_state || "",
        c_zipCode: data.c_zipCode || "",
        c_country: data.c_country || "",
        c_countryCode:data.c_countryCode || "",
        c_mobilePhone:data.c_mobilePhone || "",
        c_gst: data.c_gst || "",
        c_bankAccountPayment: data.c_bankAccountPayment || "",
        c_salutation: data.c_salutation || "",
        c_placeOfContact: data.c_placeOfContact || "",
        c_placeOfContactWithStateCode: data.c_placeOfContactWithStateCode || "",
        c_portalEnabled: data.c_portalEnabled || false,
      };
      await updateCustomer(data._id, payload);
      alert("✅ Customer updated successfully!");
      setIsModalOpen(false);
      loadCustomerOrders();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-6">Loading customer orders...</div>;
  if (!client) return <div className="text-center mt-6 text-red-500">Customer not found</div>;

  return (
    <div className="min-h-screen p-6 bg-gray-100 text-black">
      {/* Customer Info */}
      <div className="bg-white p-6 rounded-lg shadow-md relative">
        <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
          Customer Details
          <button onClick={handleEditClick} className="text-blue-600 hover:text-blue-800">
            ✏️ Edit
          </button>
        </h2>
        <p><strong>Name:</strong> {client.c_name}</p>
        <p><strong>Email:</strong> {Array.isArray(client.c_email) ? client.c_email.join(", ") : "-"}</p>
       <p>
  <strong>Phone:</strong>{" "}
  {client.c_mobilePhone
    ? `${client.c_countryCode ? client.c_countryCode + " " : ""}${client.c_mobilePhone}`
    : "-"}
</p>
        <p><strong>Company:</strong> {client.c_company || "-"}</p>
        <p><strong>Address:</strong> {client.c_address || "-"}</p>
        <p><strong>Address 2:</strong> {client.c_address2 || "-"}</p>
        <p><strong>City:</strong> {client.c_city || "-"}</p>
        <p><strong>State:</strong> {client.c_state_name || "-"}</p>
        <p><strong>Zip Code:</strong> {client.c_zipCode || "-"}</p>
        <p><strong>GST:</strong> {client.c_gst || "-"}</p>
        <p><strong>Country:</strong> {client.c_country_name || "-"}</p>

        <hr className="my-6" />

        <h2 className="text-xl font-semibold mb-4">Orders</h2>
        {orders.length === 0 ? (
          <div className="text-gray-500 mt-2">No orders found for this customer.</div>
        ) : (
          <div className="overflow-x-auto w-full mt-2">
            <table className="table-auto w-full border border-gray-200 text-black text-sm">
              <thead className="bg-gray-300">
                <tr>
                  <th className="px-4 py-2 border">SL</th>
                  <th className="px-4 py-2 border">Domain Name</th>
                  <th className="px-4 py-2 border">Services</th>
                  <th className="px-4 py-2 border">Expiry Date</th>
                  <th className="px-4 py-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr key={order._id} className="hover:bg-gray-100 transition-colors">
                    <td className="px-4 py-2 border">{idx + 1}</td>
                    <td className="px-4 py-2 border">{order.domainName}</td>
                    <td className="px-4 py-2 border">
  <div className="flex items-center gap-3 flex-wrap">

    {/* DOMAIN SOURCE */}
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

    {/* EMAIL SERVICE */}
    {order.google_email ? (
      <img src="/download.png" className="w-5 h-5" title="Google Workspace" />
    ) : order.microsoft_email ? (
      <img src="/microsoft.png" className="w-5 h-5" title="Microsoft 365" />
    ) : (
      <FaEnvelope className="w-5 h-5 text-gray-300" title="No Email Service" />
    )}
    {/* MS OFFICE SERVICE */}
{order.msoffice_services_flag && (
  <img
    src="/MSOffice.png"
    className="w-5 h-5 cursor-pointer"
    title="MS Office Services"
  />
)}

   

  </div>
</td>

<td className="px-4 py-2 border font-medium">
  {(() => {
    const formatDate = (date?: string) => {
      if (!date) return null;
      const d = new Date(date);
      const day = d.getUTCDate().toString().padStart(2, "0");
      const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    };

    const domainExp = formatDate(order.expiryDate);

    const emailDates = (order.emailPlans || [])
      .map(p => formatDate(p.expiryDate))
      .filter((d): d is string => Boolean(d));

    // 🟢 SAME DATE → ED
    const isSameExpiry =
      domainExp &&
      emailDates.length > 0 &&
      emailDates.every(d => d === domainExp);

    return (
      <div className="flex flex-col gap-1">
        {/* ED */}
        {isSameExpiry && domainExp && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs">
            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white text-black text-[9px]">
              ED
            </span>
            {domainExp}
          </div>
        )}

        {/* EE */}
        {!isSameExpiry &&
          emailDates.map((date, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs"
            >
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white text-black text-[9px]">
                EE
              </span>
              {date}
            </div>
          ))}

        {/* DE */}
        {!isSameExpiry && domainExp && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs">
            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white text-black text-[9px]">
              DE
            </span>
            {domainExp}
          </div>
        )}

        {/* N/A */}
        {!domainExp && emailDates.length === 0 && (
          <span className="text-gray-400 text-xs">N/A</span>
        )}
      </div>
    );
  })()}
</td>



                    <td className="px-4 py-2 border">{order.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Link to="/admin/orders" className="mt-6 inline-block px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">
        ← Back to Orders
      </Link>

      {/* Full Edit Modal */}
      {isModalOpen && editClient && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start z-50 pt-10">
          <div className="bg-white p-6 rounded w-11/12 max-w-5xl">
            <h2 className="text-xl font-bold mb-4">Edit Customer</h2>

            {/* Grid Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Salutation" value={editClient.c_salutation || ""} onChange={e => handleChange("c_salutation", e.target.value)} className="w-full p-2 border rounded"/>
              <input placeholder="Name" value={editClient.c_name || ""} onChange={e => handleChange("c_name", e.target.value)} className="w-full p-2 border rounded"/>
              
              {/* Emails */}
              <div className="col-span-3">
                <div className="flex flex-wrap items-center gap-2 p-2 border rounded bg-gray-50">
                  {Array.isArray(editClient.c_email) && editClient.c_email.filter(em => em !== "").map((em, idx) => (
                    <div key={idx} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      <span className="mr-2">{em}</span>
                      <button type="button" onClick={() => setEditClient(prev => prev ? {...prev, c_email: prev.c_email?.filter((_, i) => i !== idx)} : null)} className="text-blue-600 hover:text-red-600 font-bold">×</button>
                    </div>
                  ))}
                  <input type="text" placeholder="Add email" className="flex-1 min-w-[120px] p-1 outline-none bg-transparent"
                    onKeyDown={e => {
                      if (e.key === "Tab") return;
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const value = (e.currentTarget.value || "").trim();
                        if (!value) return;
                        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailPattern.test(value)) { alert("Invalid email format!"); return; }
                        setEditClient(prev => prev ? {...prev, c_email: [...(prev.c_email || []), value]} : prev);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-2 col-span-3 md:col-span-3">
              
<select
  value={phoneCode}
  onChange={(e) => {
    const code = e.target.value;

    setPhoneCode(code);

    setEditClient((prev: EditClient | null) =>
      prev
        ? {
            ...prev,
            c_countryCode: code,          // "+91"
            c_phoneCc: code.replace("+", "") // "91"
          }
        : prev
    );
  }}
  className="w-28 p-2 border rounded"
>
  {phoneCodes.map((code) => (
    <option key={code} value={code}>
      {code}
    </option>
  ))}
</select>


                <input placeholder="Mobile Number" value={editClient.c_phone || ""} onChange={e => handleChange("c_phone", e.target.value)} maxLength={10} className={`flex-1 p-2 border rounded ${phoneError ? "border-red-500" : ""}`}/>
              </div>

              {/* Company, Address, City */}
              <input placeholder="Company" value={editClient.c_company || ""} onChange={e => handleChange("c_company", e.target.value)} className="w-full p-2 border rounded"/>
              <input placeholder="Address" value={editClient.c_address || ""} onChange={e => handleChange("c_address", e.target.value)} className="w-full p-2 border rounded"/>
              <input placeholder="Address 2" value={editClient.c_address2 || ""} onChange={e => handleChange("c_address2", e.target.value)} className="w-full p-2 border rounded"/>
              <input placeholder="City" value={editClient.c_city || ""} onChange={e => handleChange("c_city", e.target.value)} className="w-full p-2 border rounded"/>

              {/* Country, State */}
              <select value={editClient.c_country || ""} onChange={handleCountryChange} className="w-full p-2 border rounded">
                <option value="">Select Country</option>
                {countries.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <select value={editClient.c_state || ""} onChange={e => handleChange("c_state", e.target.value)} className="w-full p-2 border rounded">
                <option value="">Select State</option>
                {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>

              {/* Zip, GST, Bank */}
              <input placeholder="Zip Code" value={editClient.c_zipCode || ""} onChange={e => handleChange("c_zipCode", e.target.value)} className="w-full p-2 border rounded"/>
              <input placeholder="GST" value={editClient.c_gst || ""} onChange={e => handleChange("c_gst", e.target.value)} className="w-full p-2 border rounded"/>
              <input placeholder="Bank Account Payment" value={editClient.c_bankAccountPayment || ""} onChange={e => handleChange("c_bankAccountPayment", e.target.value)} className="w-full p-2 border rounded"/>

              {/* Place of Contact */}
              <input placeholder="Place of Contact" value={editClient.c_placeOfContact || ""} onChange={e => handleChange("c_placeOfContact", e.target.value)} className="w-full p-2 border rounded"/>
              <input placeholder="Place of Contact (State Code)" value={editClient.c_placeOfContactWithStateCode || ""} onChange={e => handleChange("c_placeOfContactWithStateCode", e.target.value)} className="w-full p-2 border rounded"/>

              {/* Portal Enabled */}
              <div className="col-span-3 flex items-center gap-2">
                <input type="checkbox" checked={!!editClient.c_portalEnabled} onChange={e => handleChange("c_portalEnabled", e.target.checked)}/>
                <span>Portal Enabled</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded border bg-gray-200">Cancel</button>
              <button onClick={() => handleSaveCustomer(editClient)} disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
