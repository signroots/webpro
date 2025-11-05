import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchCustomerOrders,
  updateCustomer,
  Order,
  Customer,
} from "./api";

const CustomerOrders: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal + editing state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!customerId) return;

    const loadCustomerOrders = async () => {
      try {
        const data = await fetchCustomerOrders(customerId);

        if (data.status === "SUCCESS") {
          const cust: Customer = {
            _id: data.customer._id,
            name: data.customer.name,
            email: data.customer.email,
            phone: data.customer.phone,
            phoneCc: (data.customer as any).phoneCc || "91", // optional country code
            company: data.customer.company,
            address: data.customer.address,
            city: data.customer.city,
            state: (data.customer as any).state || "",
            zipCode: (data.customer as any).zipCode || "",
            country: data.customer.country,
            resellerCustomerId: data.customer.resellerCustomerId,
          };

          setCustomer(cust);
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

  const handleEditClick = () => {
    setEditCustomer(customer);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditCustomer((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSave = async () => {
    if (!editCustomer) return;
    setSaving(true);
    try {
      // Update local DB + ResellerClub
      const updated = await updateCustomer(editCustomer._id, {
        name: editCustomer.name,
        email: editCustomer.email,
        phone: editCustomer.phone,
        phoneCc: editCustomer.phoneCc,
        company: editCustomer.company,
        address: editCustomer.address,
        city: editCustomer.city,
        state: editCustomer.state,
        zipCode: editCustomer.zipCode,
        country: editCustomer.country,
      });

      setCustomer(updated.local); // update local state with updated local DB record
      setIsModalOpen(false);
      alert("✅ Customer updated successfully!");
    } catch (err: any) {
      console.error("❌ Failed to update customer", err);
      alert(
        `❌ Failed to update customer.\n${err?.details?.message || err.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="text-center mt-6">Loading customer orders...</div>;
  if (!customer)
    return (
      <div className="text-center mt-6 text-red-500">Customer not found</div>
    );

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

        <p>
          <strong>Name:</strong> {customer.name}
        </p>
        <p>
          <strong>Email:</strong> {customer.email || "-"}
        </p>
        <p>
          <strong>Phone:</strong> {customer.phone || "-"}
        </p>
        <p>
          <strong>Company:</strong> {customer.company || "-"}
        </p>
        <p>
          <strong>Address:</strong> {customer.address || "-"}
        </p>
        <p>
          <strong>City:</strong> {customer.city || "-"}
        </p>
        <p>
          <strong>State:</strong> {customer.state || "-"}
        </p>
        <p>
          <strong>Zip Code:</strong> {customer.zipCode || "-"}
        </p>
        <p>
          <strong>Country:</strong> {customer.country || "-"}
        </p>

        <hr className="my-6" />

        <h2 className="text-xl font-semibold mb-4">Orders</h2>
        {orders.length === 0 ? (
          <div className="text-gray-500 mt-2">
            No orders found for this customer.
          </div>
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
                  <tr
                    key={order._id}
                    className="hover:bg-gray-100 transition-colors"
                  >
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
        to="/order"
        className="mt-6 inline-block px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
      >
        ← Back to Customers
      </Link>

      {/* Edit Modal */}
      {isModalOpen && editCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Edit Customer</h3>

            <div className="grid grid-cols-1 gap-3">
              {[
                "name",
                "email",
                "phone",
                "phoneCc",
                "company",
                "address",
                "city",
                "state",
                "zipCode",
                "country",
              ].map((field) => (
                <div key={field}>
                  <label className="block text-gray-700 font-medium mb-1">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type="text"
                    name={field}
                    value={(editCustomer as any)[field] || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>

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
