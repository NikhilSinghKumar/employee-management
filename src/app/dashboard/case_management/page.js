"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function CaseListPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState(null); // for modal

  const router = useRouter();

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(
        `/api/case_management/case_handler?${params.toString()}`
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        setCases(data);
      } else if (data && Array.isArray(data.data)) {
        setCases(data.data);
      } else if (data) {
        setCases([data]);
      } else {
        setCases([]);
      }
    } catch (err) {
      toast.error("Failed to load cases");
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCases();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="p-6 mt-16 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        📂 Case Management
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-6 items-center">
        <select
          className="border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <input
          type="text"
          placeholder="🔍 Search by name, email, city, or token"
          className="border rounded-lg px-3 py-2 w-72 shadow-sm focus:ring focus:ring-blue-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-md border">
        <table className="w-full text-sm border border-gray-300 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-center text-gray-700">
              <th className="px-4 py-3 border border-gray-300">S. No.</th>
              <th className="px-4 py-3 border border-gray-300">Name</th>
              <th className="px-4 py-3 border border-gray-300">Mobile</th>
              <th className="px-4 py-3 border border-gray-300">Email</th>
              <th className="px-4 py-3 border border-gray-300">City</th>
              <th className="px-4 py-3 border border-gray-300">Client</th>
              <th className="px-4 py-3 border border-gray-300">Status</th>
              <th className="px-4 py-3 border border-gray-300">Created</th>
              <th className="px-4 py-3 border border-gray-300">Updated</th>
              <th className="px-4 py-3 border border-gray-300">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading">
                <td
                  colSpan="10"
                  className="animate-pulse text-center py-6 text-gray-500 border border-gray-300"
                >
                  Loading cases...
                </td>
              </tr>
            ) : cases.length === 0 ? (
              <tr key="empty">
                <td
                  colSpan="10"
                  className="text-center py-6 text-gray-500 border border-gray-300"
                >
                  No cases found
                </td>
              </tr>
            ) : (
              cases.map((c, idx) => (
                <tr
                  key={c.id}
                  className={`hover:bg-blue-50 transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3 text-center border border-gray-300">
                    {idx + 1}.
                  </td>
                  <td className="px-4 py-3 border border-gray-300">
                    {c.cm_name}
                  </td>
                  <td className="px-4 py-3 border border-gray-300">
                    {c.cm_mobile_no}
                  </td>
                  <td className="px-4 py-3 border border-gray-300">
                    {c.cm_email}
                  </td>
                  <td className="px-4 py-3 border border-gray-300">
                    {c.cm_city}
                  </td>
                  <td className="px-4 py-3 border border-gray-300">
                    {c.cm_client_name}
                  </td>
                  <td className="px-4 py-3 border border-gray-300">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.cm_status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : c.cm_status === "in-progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.cm_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 border border-gray-300">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 border border-gray-300">
                    {c.updated_at
                      ? new Date(c.updated_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 border border-gray-300 text-center">
                    <button
                      onClick={() => setSelectedCase(c)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-700 transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-gray-200/40 backdrop-blur-md flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 relative">
            <h2 className="text-xl font-semibold mb-4">
              Complaint Details (Token: {selectedCase.id})
            </h2>

            {/* Complaint description */}
            <p className="text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto mb-6">
              {selectedCase.cm_complaint_description ||
                "No description provided"}
            </p>

            {/* Status update section */}
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium text-gray-700">Status:</label>
              <select
                className="border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
                value={selectedCase.cm_status}
                onChange={(e) =>
                  setSelectedCase({
                    ...selectedCase,
                    cm_status: e.target.value,
                  })
                }
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/case_management/case_handler`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: selectedCase.id,
                          cm_status: selectedCase.cm_status,
                        }),
                      }
                    );

                    if (!res.ok) throw new Error("Failed to update status");

                    toast.success("Status updated successfully");
                    setSelectedCase(null);
                    fetchCases(); // refresh table
                  } catch (err) {
                    toast.error("Error updating status");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
              >
                Update
              </button>
            </div>

            {/* Close button (X) */}
            <button
              onClick={() => setSelectedCase(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
