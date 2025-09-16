import React, { useEffect, useState, useMemo } from 'react';
import { fetchDomains } from './api';
import {
  FaGlobe,
  FaEnvelope,
  FaServer,
  FaLock,
  FaLaptopCode,
  FaUnlock
} from "react-icons/fa";
import { SiCloudflare } from "react-icons/si";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../Common/Styles.css/datepicker.css"; // your overrides

const Domains = () => {
  const [domains, setDomains] = useState<any[]>([]);
  const [allDomains, setAllDomains] = useState<any[]>([]); // keep original
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const getDomains = () => {
      fetchDomains()
        .then((res) => {
          setDomains(res);
          setAllDomains(res);
        })
        .catch((err) => console.error(err));
    };
    getDomains();
    const interval = setInterval(getDomains, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter domains by search term
    const filteredDomains = useMemo(() => {
    return (domains || []).filter((domain) =>
      domain.domainName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(domain.domainSource)
        ? domain.domainSource.join(", ").toLowerCase()
        : ""
      ).includes(searchTerm.toLowerCase()) ||
      domain.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [domains, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredDomains.length / itemsPerPage);
  const paginatedDomains = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDomains.slice(start, start + itemsPerPage);
  }, [filteredDomains, currentPage, itemsPerPage]);

  // Format dd/mm/yyyy
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Expiring Domains filter (current & previous month)
  const filterExpiringDomains = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevMonthYear = prevMonthDate.getFullYear();

    const filtered = allDomains.filter((domain: any) => {
      if (!domain.expiryDate) return false;
      const expiry = new Date(domain.expiryDate);
      const month = expiry.getMonth();
      const year = expiry.getFullYear();
      return (
        (month === currentMonth && year === currentYear) ||
        (month === prevMonth && year === prevMonthYear)
      );
    });

    setDomains(filtered);
    setCurrentPage(1);
  };

  // Filter by month/year picker
  const filterByMonth = (date: Date | null) => {
    setSelectedDate(date);
    if (!date) {
      setDomains(allDomains);
      return;
    }
 
    const selectedMonth = date.getMonth();
    const selectedYear = date.getFullYear();

    const filtered = allDomains.filter((domain: any) => {
      if (!domain.expiryDate) return false;
      const expiry = new Date(domain.expiryDate);
      return expiry.getMonth() === selectedMonth && expiry.getFullYear() === selectedYear;
    });

    setDomains(filtered);
    setCurrentPage(1);
  };
   const isExpiringSoon = (dateString: string) => {
    if (!dateString) return false;
    const expiry = new Date(dateString);
    const now = new Date();
    const diffInMs = expiry.getTime() - now.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return diffInDays <= 20 && diffInDays >= 0;
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 p-6">
      {/* Card container */}
      <div className="bg-gray-200 shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left group: Title + Button */}
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Domains</h2>
           
          </div>

          {/* Right: Month picker + Total domains */}
          <div className="flex items-center gap-3">
            <DatePicker
              selected={selectedDate}
              onChange={filterByMonth}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              placeholderText="Select Date"
            />
            <span className="text-gray-600 text-sm font-medium">
              Total Domains: {filteredDomains.length}
            </span>
          </div>
        </div>

        {/* Search & Items per page */}
        <div className="px-6 py-4 flex flex-col md:flex-row md:justify-between gap-6">
          <input
            type="text"
            placeholder="Search domain or source..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-200 text-gray-100"
          />

          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring focus:ring-blue-200 text-gray-200"
          >
            {[50, 100, 300, 500, 1000].map((count) => (
              <option key={count} value={count}>Show {count}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="px-7 py-4">
                {["SL No", "Domain", "Customer", "Services", "Managed By", "Source", "Expiry", "Status"].map((col) => (
                  <th
                    key={col}
                    className="px-7 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y text-black">
              {paginatedDomains.map((domain: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                
                 <td className="px-6 py-4 flex items-center gap-2">
        {domain.lockStatus === "Locked" ? (
          <FaLock className="text-red-500" />
        ) : (
          <FaUnlock className="text-green-500" />
        )}
        {domain.domainName}
      </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">{domain.customer?.name || 'N/A'}</span>
                    {domain.reseller_outside_inside === 'SubReseller' && (
                      <div className="text-sm text-green-600 mt-1">
                        <div className="font-semibold">{domain.subResellerName || '-'}</div>
                        <div className="font-semibold">{domain.subResellerEmail || '-'}</div>
                      </div>
                    )}
                  </td>
                 <td className="px-6 py-4 text-center">
  <div className="flex items-center justify-center gap-2">
    {/* Domain Source Icons */}
    {Array.isArray(domain.domainSource) &&
      domain.domainSource.map((src: string, idx: number) => {
        if (src.toLowerCase() === "resellerclub")
          return (
            <img
              key={idx}
              src="/resellerclub-logo-2x.png"
              alt="ResellerClub"
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
          );
        if (src.toLowerCase() === "cloudflare")
          return (
            <SiCloudflare
              key={idx}
              className="w-6 h-6 text-orange-500"
            />
          );
        return <FaGlobe key={idx} className="w-6 h-6 text-gray-400" />;
      })}

   {/* Conditional Email Icon */}
{domain.google_email ? (
  <img
    src="/download.png"
    alt="Google Workspace"
    width={20}
    height={20}
    className="w-5 h-5"
    title="Google Workspace enabled"
  />
) : domain.microsoft_email ? (
  <img
    src="/microsoft.png"
    alt="Microsoft"
    width={20}
    height={20}
    className="w-5 h-5"
    title="Microsoft email enabled"
  />
) : (
  <FaEnvelope
    className="w-5 h-5 text-gray-300"
    title="Email service not enabled"
  />
)}

    {/* Other static icons */}
    <FaServer className="w-5 h-5 text-purple-400" />
    <FaLock className="w-5 h-5 text-green-400" />
    <FaLaptopCode className="w-5 h-5 text-pink-400" />

    {/* Status indicator */}
    {domain.domainSource?.includes("Cloudflare") ? (
      domain.cloudflareRegistered ? (
        <span className="text-green-500 text-lg">🟢</span>
      ) : (
        <span className="text-blue-500 text-lg">🔵</span>
      )
    ) : domain.domainSource ? (
      <span className="text-yellow-500 text-lg">🟡</span>
    ) : (
      <span className="text-gray-400 text-lg">⚪</span>
    )}
  </div>
</td>
                  <td className="px-6 py-4">{domain.managedBy || 'N/A'}</td>
                  <td className="px-6 py-4">{domain.domainSource?.join(', ') || 'N/A'}</td>
                  <td
                    className={`px-6 py-4 ${
                      domain.expiryDate && isExpiringSoon(domain.expiryDate)
                        ? "text-red-600 font-semibold"
                        : "text-gray-800"
                    }`}
                  >
                    {domain.expiryDate ? formatDate(domain.expiryDate) : "N/A"}
                  </td>
                  {/* <td className="px-6 py-4">{domain.lockStatus || 'N/A'}</td> */}
                  {/* <td className="px-6 py-4 text-center">
                    {domain.domainSource?.includes("Cloudflare") ? (
                      domain.cloudflareRegistered ? "🟢" : "🔵"
                    ) : domain.domainSource ? "🟡" : "⚪"}
                  </td> */}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${domain.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {domain.status || 'N/A'}
                    </span>
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
    </div>
  );
};

export default Domains;
