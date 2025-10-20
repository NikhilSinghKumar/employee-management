"use client";

import { useState, useEffect } from "react";
import { MdDelete } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { Search } from "lucide-react";

export default function AccommodationTransportList() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const pageSize = 10;

  const totalPages = Math.ceil(totalCount / pageSize);

  // Dropdown options for contract_type and status
  const contractTypeOptions = [
    { value: "Accommodation", label: "Accommodation" },
    { value: "Transportation", label: "Transportation" },
    { value: "Both", label: "Both" },
  ];

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Pending", label: "Pending" },
  ];

  useEffect(() => {
    fetchRecords();
  }, [currentPage, searchTerm]);

  async function fetchRecords() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", currentPage);
      params.append("pageSize", pageSize);

      const response = await fetch(`/api/accommodation_transport?${params}`, {
        headers: {
          Authorization: `Bearer ${document.cookie.replace(
            /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
            "$1"
          )}`,
        },
      });

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
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this record?")) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      const response = await fetch(`/api/accommodation_transport?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${document.cookie.replace(
            /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
            "$1"
          )}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to delete record");
      } else {
        setSuccess("Record deleted successfully");
        await fetchRecords();
      }
    } catch (error) {
      setError("Network error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/accommodation_transport", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie.replace(
            /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
            "$1"
          )}`, // ✅ ADDED MISSING )
        },
        body: JSON.stringify({
          id: editRecord.id,
          checkin_id: editRecord.checkin_id,
          checkin_name: editRecord.checkin_name,
          iqama_number: editRecord.iqama_number,
          nationality: editRecord.nationality,
          passport_number: editRecord.passport_number,
          client_name: editRecord.client_name,
          client_number: editRecord.client_number,
          location: editRecord.location,
          contract_type: editRecord.contract_type,
          checkin_date: editRecord.checkin_date,
          checkout_date: editRecord.checkout_date,
          status: editRecord.status,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to update record");
      } else {
        setSuccess("Record updated successfully");
        setIsEditing(false);
        await fetchRecords();
      }
    } catch (error) {
      setError("Network error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
    <div className="max-w-7xl mx-auto p-2">
      <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        🏠 Accommodation & Transportation
      </h1>

      {/* Filters + Search */}
      <div className="flex flex-wrap justify-center items-center gap-4 mb-8 w-full">
        {/* Search Bar */}
        <div className="relative w-[85%] sm:w-72 md:w-96">
          <Search
            className="absolute left-3 top-2.5 text-gray-400 pointer-events-none z-10"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by Iqama, Client, Passport, Status, or Contract Type..."
            className="w-full shadow-sm md:shadow-md md:hover:shadow-lg pl-10 pr-4 py-2 rounded-lg bg-white/10 text-gray-800 placeholder-gray-400
            border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4A5A6A]/60
            focus:border-transparent transition-all duration-200 backdrop-blur-sm
            hover:bg-white/20"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {success && <p className="text-green-500 text-center mb-4">{success}</p>}

      {/* 🩶 Shimmer Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 my-10 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-4 border rounded-lg shadow bg-gray-100/60 backdrop-blur-sm"
            >
              <div className="h-4 w-1/3 bg-gray-300 rounded mb-3"></div>
              <div className="h-3 w-2/3 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 w-1/2 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 w-1/4 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* 📋 Table Section */}
      {!isLoading && (
        <div className="overflow-x-auto w-full fade-in">
          {records.length === 0 ? (
            <p className="text-center text-gray-600 py-6">
              {searchTerm
                ? `No results found for "${searchTerm}".`
                : "No accommodation/transportation records available."}
            </p>
          ) : (
            <table className="table-auto min-w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  {[
                    "S. No.",
                    "Id No.",
                    "Name",
                    "Iqama No.",
                    "Nationality",
                    "Passport",
                    "Client Name",
                    "Client No.",
                    "Location",
                    "Contract Type",
                    "Checkin Date",
                    "Checkout Date",
                    "Status",
                    "Actions",
                  ].map((header) => (
                    <th key={header} className="p-2 border font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr
                    key={record.id}
                    className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors"
                  >
                    <td className="p-2 border text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="p-2 border text-center">
                      {record.checkin_id}
                    </td>
                    <td className="p-2 border">{record.checkin_name}</td>
                    <td className="p-2 border">{record.iqama_number}</td>
                    <td className="p-2 border">{record.nationality}</td>
                    <td className="p-2 border">{record.passport_number}</td>
                    <td className="p-2 border">{record.client_name}</td>
                    <td className="p-2 border">{record.client_number}</td>
                    <td className="p-2 border">{record.location}</td>
                    <td className="p-2 border text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {record.contract_type}
                      </span>
                    </td>
                    <td className="p-2 border">{record.checkin_date}</td>
                    <td className="p-2 border">
                      {record.checkout_date ? record.checkout_date : "-"}
                    </td>
                    <td className="p-2 border text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : record.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="p-2 border text-center space-x-2">
                      <button
                        className="text-blue-500 text-base hover:text-blue-600 hover:scale-110 transition-transform duration-200 cursor-pointer"
                        onClick={() => {
                          setEditRecord(record);
                          setIsEditing(true);
                        }}
                      >
                        <FaRegEdit title="Edit" />
                      </button>
                      <button
                        className="text-red-500 text-base hover:text-red-600 hover:scale-110 transition-transform duration-200 cursor-pointer"
                        onClick={() => handleDelete(record.id)}
                      >
                        <MdDelete title="Delete" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 📄 Pagination */}
      {!isLoading &&
        totalCount > 0 &&
        (() => {
          const pages = getPaginationPages();
          return (
            <div className="flex justify-center items-center gap-1 mt-6 flex-wrap fade-in">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                }`}
              >
                Prev
              </button>
              {pages.map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${page}-${idx}`}
                    className="px-2 py-1 text-gray-500"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-indigo-200"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                }`}
              >
                Next
              </button>
            </div>
          );
        })()}

      {/* 🧾 Edit Modal */}
      {isEditing && editRecord && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              Edit Accommodation/Transportation Record
            </h2>
            <form
              onSubmit={handleEditSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Id No.
                </label>
                <input
                  type="text"
                  value={editRecord.checkin_id}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      checkin_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editRecord.checkin_name}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      checkin_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Iqama Number
                </label>
                <input
                  type="text"
                  value={editRecord.iqama_number}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      iqama_number: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  value={editRecord.nationality}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      nationality: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passport Number
                </label>
                <input
                  type="text"
                  value={editRecord.passport_number}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      passport_number: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={editRecord.client_name}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      client_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Number
                </label>
                <input
                  type="text"
                  value={editRecord.client_number}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      client_number: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editRecord.location}
                  onChange={(e) =>
                    setEditRecord({ ...editRecord, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Type
                </label>
                <select
                  value={editRecord.contract_type}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      contract_type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                  required
                >
                  {contractTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editRecord.status}
                  onChange={(e) =>
                    setEditRecord({ ...editRecord, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Checkin Date
                </label>
                <input
                  type="date"
                  value={editRecord.checkin_date}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      checkin_date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Checkout Date
                </label>
                <input
                  type="date"
                  value={editRecord.checkout_date || ""}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      checkout_date: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="md:col-span-2"></div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Update Record"}
                </button>
              </div>
            </form>

            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
