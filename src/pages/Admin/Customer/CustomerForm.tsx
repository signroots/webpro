import React from "react";

interface CustomerFormProps {
  modalType: string;
  selectedOrder: any;
  customerType: "existing" | "new";
  setCustomerType: (type: "existing" | "new") => void;

  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;

  client: any[];
  countries: any[];
  states: any[];

  fetchStatesByCountry: (code: string) => Promise<any[]>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  modalType,
  selectedOrder,
  customerType,
  setCustomerType,
  formData,
  setFormData,
  client,
  countries,
  states,
  fetchStatesByCountry,
  handleInputChange,
  handleSubmit,
}) => {
  if (modalType !== "addCustomer" || !selectedOrder) return null;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-black">Add Customer</h2>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Customer Type */}
        <div>
          <label className="mr-4 text-black">
            <input
              type="radio"
              checked={customerType === "existing"}
              onChange={() => setCustomerType("existing")}
            />
            Existing Customer
          </label>

          <label className="ml-4 text-black">
            <input
              type="radio"
              checked={customerType === "new"}
              onChange={() => setCustomerType("new")}
            />
            New Customer
          </label>
        </div>

        {/* Existing Customer */}
        {customerType === "existing" && (
          <div>
            <label className="block mb-2 text-black">Select Customer</label>
            <select
              value={formData.client?._id || ""}
              onChange={(e) => {
                const selected = client.find(c => c._id === e.target.value) || null;
                setFormData((prev: any) => ({ ...prev, client: selected }));
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Select Customer --</option>
              {client.map(c => (
                <option key={c._id} value={c._id}>
                  {c.c_name} ({c.c_email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* New Customer Form */}
        {customerType === "new" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* example field */}
            <input
              type="text"
              name="newCustomer.c_name"
              value={formData.newCustomer?.c_name || ""}
              onChange={handleInputChange}
              placeholder="Name"
              className="border p-2 rounded"
              required
            />

            {/* add remaining fields exactly like your existing code */}
          </div>
        )}

        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Add Customer
        </button>
      </form>
    </div>
  );
};

export default CustomerForm;
