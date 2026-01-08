import { ICustomer, updateCustomer } from "./api";
import { FaEye, FaEdit, FaCopy, FaKey, FaEyeSlash } from "react-icons/fa";
import React, { useState } from "react";
import { Link } from "react-router-dom";
interface Props {
  customers: ICustomer[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onView: (customer: ICustomer) => void;
  onEdit: (customer: ICustomer) => void;
  highlightCustomerId: string | null;
}

const CustomerList: React.FC<Props> = ({
  customers,
  currentPage,
  itemsPerPage,
  onPageChange,
  onView,
  onEdit,
  highlightCustomerId,
}) => {
  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const paginated = customers.slice(startIndex, startIndex + itemsPerPage);
  // const totalPages = Math.ceil(customers.length / itemsPerPage);

  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [requireChange, setRequireChange] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedPassword, setSavedPassword] = useState("");

const [searchTerm, setSearchTerm] = useState("");
  const onAddPassword = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
    setAutoGenerate(true);
    setNewPassword("");
    setSavedPassword("");
  };
  
  // ✅ Save Password (Auto or Manual)
  const handleSavePassword = async () => {
    if (!selectedCustomer?._id) {
      alert("Please select a customer");
      return;
    }

    let finalPassword = newPassword;

    if (!autoGenerate) {
      // Manual password validation
      if (!newPassword.trim()) {
        alert("❌ Please enter a password");
        return;
      }
      if (newPassword.length < 8 || newPassword.length > 256) {
        alert("❌ Password must be between 8 and 256 characters.");
        return;
      }

      const hasUppercase = /[A-Z]/.test(newPassword);
      const hasLowercase = /[a-z]/.test(newPassword);
      const hasNumber = /\d/.test(newPassword);
      const hasSymbol = /[!@#$%^&*(),.?\":{}|<>]/.test(newPassword);

      const strengthCount =
        [hasUppercase, hasLowercase, hasNumber, hasSymbol].filter(Boolean).length;

      if (strengthCount < 3) {
        alert(
          "❌ Password must include at least three of the following: uppercase, lowercase, number, and symbol."
        );
        return;
      }
    } else {
      // ✅ Auto-generate random password
      const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%!";
      finalPassword = Array.from({ length: 10 }, () =>
        charset[Math.floor(Math.random() * charset.length)]
      ).join("");
    }

    try {
      setIsSaving(true);
      await updateCustomer(selectedCustomer._id, { password: finalPassword });
      setSavedPassword(finalPassword);
      setShowModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };
const filteredCustomers = customers.filter((c) =>
  `${c.c_company ?? ""} ${c.c_name ?? ""} ${
    Array.isArray(c.c_email) ? c.c_email.join(" ") : c.c_email ?? ""
  }`
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);

const startIndex = (currentPage - 1) * itemsPerPage;
const paginated = filteredCustomers.slice(
  startIndex,
  startIndex + itemsPerPage
);
const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // ✅ Copy password helper
  const handleCopyPassword = async (id: string) => {
  try {
    if (!id) return;

    const resp = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/users/customer/${id}/decrypted`
    );

    // parse JSON (always)
    const data = await resp.json();

    // check HTTP-level success and presence of password
    if (!resp.ok || !data?.password) {
      // if backend returns an error message, show it, otherwise generic message
      const msg = data?.error || "Failed to fetch decrypted password.";
      alert(`❌ ${msg}`);
      return;
    }

    const decryptedPassword: string = data.password;
    // If backend returned bcrypt hash (or an explicit message), don't copy
    if (
      decryptedPassword === "[Bcrypt hash — cannot decrypt]" ||
      decryptedPassword.toLowerCase().includes("bcrypt")
    ) {
      alert("⚠️ This password is stored as a secure hash and cannot be copied.");
      return;
    }

    // Prefer backend-provided email if present; otherwise fall back to selectedCustomer
    const emailFromBackend: string | undefined = data.email;
    const email =
      emailFromBackend ||
      (Array.isArray(selectedCustomer?.c_email)
        ? selectedCustomer.c_email[0]
        : selectedCustomer?.c_email) ||
      "";

    const textToCopy = `User: ${email}\nPassword: ${decryptedPassword}`;

    // Use Clipboard API when available and secure context
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      // fallback for non-secure contexts (HTTP)
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      // avoid visible reflow
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } finally {
        textarea.remove();
      }
    }

    // show copied feedback for this id
    setCopied((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 1500);
  } catch (err) {
    console.error("Copy error:", err);
    alert("⚠️ Copy failed — please copy manually.");
  }
};


  return (
    <div>
      {/* Table */}
      {/* 🔍 Search Customer */}
<div className="flex justify-between items-center mb-4">
  <input
    type="text"
    placeholder="Search by company or customer name..."
    value={searchTerm}
    onChange={(e) => {
      setSearchTerm(e.target.value);
      onPageChange(1); // reset page when searching
    }}
    className="w-80 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
  />
</div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border w-[70px] text-center">SL No</th>
            <th className="p-2 border">Company</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Phone</th>
            <th className="p-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((c, index) => {
            const slNo = startIndex + index + 1;
            const emailArray: string[] = Array.isArray(c.c_email)
          ? (c.c_email[0] ? c.c_email[0].split(",") : [])
          : (c.c_email ? c.c_email.split(",") : []);

            const firstEmail = emailArray[0] || "";
            const remainingEmails = emailArray.slice(1);

            return (
             <tr
  key={c._id}
  className={`transition-all duration-500 ${
    highlightCustomerId === c._id
      ? "bg-blue-50 border-l-4 border-blue-500"
      : "hover:bg-gray-50"
  }`}
>


  {/* SL No */}
  <td className="border p-2 text-center">{slNo}</td>

  {/* Company */}
  <td className="border p-2 text-left">
    <Link
      to={`/customer/${c._id}/orders`}
      className="text-blue-600 hover:underline"
    >
      {c.c_company || "-"}
    </Link>
  </td>

  {/* Name */}
  <td className="border p-2 text-left">
    {c.c_name || "-"}
  </td>

  {/* Email */}
  <td className="border p-2 text-left group relative">
    {firstEmail}
    {remainingEmails.length > 0 && (
      <div className="absolute left-0 bottom-full mb-1 hidden group-hover:flex gap-2 bg-gray-100 p-2 rounded shadow z-50">
        {remainingEmails.map((email, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded bg-gray-200 text-xs"
          >
            {email.trim()}
          </span>
        ))}
      </div>
    )}
  </td>

  {/* Phone */}
  <td className="border p-2 text-center">
    {c.c_countryCode && c.c_mobilePhone
  ? `${c.c_countryCode} ${c.c_mobilePhone}`
  : c.c_mobilePhone || "-"}

  </td>

  {/* Actions */}
  <td className="border p-2 text-center">
    <div className="flex justify-center gap-3">
      <button onClick={() => onView(c)} className="text-blue-600 hover:text-blue-800">
        <FaEye />
      </button>
      <button onClick={() => onEdit(c)} className="text-green-600 hover:text-green-800">
        <FaEdit />
      </button>
      <button onClick={() => onAddPassword(c)} className="text-yellow-600 hover:text-yellow-800">
        <FaKey />
      </button>
    </div>
  </td>
</tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 bg-gray-50 py-3 rounded-md mt-4">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-1 rounded-md border ${
            currentPage === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          Prev
        </button>

        <span className="text-gray-700 text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-1 rounded-md border ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          Next
        </button>
      </div>

      {/* ✅ Reset Password Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] p-8 animate-fadeIn relative">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Reset password</h2>
            <p className="text-gray-600 mb-6 text-sm">
              {Array.isArray(selectedCustomer?.c_email)
                ? selectedCustomer.c_email[0] || "—"
                : selectedCustomer?.c_email || "—"}
            </p>

            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGenerate}
                  onChange={(e) => setAutoGenerate(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-blue-600"
                />
                <span className="text-gray-800 text-sm">Automatically create a password</span>
              </label>
            </div>

            {!autoGenerate && (
              <>
                <p className="text-gray-600 text-sm mb-2">
                  Passwords must be between <strong>8 and 256 characters</strong> and use a
                  combination of at least three of the following: uppercase letters, lowercase
                  letters, numbers, and symbols.
                </p>

                <div className="relative mb-4">
                  <label className="block text-sm text-gray-600 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[35px] text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>

                {newPassword && (
                  <p className="text-green-600 text-sm font-medium mb-4">Strong</p>
                )}

                <div className="flex items-start gap-3 mb-6">
                  <input
                    type="checkbox"
                    checked={requireChange}
                    onChange={(e) => setRequireChange(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-blue-600"
                  />
                  <span className="text-gray-800 text-sm">
                    Require this user to change their password when they first sign in
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePassword}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg font-medium text-white transition ${
                  isSaving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white w-[550px] p-6 rounded-xl shadow-xl animate-fadeIn">
            <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2">
              ✅ Password has been reset
            </h2>
            <p className="text-gray-600 mt-2 mb-4">
              You’ve successfully reset the password for this user.
            </p>

            <table className="w-full border-t border-b">
              <tbody>
                <tr>
                  <td className="py-2 text-gray-700 font-medium">User</td>
                  <td className="py-2 text-gray-800">
                    {Array.isArray(selectedCustomer?.c_email)
                      ? selectedCustomer.c_email[0]
                      : selectedCustomer?.c_email}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-700 font-medium">Password</td>
                  <td className="py-2 text-gray-800 flex items-center gap-2">
                    <span className="tracking-widest">
                      {showPassword ? savedPassword : "********"}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                    
               {/* ✅ Copy Icon */}
            {/* ✅ Copy Icon */}
<button
  onClick={() => handleCopyPassword(selectedCustomer?._id || "")}
  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
>
  <FaCopy size={16} />
  {copied[selectedCustomer?._id || ""] && (
    <span className="text-sm text-green-600">Copied!</span>
  )}
</button>

                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
