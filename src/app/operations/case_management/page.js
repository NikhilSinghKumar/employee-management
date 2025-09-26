"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function CaseListPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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

  // Initial load and status filter changes trigger immediate fetch
  useEffect(() => {
    fetchCases();
  }, [statusFilter]);

  // Search term changes are debounced
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCases();
    }, 500); // Adjust delay as needed (500ms is a common debounce time)

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
              <th className="px-4 py-3 border border-gray-300">Token</th>
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
                  className="text-center py-6 text-gray-500 border border-gray-300"
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
                  key={c.id} // ✅ already good here
                  className={`hover:bg-blue-50 transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3 border border-gray-300">{c.id}</td>
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
                  <td className="px-4 py-3 border border-gray-300">
                    <button
                      onClick={() => router.push(`/case_management/${c.id}`)}
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
    </div>
  );
}
