import React from "react";

interface Order {
  sl: number;
  domain: string;
  expiry: string;
  status: string;
  subReseller?: string;
}

interface Customer {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  gst?: string;
  country: string;
}

interface Props {
  customer: Customer;
  orders: Order[];
  onBack: () => void;
  onEdit: () => void;
}

const CustomerOrders: React.FC<Props> = ({ customer, orders, onBack, onEdit }) => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Customer Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Customer Details</h2>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            ✏️ Edit
          </button>
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <p><strong>Name:</strong> {customer.name}</p>
          <p><strong>Email:</strong> {customer.email}</p>
          <p><strong>Phone:</strong> {customer.phone}</p>
          <p><strong>Company:</strong> {customer.company}</p>
          <p><strong>Address:</strong> {customer.address}</p>
          <p><strong>City:</strong> {customer.city}</p>
          <p><strong>State:</strong> {customer.state}</p>
          <p><strong>Zip Code:</strong> {customer.zip || "-"}</p>
          <p><strong>GST:</strong> {customer.gst || "-"}</p>
          <p><strong>Country:</strong> {customer.country}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Orders</h3>

        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2 w-12">SL</th>
              <th className="border p-2">Domain Name</th>
              <th className="border p-2">Expiry Date</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Sub Reseller</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.sl} className="hover:bg-gray-50">
                  <td className="border p-2 text-center">{o.sl}</td>
                  <td className="border p-2">{o.domain}</td>
                  <td className="border p-2">{o.expiry}</td>
                  <td className="border p-2 font-medium">
                    {o.status === "ACTIVE" ? (
                      <span className="text-green-600">{o.status}</span>
                    ) : (
                      o.status
                    )}
                  </td>
                  <td className="border p-2">{o.subReseller || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Back Button */}
        <div className="mt-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrders;
