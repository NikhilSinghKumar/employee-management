"use client";

import { useState, useEffect } from "react";

export default function AccommodationTransportList() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const pageSize = 10;

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    fetchRecords();
  }, [currentPage, searchTerm]);

  async function fetchRecords() {
    try {
      const response = await fetch(
        `/api/accomodation_transport?search=${encodeURIComponent(searchTerm)}&page=${currentPage}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`,
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to fetch records");
        setRecords([]);
        setTotalCount(0);
      } else {
        setError(null);
        setRecords(result.data || []);
        setTotalCount(result.totalCount || 0);
      }
    } catch (error) {
      setError("Network error: " + error.message);
      setRecords([]);
      setTotalCount(0);
    }
  }

  const getPaginationPages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="w-full px-6 mt-16">
      <h1 className="text-2xl font-bold text-center mt-24 mb-6">
        Accommodation & Transportation List
      </h1>

      <div className="mb-4 flex justify-center items-center gap-4">
        <input
          type="text"
          placeholder="Search by Iqama, Client, Passport, Status, or Contract Type"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md w-full sm:w-96"
        />
      </div>

      {error && (
        <p className="text-red-500 text-center mb-4">{error}</p>
      )}

      {records.length === 0 ? (
        <p className="text-center text-gray-500">No records found.</p>
      ) : (
<div className="w-full overflow-x-auto">
  <table className="table-auto w-full border border-gray-300 text-sm">
    <thead className="bg-gray-100 text-gray-700">
      <tr>
        <th className="px-4 py-2 border text-center">S.No</th>
        <th className="px-4 py-2 border text-center">Id No.</th>
        <th className="px-4 py-2 border text-center">Name</th>
        <th className="px-4 py-2 border text-center">Iqama Number</th>
        <th className="px-4 py-2 border text-center">Nationality</th>
        <th className="px-4 py-2 border text-center">Passport</th>
        <th className="px-4 py-2 border text-center">Client Name</th>
        <th className="px-4 py-2 border text-center">Client Number</th>
        <th className="px-4 py-2 border text-center">Location</th>
        <th className="px-4 py-2 border text-center">Contract Type</th>
        <th className="px-4 py-2 border text-center">Checkin Date</th>
        <th className="px-4 py-2 border text-center">Checkout Date</th>
        <th className="px-4 py-2 border text-center">Status</th>
        <th className="px-4 py-2 border text-center">Actions</th>
      </tr>
    </thead>
    <tbody>
      {records.map((record, index) => (
        <tr key={record.id} className="border">
          <td className="px-4 py-2 border text-center">{(currentPage - 1) * pageSize + index + 1}</td>
          <td className="px-4 py-2 border text-center">{record.checkin_id}</td>
          <td className="px-4 py-2 border text-center">{record.checkin_name}</td>
          <td className="px-4 py-2 border text-center">{record.iqama_number}</td>
          <td className="px-4 py-2 border text-center">{record.nationality}</td>
          <td className="px-4 py-2 border text-center">{record.passport_number}</td>
          <td className="px-4 py-2 border text-center">{record.client_name}</td>
          <td className="px-4 py-2 border text-center">{record.client_number}</td>
          <td className="px-4 py-2 border text-center">{record.location}</td>
          <td className="px-4 py-2 border text-center">{record.contract_type}</td>
          <td className="px-4 py-2 border text-center">{record.checkin_date}</td>
          <td className="px-4 py-2 border text-center">{record.checkout_date}</td>
          <td className="px-4 py-2 border text-center">{record.status}</td>
          <td className="px-4 py-2 border text-center space-x-2">
            <button className="text-blue-600 hover:underline text-xs">Edit</button>
            <button className="text-red-600 hover:underline text-xs">Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      )}

      {/* Pagination */}
      {records.length > 0 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button
            className={`px-3 py-1 border rounded ${
              currentPage === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {getPaginationPages().map((page, idx) =>
            page === "..." ? (
              <span key={idx} className="px-3 py-1 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={idx}
                className={`px-3 py-1 border rounded ${
                  currentPage === page
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            )
          )}

          <button
            className={`px-3 py-1 border rounded ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}