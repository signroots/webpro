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
  handleSubmit,
}) => {
  if (modalType !== "addCustomer" || !selectedOrder) return null;

  /* 🔑 helper for new customer fields */
  const handleNewCustomerChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      newCustomer: {
        ...prev.newCustomer,
        [field]: value,
      },
    }));
  };

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
                const selected =
                  client.find((c) => c._id === e.target.value) || null;
                setFormData((prev: any) => ({ ...prev, client: selected }));
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Select Customer --</option>
              {client.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.c_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* New Customer Form */}
        {customerType === "new" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <input
              placeholder="Salutation"
              value={formData.newCustomer?.c_salutation || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_salutation", e.target.value)
              }
              className="w-full p-2 border rounded"
            />

            {/* <input
              placeholder="First Name"
              value={formData.newCustomer?.c_firstName || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_firstName", e.target.value)
              }
              className="w-full p-2 border rounded"
            />

            <input
              placeholder="Last Name"
              value={formData.newCustomer?.c_lastName || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_lastName", e.target.value)
              }
              className="w-full p-2 border rounded"
            /> */}

            <input
              placeholder="Name"
              value={formData.newCustomer?.c_name || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_name", e.target.value)
              }
              className="w-full p-2 border rounded"
              required
            />

            {/* EMAIL CHIPS */}
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
                {(formData.newCustomer?.c_email || []).map((em: string) => (
                  <span
                    key={em}
                    className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                  >
                    {em}
                    <button
                      type="button"
                      className="ml-2 text-red-600 font-bold"
                      onClick={() =>
                        handleNewCustomerChange(
                          "c_email",
                          formData.newCustomer.c_email.filter(
                            (x: string) => x !== em
                          )
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  placeholder="Add email"
                  className="flex-1 min-w-[120px] outline-none bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const value = e.currentTarget.value.trim();
                      if (!value) return;

                      const valid =
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                      if (!valid) return alert("Invalid email");

                      handleNewCustomerChange("c_email", [
                        ...(formData.newCustomer?.c_email || []),
                        value,
                      ]);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            </div>

            <input
              placeholder="Mobile Number"
              value={formData.newCustomer?.c_phone || ""}
              onChange={(e) =>
                handleNewCustomerChange(
                  "c_phone",
                  e.target.value.replace(/\D/g, "")
                )
              }
              maxLength={10}
              className="w-full p-2 border rounded"
            />

            <input
              placeholder="Company"
              value={formData.newCustomer?.c_company || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_company", e.target.value)
              }
              className="w-full p-2 border rounded"
            />

            <input
              placeholder="Address"
              value={formData.newCustomer?.c_address || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_address", e.target.value)
              }
              className="w-full p-2 border rounded col-span-2"
            />

            <input
              placeholder="Address 2"
              value={formData.newCustomer?.c_address2 || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_address2", e.target.value)
              }
              className="w-full p-2 border rounded col-span-2"
            />

            <input
              placeholder="City"
              value={formData.newCustomer?.c_city || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_city", e.target.value)
              }
              className="w-full p-2 border rounded"
            />

            <select
              value={formData.newCustomer?.c_country || ""}
              onChange={(e) => {
                handleNewCustomerChange("c_country", e.target.value);
                fetchStatesByCountry(e.target.value);
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={formData.newCustomer?.c_state || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_state", e.target.value)
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Select State</option>
              {states.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Zip Code"
              value={formData.newCustomer?.c_zipCode || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_zipCode", e.target.value)
              }
              className="w-full p-2 border rounded"
            />

            <input
              placeholder="GST"
              value={formData.newCustomer?.c_gst || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_gst", e.target.value)
              }
              className="w-full p-2 border rounded"
            />

            <input
              placeholder="Bank Account Payment"
              value={formData.newCustomer?.c_bankAccountPayment || ""}
              onChange={(e) =>
                handleNewCustomerChange(
                  "c_bankAccountPayment",
                  e.target.value
                )
              }
              className="w-full p-2 border rounded"
            />

            <input
              placeholder="Place of Contact"
              value={formData.newCustomer?.c_placeOfContact || ""}
              onChange={(e) =>
                handleNewCustomerChange("c_placeOfContact", e.target.value)
              }
              className="w-full p-2 border rounded"
            />

            <input
              placeholder="Place of Contact (State Code)"
              value={
                formData.newCustomer?.c_placeOfContactWithStateCode || ""
              }
              onChange={(e) =>
                handleNewCustomerChange(
                  "c_placeOfContactWithStateCode",
                  e.target.value
                )
              }
              className="w-full p-2 border rounded"
            />

            <div className="col-span-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!formData.newCustomer?.c_portalEnabled}
                onChange={(e) =>
                  handleNewCustomerChange(
                    "c_portalEnabled",
                    e.target.checked
                  )
                }
              />
              <span>Portal Enabled</span>
            </div>
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
