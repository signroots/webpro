import React from "react";
import { ICustomer } from "./api";

interface Props {
  customer: ICustomer;
  countries: { code: string; name: string }[];
  states: { code: string; name: string }[];
  closeModal: () => void;
}

const CustomerViewModal: React.FC<Props> = ({
  customer,
  countries,
  states,
  closeModal,
}) => {
  // Normalize emails
  const emails = customer.c_email
    ? Array.isArray(customer.c_email)
      ? customer.c_email
      : customer.c_email.split(",")
    : [];

  // 🔑 Helper to safely render country/state
  const getName = (
    value: any,
    list: { code: string; name: string }[]
  ): string => {
    if (!value) return "-";
    if (typeof value === "object") return value.name || "-";
    return list.find((i) => i.code === value)?.name || value;
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-5">
          <h2 className="text-2xl font-semibold text-gray-800">
            Customer Details
          </h2>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-700 transition-colors text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-sm">
          <div className="font-medium text-gray-600">Name:</div>
          <div>{customer.c_name || "-"}</div>

          <div className="font-medium text-gray-600">Email:</div>
          <div className="flex flex-wrap items-center gap-2">
            {emails.length > 0 ? (
              emails.map((email, i) => (
                <span
                  key={i}
                  className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs"
                >
                  {email.trim()}
                </span>
              ))
            ) : (
              <span>-</span>
            )}
          </div>

          <div className="font-medium text-gray-600">Phone:</div>
          <div>{customer.c_phone || "-"}</div>

          <div className="font-medium text-gray-600">Company:</div>
          <div>{customer.c_company || "-"}</div>

          <div className="font-medium text-gray-600">Address:</div>
          <div>{customer.c_address || "-"}</div>

          <div className="font-medium text-gray-600">Country:</div>
          <div>{getName(customer.c_country, countries)}</div>

          <div className="font-medium text-gray-600">State:</div>
          <div>{getName(customer.c_state, states)}</div>

          <div className="font-medium text-gray-600">City:</div>
          <div>{customer.c_city || "-"}</div>

          <div className="font-medium text-gray-600">GST:</div>
          <div>{customer.c_gst || "-"}</div>

          <div className="font-medium text-gray-600">Zip Code:</div>
          <div>{customer.c_zipCode || "-"}</div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <button
            onClick={closeModal}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerViewModal;
