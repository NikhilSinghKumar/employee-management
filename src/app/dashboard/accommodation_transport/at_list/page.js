"use client";

import { useState, useEffect } from "react";
import { MdDelete } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";

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
      const response = await fetch(
        `/api/accommodation_transport?search=${encodeURIComponent(
          searchTerm
        )}&page=${currentPage}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${document.cookie.replace(
              /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
              "$1"
            )}`,
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
          )}`,
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
    <>
      {/* Custom CSS for fallback blur effect */}
      <style jsx>{`
        .watercolor-blur {
          background: linear-gradient(
            135deg,
            rgba(219, 234, 254, 0.3),
            rgba(147, 197, 253, 0.3)
          ); /* Gradient for watercolor effect */
          backdrop-filter: blur(6px); /* Slightly stronger blur */
          -webkit-backdrop-filter: blur(6px); /* For Safari */
        }
        @supports not (backdrop-filter: blur(6px)) {
          .watercolor-blur {
            background: linear-gradient(
              135deg,
              rgba(219, 234, 254, 0.5),
              rgba(147, 197, 253, 0.5)
            ); /* More opaque gradient fallback */
          }
        }
      `}</style>

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

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && (
          <p className="text-green-500 text-center mb-4">{success}</p>
        )}

        {isLoading ? (
          <div className="text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
            <p>Loading...</p>
          </div>
        ) : records.length === 0 ? (
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
                  <th className="px-4 py-2 border text-center">
                    Client Number
                  </th>
                  <th className="px-4 py-2 border text-center">Location</th>
                  <th className="px-4 py-2 border text-center">
                    Contract Type
                  </th>
                  <th className="px-4 py-2 border text-center">Checkin Date</th>
                  <th className="px-4 py-2 border text-center">
                    Checkout Date
                  </th>
                  <th className="px-4 py-2 border text-center">Status</th>
                  <th className="px-4 py-2 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.id} className="border">
                    <td className="px-4 py-2 border text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.checkin_id}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.checkin_name}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.iqama_number}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.nationality}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.passport_number}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.client_name}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.client_number}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.location}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.contract_type}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.checkin_date}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.checkout_date ? record.checkout_date : "N/A"}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {record.status}
                    </td>
                    <td className="px-4 py-2 border text-center space-x-2">
                      <button
                        className="text-blue-500 cursor-pointer hover:text-blue-700 hover:scale-110 transition-transform duration-200"
                        onClick={() => {
                          setEditRecord(record);
                          setIsEditing(true);
                        }}
                      >
                        <FaRegEdit />
                      </button>
                      <button
                        className="text-red-500 cursor-pointer hover:text-red-600 hover:scale-110 transition-transform duration-200"
                        onClick={() => handleDelete(record.id)}
                      >
                        <MdDelete />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {isEditing && editRecord && (
          <div
            className="fixed inset-0 bg-blue-100 bg-opacity-30 backdrop-blur-sm watercolor-blur flex justify-center items-center z-50"
            data-testid="modal-backdrop"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
              <h2 className="text-xl font-bold mb-4">Edit Record</h2>
              <form
                onSubmit={handleEditSubmit}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium">Id No.</label>
                  <input
                    type="text"
                    value={editRecord.checkin_id}
                    onChange={(e) =>
                      setEditRecord({
                        ...editRecord,
                        checkin_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input
                    type="text"
                    value={editRecord.checkin_name}
                    onChange={(e) =>
                      setEditRecord({
                        ...editRecord,
                        checkin_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
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
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
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
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Passport</label>
                  <input
                    type="text"
                    value={editRecord.passport_number}
                    onChange={(e) =>
                      setEditRecord({
                        ...editRecord,
                        passport_number: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
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
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
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
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Location</label>
                  <input
                    type="text"
                    value={editRecord.location}
                    onChange={(e) =>
                      setEditRecord({ ...editRecord, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
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
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="" disabled>
                      Select Contract Type
                    </option>
                    {contractTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">
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
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
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
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Status</label>
                  <select
                    value={editRecord.status}
                    onChange={(e) =>
                      setEditRecord({ ...editRecord, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="" disabled>
                      Select Status
                    </option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {records.length > 0 && !isLoading && totalCount > pageSize && (
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
    </>
  );
}
