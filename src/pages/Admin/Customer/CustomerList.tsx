import { ICustomer, updateCustomer } from "./api";
import { FaEye, FaEdit, FaKey } from "react-icons/fa";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  customers: ICustomer[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onView: (customer: ICustomer) => void;
  onEdit: (customer: ICustomer) => void;
}

const CustomerList: React.FC<Props> = ({
  customers,
  currentPage,
  itemsPerPage,
  onPageChange,
  onView,
  onEdit,
}) => {
  const navigate = useNavigate();

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = customers.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  /* =======================
     PASSWORD STATES
  ======================= */
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<ICustomer | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  /* =======================
     NAVIGATE TO ORDERS PAGE
  ======================= */
  const handleCustomerClick = (customer: ICustomer) => {
    navigate(`/customer/${customer._id}/orders`);
  };

  /* =======================
     PASSWORD FUNCTIONS
  ======================= */
  const onAddPassword = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setNewPassword("");
    setShowModal(true);
  };

  const handleSavePassword = async () => {
    if (!selectedCustomer?._id || !newPassword.trim()) {
      alert("Enter password");
      return;
    }

    try {
      setIsSaving(true);
      await updateCustomer(selectedCustomer._id, { password: newPassword });
      alert("Password updated successfully");
      setShowModal(false);
    } catch {
      alert("Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* =======================
           CUSTOMER TABLE
      ======================= */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 w-[70px]">SL No</th>
            <th className="border p-2">Company</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginated.map((c, index) => (
            <tr key={c._id}>
              <td className="border p-2 text-center">{startIndex + index + 1}</td>

              {/* CLICK NAME → ORDERS PAGE */}
              <td className="border p-2 text-center">
                <button
                  onClick={() => handleCustomerClick(c)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {c.c_company}
                </button>
              </td>
               <td className="border p-2 text-center">
  {c.c_name && !c.c_name.trim().toLowerCase().startsWith('unknown')
    ? c.c_name
    : 'N/A'}
</td>




              <td className="border p-2 text-center">
                {Array.isArray(c.c_email) ? c.c_email[0] : c.c_email}
              </td>

              <td className="border p-2 text-center">{c.c_phone}</td>
              
              <td className="border p-2 text-center">
                <div className="flex justify-center gap-3">
                  <button onClick={() => onView(c)} title="View">
                    <FaEye />
                  </button>
                  <button onClick={() => onEdit(c)} title="Edit">
                    <FaEdit />
                  </button>
                  <button onClick={() => onAddPassword(c)} title="Change Password">
                    <FaKey />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* =======================
           PAGINATION CONTROLS
      ======================= */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 border rounded ${
                currentPage === page ? "bg-blue-600 text-white" : ""
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* =======================
           PASSWORD MODAL
      ======================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white w-[400px] p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Update Password</h2>

            <input
              type="text"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePassword}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
