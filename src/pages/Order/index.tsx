import React, { useEffect, useState, useMemo } from "react";
import {
  FaEye,
  FaEdit,
  FaEnvelope,
  FaServer,
  FaLock,
  FaLaptopCode,
  FaGlobe,
} from "react-icons/fa";
import { SiCloudflare } from "react-icons/si";
import Modal from "react-modal";
import { fetchdistinctDomain, updateDomainWithEmails } from "./api";

// Types
interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  city?: string;
  creationDate?: string;
  country?: string;
}

interface Email {
  _id?: string;
  username: string;
  subscription?: string;
  status?: string;
  domain?: string;
  expiryDate?: string;
  provider?: string;
  users?: string;
  creationDate?: string;
  password?: string;
  customer?: Customer | null;
}

interface DomainWithEmails {
  _id?: string;
  domainName: string;
  lockStatus?: string;
  reseller_outside_inside?: string;
  subResellerName?: string;
  subResellerEmail?: string;
  domainInfo?: {
    _id?: string;
    domainSource?: string[];
    google_email?: boolean;
    microsoft_email?: boolean;
    cloudflareRegistered?: boolean;
    expiryDate?: string;
    status?: string;
    lockStatus?: string;
    subResellerEmail?: string;
    subResellerName?: string;
    customer?: Customer | null;
  } | null;
  emails: Email[];
}

