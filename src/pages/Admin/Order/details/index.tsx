import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCustomerOrders, updateCustomer, Order, Client,ICustomer } from "./api";

// Modal editing type aligned with Client
interface EditClient extends Partial<Client> {
  _id: string;
}

const CustomerOrders: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal + editing state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<EditClient | null>(null);
  const [saving, setSaving] = useState(false);

  // Load customer & orders
  useEffect(() => {
    if (!customerId) return;

    const loadCustomerOrders = async () => {
      try {
        const data = await fetchCustomerOrders(customerId);

        if (data.status === "SUCCESS") {
          const cust: Client = {
            _id: data.client._id,
            c_name: data.client.c_name,
            c_email: data.client.c_email,
            c_phone: data.client.c_phone,
            c_phoneCc: data.client.c_phoneCc || "91",
            c_company: data.client.c_company,
            c_address: data.client.c_address,
            c_city: data.client.c_city,
            c_state: data.client.c_state_name || "",
            c_zipCode: data.client.c_zipCode || "",
            c_country: data.client.c_country_name || "",
            c_gst:data.client.c_gst || ""
          };
          setClient(cust);
          setOrders(data.orders);
        } else {
          console.error("Error fetching customer orders:", data.message);
        }
      } catch (err) {
        console.error("❌ Error fetching customer orders:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerOrders();
  }, [customerId]);

  // Open modal with current client values
  const handleEditClick = () => {
    if (!client) return;
    setEditClient({ ...client });
    setIsModalOpen(true);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditClient((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  // Save changes
const handleSave = async () => {
  if (!editClient) return;
  setSaving(true);

  try {
    const updated: ICustomer = await updateCustomer(editClient._id, editClient);

    // Map ICustomer -> Client, ensure _id is defined
    if (!updated._id) throw new Error("Updated customer has no _id");

    const updatedClient: Client = {
      _id: updated._id,
      c_name: updated.c_name || "",
      c_email: updated.c_email || "",
      c_phone: updated.c_phone || "",
      c_company: updated.c_company || "",
      c_address: updated.c_address || "",
      c_city: updated.c_city || "",
      c_state: updated.c_state || "",
      c_zipCode: updated.c_zipCode || "",
      c_gst:updated.c_gst || "",
      c_country: updated.c_country || "",
    };

    setClient(updatedClient);
    setIsModalOpen(false);
    alert("✅ Customer updated successfully!");
  } catch (err: any) {
    console.error("❌ Failed to update customer", err);
    alert(`❌ Failed to update customer.\n${err?.message}`);
  } finally {
    setSaving(false);
  }
};

  if (loading)
    return <div className="text-center mt-6">Loading customer orders...</div>;
  if (!client)
    return <div className="text-center mt-6 text-red-500">Customer not found</div>;

  return (
    <div className="min-h-screen p-6 bg-gray-100 text-black">
      <div className="bg-white p-6 rounded-lg shadow-md relative">
        <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
          Customer Details
          <button
            onClick={handleEditClick}
            className="text-blue-600 hover:text-blue-800"
          >
            ✏️ Edit
          </button>
        </h2>

        <p><strong>Name:</strong> {client.c_name}</p>
        <p>
  <strong>Email:</strong>{" "}
  {Array.isArray(client.c_email) ? client.c_email.join(", ") : client.c_email || "-"}
</p>

        <p><strong>Phone:</strong> {client.c_phone || "-"}</p>
        <p><strong>Company:</strong> {client.c_company || "-"}</p>
        <p><strong>Address:</strong> {client.c_address || "-"}</p>
        <p><strong>City:</strong> {client.c_city || "-"}</p>
        <p><strong>State:</strong> {client.c_state || "-"}</p>
        <p><strong>Zip Code:</strong> {client.c_zipCode || "-"}</p>
        <p><strong>GST:</strong>{client.c_gst || "-"}</p>
        <p><strong>Country:</strong> {client.c_country || "-"}</p>

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
                  <th className="px-4 py-2 border">Expiry Date</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Sub Reseller</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr key={order._id} className="hover:bg-gray-100 transition-colors">
                    <td className="px-4 py-2 border">{idx + 1}</td>
                    <td className="px-4 py-2 border">{order.domainName}</td>
                    <td className="px-4 py-2 border">
                      {order.expiryDate
                        ? new Date(order.expiryDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2 border">{order.status || "-"}</td>
                    <td className="px-4 py-2 border">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Link
        to="/admin/orders"
        className="mt-6 inline-block px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
      >
        ← Back to Orders
      </Link>

      {/* Edit Modal */}
     {isModalOpen && editClient && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
      <h3 className="text-lg font-semibold mb-4">Edit Customer</h3>

      <div className="grid grid-cols-1 gap-3">
        {/* Name */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Name</label>
          <input
            type="text"
            name="c_name"
            value={editClient.c_name || ""}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Emails field */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Emails</label>
          <div className="flex flex-wrap items-center gap-2 p-2 border rounded bg-gray-50">
            {Array.isArray(editClient.c_email) &&
              editClient.c_email
                .filter((em: string) => em && em.trim() !== "")
                .map((em: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                  >
                    <span className="mr-2">{em}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditClient((prev: any) => ({
                          ...prev,
                          c_email: (prev.c_email ?? []).filter((_: any, i: number) => i !== idx),
                        }))
                      }
                      className="text-blue-600 hover:text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}

            {/* Input for adding new emails */}
            <input
              type="text"
              placeholder="Add email"
              className="flex-1 min-w-[120px] p-1 outline-none bg-transparent"
              onKeyDown={(e) => {
                if (e.key === "Tab") return;
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  const value = (e.currentTarget.value || "").trim();
                  if (!value) return;

                  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailPattern.test(value)) {
                    alert("Invalid email format!");
                    return;
                  }

                  setEditClient((prev: any) => ({
                    ...prev,
                    c_email: (prev.c_email ?? []).includes(value)
                      ? prev.c_email
                      : [...(prev.c_email ?? []), value],
                  }));

                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Phone</label>
          <input
            type="text"
            name="c_phone"
            value={editClient.c_phone || ""}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Company</label>
          <input
            type="text"
            name="c_company"
            value={editClient.c_company || ""}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Address</label>
          <input
            type="text"
            name="c_address"
            value={editClient.c_address || ""}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">City</label>
          <input
            type="text"
            name="c_city"
            value={editClient.c_city || ""}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">State</label>
          <input
            type="text"
            name="c_state"
            value={editClient.c_state || "Kerala"} // Default to Kerala
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Zip Code */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Zip Code</label>
          <input
            type="text"
            name="c_zipCode"
            value={editClient.c_zipCode || ""}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Country</label>
          <input
            type="text"
            name="c_country"
            value={editClient.c_country || "India"} // Default to India
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={() => setIsModalOpen(false)}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleSave}
          disabled={saving}
        >
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
