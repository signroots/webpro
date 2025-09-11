import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/api/customers`) // Make sure this endpoint exists
      .then((res) => {
        setCustomers(res.data);
      })
      .catch((err) => console.error('❌ Error fetching customers:', err));
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer: any) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-4">👥 Customers</h2>

      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="text-white text-sm">Total Customers: {filteredCustomers.length}</div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name, email or company"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1 text-black rounded-md focus:outline-none"
          />

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 text-black rounded-md focus:outline-none"
          >
            {[10, 20, 50, 100].map((count) => (
              <option key={count} value={count}>
                Show {count}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="table-auto w-full border border-gray-700 text-sm shadow-md">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-2 border border-gray-700 text-left">SL No</th>
              <th className="px-4 py-2 border border-gray-700 text-left">Name</th>
              <th className="px-4 py-2 border border-gray-700 text-left">Email</th>
              <th className="px-4 py-2 border border-gray-700 text-left">Phone</th>
              <th className="px-4 py-2 border border-gray-700 text-left">Company</th>
              <th className="px-4 py-2 border border-gray-700 text-left">City</th>
              <th className="px-4 py-2 border border-gray-700 text-left">Country</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.map((c: any, index: number) => (
              <tr key={index} className="hover:bg-gray-800 transition-colors">
                <td className="px-4 py-2 border border-gray-700">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="px-4 py-2 border border-gray-700">{c.name || 'N/A'}</td>
                <td className="px-4 py-2 border border-gray-700">{c.email || 'N/A'}</td>
                <td className="px-4 py-2 border border-gray-700">{c.phone || 'N/A'}</td>
                <td className="px-4 py-2 border border-gray-700">{c.company || 'N/A'}</td>
                <td className="px-4 py-2 border border-gray-700">{c.city || 'N/A'}</td>
                <td className="px-4 py-2 border border-gray-700">{c.country || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
          disabled={currentPage === 1}
        >
          Prev
        </button>

        <span className="text-white px-3 py-1">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Customers;