const Orders: React.FC = () => {
  const [domains, setDomains] = useState<DomainWithEmails[]>([]);
  const [allDomains, setAllDomains] = useState<DomainWithEmails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);

  // Filters
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [selectedDomain, setSelectedDomain] = useState<DomainWithEmails | null>(null);

  const openModal = (domain: DomainWithEmails, mode: "view" | "edit") => {
    setSelectedDomain({ ...domain });
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDomain(null);
  };

  // Load domains + emails
  useEffect(() => {
    const loadDomains = async () => {
      try {
        const data: DomainWithEmails[] = await fetchdistinctDomain();
        setDomains(data);
        setAllDomains(data);
      } catch (err) {
        console.error("Failed to fetch domains with emails", err);
      } finally {
        setLoading(false);
      }
    };
    loadDomains();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = allDomains;

    if (provider) {
      filtered = filtered.filter((d) =>
        d.emails.some((email) => email.provider === provider)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(
        (d) => d.domainInfo?.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setDomains(filtered);
    setCurrentPage(1);
  }, [provider, statusFilter, allDomains]);

  // Filter by search term
  const filteredDomains = useMemo(() => {
    return domains.filter((domain) =>
      domain.domainName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [domains, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredDomains.length / itemsPerPage);
  const paginatedDomains = useMemo(() => {
    if (provider) {
      return filteredDomains; // show all matching if provider selected
    }
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDomains.slice(start, start + itemsPerPage);
  }, [filteredDomains, currentPage, itemsPerPage, provider]);

  if (loading)
    return <p className="text-center text-gray-500 mt-6">Loading domains...</p>;

  return (
    <div className="min-h-screen w-full bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Search domain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded-lg text-black"
        />

        {/* Provider Buttons */}
        <button
          onClick={() => setProvider("Google Workspace")}
          className={`px-4 py-2 rounded-lg ${
            provider === "Google Workspace"
              ? "bg-blue-600 text-white"
              : "bg-gray-300 text-black"
          }`}
        >
          <img src="/download.png" className="w-4 h-4 inline mr-2" /> Google Workspace
        </button>

        <button
          onClick={() => setProvider("Microsoft 365")}
          className={`px-4 py-2 rounded-lg ${
            provider === "Microsoft 365"
              ? "bg-blue-600 text-white"
              : "bg-gray-300 text-black"
          }`}
        >
          <img src="/microsoft.png" className="w-4 h-4 inline mr-2" /> Microsoft 365
        </button>

        <button
          onClick={() => setProvider(undefined)}
          className="px-4 py-2 bg-gray-200 rounded-lg"
        >
          Reset Provider
        </button>

        {/* Status Filter */}
        <select
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || undefined)}
          className="border px-3 py-2 rounded-lg"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "SL No",
                "Domain Name",
                "Customer",
                "Services",
                "Expiry Date",
                "Domain Status",
                "Email Expiry Date",
                "Email Customer",
                "Email Status",
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
            {paginatedDomains.map((domain, index) => {
              const customer = domain.domainInfo?.customer;

              return (
                <tr
                  key={domain.domainInfo?._id || domain.domainName}
                  className="hover:bg-gray-50 text-black"
                >
                  {/* SL No */}
                  <td className="px-6 py-4">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>

                  {/* Domain Name + Lock */}
                  <td className="px-6 py-4 flex items-center gap-2">
                    {domain.domainInfo?.lockStatus === "Locked" ? (
                      <FaLock className="text-red-500" />
                    ) : (
                      <FaLock className="text-green-500" />
                    )}
                    {domain.domainName}
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4">
                    {customer ? (
                      <div>
                        <span className="font-semibold">{customer.name}</span>
                        {(domain.domainInfo?.subResellerEmail ||
                          domain.domainInfo?.subResellerName) && (
                          <div className="text-xs font-semibold text-green-600 mt-1">
                            {domain.domainInfo.subResellerEmail}
                            {domain.domainInfo.subResellerName &&
                              ` | ${domain.domainInfo.subResellerName}`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No customer</span>
                    )}
                  </td>

                  {/* Services */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {domain.domainInfo?.domainSource?.map((src, idx) => {
                        if (src.toLowerCase() === "resellerclub") {
                          return (
                            <img
                              key={idx}
                              src="/resellerclub-logo-2x.png"
                              alt="ResellerClub"
                              className="w-6 h-6 object-contain"
                            />
                          );
                        }
                        if (src.toLowerCase() === "cloudflare") {
                          return <SiCloudflare key={idx} className="w-6 h-6 text-orange-500" />;
                        }
                        return <FaGlobe key={idx} className="w-6 h-6 text-gray-400" />;
                      })}

                      {/* Email Provider Icons */}
                      {domain.domainInfo?.google_email ? (
                        <img src="/download.png" className="w-5 h-5" title="Google Workspace" />
                      ) : domain.domainInfo?.microsoft_email ? (
                        <img src="/microsoft.png" className="w-5 h-5" title="Microsoft 365" />
                      ) : (
                        <FaEnvelope className="w-5 h-5 text-gray-300" title="Email not enabled" />
                      )}

                      {/* Other icons */}
                      <FaServer className="w-5 h-5 text-purple-400" />
                      <FaLaptopCode className="w-5 h-5 text-pink-400" />
                    </div>
                  </td>

                  {/* Domain Expiry */}
                  <td className="px-6 py-4">
                    {domain.domainInfo?.expiryDate
                      ? new Date(domain.domainInfo.expiryDate).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })
                      : "N/A"}
                  </td>

                  {/* Domain Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        domain.domainInfo?.status?.toLowerCase() === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {domain.domainInfo?.status || "N/A"}
                    </span>
                  </td>

                  {/* Emails Expiry, Customer, Status */}
                  <td className="px-6 py-4">
                    {domain.emails.length > 0
                      ? domain.emails.map((email) =>
                          email.expiryDate
                            ? new Date(email.expiryDate).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                              })
                            : "N/A"
                        )
                      : "N/A"}
                  </td>

                  <td className="px-4 py-2">
                    {domain.emails.length > 0
                      ? domain.emails.map((email) =>
                          email.customer ? email.customer.name || "N/A" : "N/A"
                        )
                      : "N/A"}
                  </td>

                  <td className="px-4 py-2">
                    {domain.emails.length > 0
                      ? domain.emails.map((email) => (
                          <p
                            key={email._id}
                            className={`text-xs font-semibold ${
                              email.status?.toLowerCase() === "active"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {email.status || "N/A"}
                          </p>
                        ))
                      : "-"}
                  </td>

                  <td className="px-4 py-2">
                    {domain.domainInfo?.google_email
                      ? "Google Workspace"
                      : domain.domainInfo?.microsoft_email
                      ? "Microsoft 365"
                      : "Other"}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => openModal(domain, "view")}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => openModal(domain, "edit")}
                      className="text-green-600 hover:text-green-800"
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center gap-2">
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Email Modal"
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-auto mt-20 p-8 outline-none relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50"
      >
        {selectedDomain && selectedDomain.emails.length > 0 && (
          <div>
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
              <div className="grid grid-cols-2 gap-6 text-gray-700">
                <p>
                  <strong>Domain:</strong> {selectedDomain.domainName}
                </p>
                <p>
                  <strong>Username:</strong> {selectedDomain.emails[0]?.username}
                </p>
                <p>
                  <strong>Provider:</strong> {selectedDomain.emails[0]?.provider}
                </p>
                <p>
                  <strong>Status:</strong> {selectedDomain.emails[0]?.status}
                </p>
                <p>
                  <strong>Subscription:</strong> {selectedDomain.emails[0]?.subscription}
                </p>
                <p>
                  <strong>Expiry Date:</strong> {selectedDomain.emails[0]?.expiryDate}
                </p>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedDomain || selectedDomain.emails.length === 0) return;

                  try {
                    await updateDomainWithEmails(selectedDomain.domainName, {
                      domain: selectedDomain.emails[0]?.domain,
                      subscription: selectedDomain.emails[0]?.subscription,
                      username: selectedDomain.emails[0]?.username,
                      customer: selectedDomain.emails[0]?.customer,
                      users: selectedDomain.emails[0]?.users,
                      password: selectedDomain.emails[0]?.password,
                      status: selectedDomain.emails[0]?.status,
                      creationDate: selectedDomain.emails[0]?.creationDate,
                      expiryDate: selectedDomain.emails[0]?.expiryDate,
                      provider: selectedDomain.emails[0]?.provider,
                    });

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
                    value={selectedDomain.emails[0]?.domain || ""}
                    onChange={(e) =>
                      setSelectedDomain({
                        ...selectedDomain,
                        emails: [
                          {
                            ...selectedDomain.emails[0],
                            domain: e.target.value,
                          },
                        ],
                      })
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
                    value={selectedDomain.emails[0]?.subscription || ""}
                    onChange={(e) =>
                      setSelectedDomain({
                        ...selectedDomain,
                        emails: [
                          {
                            ...selectedDomain.emails[0],
                            subscription: e.target.value,
                          },
                        ],
                      })
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
                    value={selectedDomain.emails[0]?.username || ""}
                    onChange={(e) =>
                      setSelectedDomain({
                        ...selectedDomain,
                        emails: [
                          {
                            ...selectedDomain.emails[0],
                            username: e.target.value,
                          },
                        ],
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 
                      bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={selectedDomain.emails[0]?.status || ""}
                    onChange={(e) =>
                      setSelectedDomain({
                        ...selectedDomain,
                        emails: [
                          {
                            ...selectedDomain.emails[0],
                            status: e.target.value,
                          },
                        ],
                      })
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

export default Orders;
