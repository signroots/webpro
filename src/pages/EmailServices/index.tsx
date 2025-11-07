import React, { useEffect, useState, useMemo } from "react";
import { fetchEmails,updateEmail  } from "./api";
import { FaEnvelope, FaEye, FaEdit } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../Common/Styles.css/datepicker.css";
import Modal from "react-modal";

interface Email {
  _id: string;
  domain: string;
  subscription: string;
  plan?: string;
  status: string;
  username: string;
  password?: string;
  users: number;
  creationDate?: string;
  expiryDate?: string;
  customer?: string;
  provider: string;
}

const Emails: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(50);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [allEmails, setAllEmails] = useState<Email[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const openModal = (email: Email, mode: "view" | "edit") => {
    setSelectedEmail(email);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmail(null);
  };

  // Load all emails initially
  useEffect(() => {
    const loadEmails = async () => {
      try {
        const data = await fetchEmails();
        setEmails(data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch emails");
      } finally {
        setLoading(false);
      }
    };
    loadEmails();
  }, []);

  // Load emails by provider
  useEffect(() => {
    const loadEmails = async () => {
      try {
        const data = await fetchEmails(provider);
        setAllEmails(data);
        setEmails(data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch emails");
      }
    };
    loadEmails();
  }, [provider]);

  // Filter by month
  const filterEmailsByMonth = (date: Date | null) => {
    setSelectedDate(date);
    if (!date) {
      setEmails(allEmails);
      return;
    }
    const selectedMonth = date.getMonth();
    const filtered = allEmails.filter((email) => {
      if (!email.expiryDate) return false;
      const expiry = new Date(email.expiryDate);
      return expiry.getMonth() === selectedMonth;
    });
    setEmails(filtered);
    setCurrentPage(1);
  };

  // Filter by search
  const filteredEmails = useMemo(() => {
    return emails.filter(
      (email) =>
        email.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.provider?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [emails, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);
  const paginatedEmails = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmails.slice(start, start + itemsPerPage);
  }, [filteredEmails, currentPage, itemsPerPage]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) return <p className="text-center text-gray-500 mt-6">Loading emails...</p>;
  if (error) return <p className="text-center text-red-500 mt-6">{error}</p>;

  return (
    <div className="min-h-screen w-full bg-gray-100 p-6">
      {/* Header */}
      <div className="bg-gray-200 shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-black">
            <FaEnvelope className="text-blue-600" /> Emails
          </h1>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Provider Buttons */}
            <button
              className="flex items-center gap-2 bg-gray-400 text-black px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              onClick={() => setProvider("Google Workspace")}
            >
              <img src="/download.png" alt="Google" className="w-5 h-5" /> Google Workspace
            </button>
            <button
              className="flex items-center gap-2 bg-gray-400 text-black px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              onClick={() => setProvider("Microsoft 365")}
            >
              <img src="/microsoft.png" alt="Microsoft" className="w-5 h-5" /> Microsoft 365
            </button>

            {/* Month Picker */}
<DatePicker
  selected={selectedDate}
  onChange={(date: Date | null) => filterEmailsByMonth(date)}
  dateFormat="MM"
  showMonthYearPicker
  placeholderText="Select Date"
/>


          </div>
        </div>

        {/* Total Domains */}
        <div className="px-6 py-3 flex justify-end">
          <span className="text-gray-700 font-medium">
            Total Domains: {emails.length}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "SL No",
                  "Domain",
                  "Subscription",
                  "Username",
                  "Customer",
                  "Users",
                  "Password",
                  "Status",
                  "Creation Date",
                  "Expiry Date",
                  "Provider",
                  "Actions",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedEmails.map((email, index) => (
                <tr key={email._id} className="hover:bg-gray-50 text-black transition-colors">
                  <td className="px-6 py-4">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-2 border">{email.domain}</td>
                  <td className="px-4 py-2 border">{email.subscription}</td>
                  <td className="px-4 py-2 border">{email.username}</td>
                  <td className="px-4 py-2 border">{email.customer || "-"}</td>
                  <td className="px-4 py-2 border">{email.users || "-"}</td>
                  <td className="px-4 py-2 border">{email.password || "-"}</td>
                  <td className="px-4 py-2 border">{email.status}</td>
                  <td className="px-4 py-2 border">
                    {email.creationDate ? formatDate(email.creationDate) : "-"}
                  </td>
                  <td
                    className={`px-4 py-2 border ${
                      email.expiryDate &&
                      (() => {
                        const expiry = new Date(email.expiryDate);
                        const today = new Date();
                        const diffDays = Math.ceil(
                          (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return diffDays > 0 && diffDays <= 20 ? "text-red-600 font-bold" : "";
                      })()
                    }`}
                  >
                    {email.expiryDate ? formatDate(email.expiryDate) : "-"}
                  </td>
                  <td className="px-4 py-2 border">{email.provider}</td>
                  {/* Actions */}
                  <td className="px-4 py-2 border flex gap-2">
                    <button
                      onClick={() => openModal(email, "view")}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => openModal(email, "edit")}
                      className="text-green-600 hover:text-green-800"
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-blue-600 font-semibold">
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      <Modal
  isOpen={isModalOpen}
  onRequestClose={closeModal}
  contentLabel="Email Modal"
  className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-auto mt-20 p-8 outline-none relative"
  overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50"
>
  {selectedEmail && (
    <div>
      {/* ❌ Close button */}
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
      >
        &times;
      </button>

      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {modalMode === "view" ? "Email Details" : "Edit Email"}
      </h2>

      {modalMode === "view" ? (
        // 👁️ VIEW MODE
        <div className="grid grid-cols-2 gap-6 text-gray-700">
          <p><strong>Domain:</strong> {selectedEmail.domain}</p>
          <p><strong>Subscription:</strong> {selectedEmail.subscription}</p>
          <p><strong>Username:</strong> {selectedEmail.username}</p>
          <p><strong>Customer:</strong> {selectedEmail.customer || "-"}</p>
          <p><strong>Users:</strong> {selectedEmail.users}</p>
          <p><strong>Password:</strong> {selectedEmail.password || "-"}</p>
          <p><strong>Status:</strong> {selectedEmail.status}</p>
          <p><strong>Provider:</strong> {selectedEmail.provider}</p>
          <p><strong>Creation Date:</strong> {selectedEmail.creationDate ? formatDate(selectedEmail.creationDate) : "-"}</p>
          <p><strong>Expiry Date:</strong> {selectedEmail.expiryDate ? formatDate(selectedEmail.expiryDate) : "-"}</p>
        </div>
      ) : (
        // ✏️ EDIT MODE
     <form
  onSubmit={async (e) => {
  e.preventDefault();
  if (!selectedEmail) return;

  try {
    const updated = await updateEmail(selectedEmail._id, {
      domain: selectedEmail.domain,
      subscription: selectedEmail.subscription,
      username: selectedEmail.username,
      customer: selectedEmail.customer,
      users: selectedEmail.users,
      password: selectedEmail.password,
      status: selectedEmail.status,
      creationDate: selectedEmail.creationDate,
      expiryDate: selectedEmail.expiryDate,
      provider: selectedEmail.provider,
    });

    // ✅ Update the local emails list so UI refreshes
    setEmails((prev) =>
      prev.map((e) => (e._id === updated._id ? updated : e))
    );

    closeModal();
  } catch (err) {
    console.error("Update failed", err);
    alert("Failed to update email. Please try again.");
  }
}}
  className="grid grid-cols-2 gap-6"
>
  {/* Domain */}
  <div>
    <label className="block text-sm font-medium mb-1">Domain</label>
    <input
      type="text"
      value={selectedEmail.domain}
      onChange={(e) =>
        setSelectedEmail({ ...selectedEmail, domain: e.target.value })
      }
      className="w-full border border-gray-300 rounded-lg px-3 py-2 
      bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    />
  </div>

  {/* Subscription */}
  <div>
    <label className="block text-sm font-medium mb-1">Subscription</label>
    <input
      type="text"
      value={selectedEmail.subscription}
      onChange={(e) =>
        setSelectedEmail({ ...selectedEmail, subscription: e.target.value })
      }
      className="w-full border border-gray-300 rounded-lg px-3 py-2 
      bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    />
  </div>

  {/* Username */}
  <div>
    <label className="block text-sm font-medium mb-1">Username</label>
    <input
      type="text"
      value={selectedEmail.username}
      onChange={(e) =>
        setSelectedEmail({ ...selectedEmail, username: e.target.value })
      }
      className="w-full border border-gray-300 rounded-lg px-3 py-2 
      bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    />
  </div>

  {/* Customer */}
  <div>
    <label className="block text-sm font-medium mb-1">Customer</label>
    <input
      type="text"
      value={selectedEmail.customer || ""}
      onChange={(e) =>
        setSelectedEmail({ ...selectedEmail, customer: e.target.value })
      }
      className="w-full border border-gray-300 rounded-lg px-3 py-2 
      bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    />
  </div>

  {/* Users */}
  <div>
    <label className="block text-sm font-medium mb-1">Users</label>
    <input
      type="number"
      value={selectedEmail.users}
      onChange={(e) =>
        setSelectedEmail({ ...selectedEmail, users: Number(e.target.value) })
      }
      className="w-full border border-gray-300 rounded-lg px-3 py-2 
      bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    />
  </div>

  {/* Password */}
  <div>
    <label className="block text-sm font-medium mb-1">Password</label>
    <input
      type="text"
      value={selectedEmail.password || ""}
      onChange={(e) =>
        setSelectedEmail({ ...selectedEmail, password: e.target.value })
      }
      className="w-full border border-gray-300 rounded-lg px-3 py-2 
      bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    />
  </div>

  {/* Status */}
  <div>
    <label className="block text-sm font-medium mb-1">Status</label>
    <select
      value={selectedEmail.status}
      onChange={(e) =>
        setSelectedEmail({ ...selectedEmail, status: e.target.value })
      }
      className="w-full border border-gray-300 rounded-lg px-3 py-2 
      bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    >
      <option value="ACTIVE">ACTIVE</option>
      <option value="INACTIVE">INACTIVE</option>
      <option value="SUSPENDED">SUSPENDED</option>
      <option value="CANCELLED">CANCELLED</option>
    </select>
  </div>

  {/* Creation Date */}
  <div>
    <label className="block text-sm font-medium mb-1">Creation Date</label>
    <input
      type="date"
      value={
        selectedEmail.creationDate
          ? new Date(selectedEmail.creationDate).toISOString().split("T")[0]
          : ""
      }
      onChange={(e) =>
        setSelectedEmail({ ...selectedEmail, creationDate: e.target.value })
      }
      className="w-full border border-gray-300 rounded-lg px-3 py-2 
      bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    />
  </div>

  {/* Expiry Date */}
  <div>
    <label className="block text-sm font-medium mb-1">Expiry Date</label>
    <input
      type="date"
      value={
        selectedEmail.expiryDate
          ? new Date(selectedEmail.expiryDate).toISOString().split("T")[0]
          : ""
      }
      onChange={(e) =>
        setSelectedEmail({ ...selectedEmail, expiryDate: e.target.value })
      }
      className="w-full border border-gray-300 rounded-lg px-3 py-2 
      bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    />
  </div>

  {/* Provider */}
  <div className="col-span-2">
    <label className="block text-sm font-medium mb-1">Provider</label>
    <input
      type="text"
      value={selectedEmail.provider}
      onChange={(e) =>
        setSelectedEmail({ ...selectedEmail, provider: e.target.value })
      }
      className="w-full border border-gray-300 rounded-lg px-3 py-2 
      bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    />
  </div>

  {/* Footer Buttons */}
  <div className="col-span-2 flex justify-end gap-4 mt-6">
    <button
      type="button"
      onClick={closeModal}
      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
    >
      Cancel
    </button>
    <button
      type="submit"
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Save
    </button>
  </div>
</form>


      )}
    </div>
  )}
</Modal>

    </div>
  );
};

export default Emails;
