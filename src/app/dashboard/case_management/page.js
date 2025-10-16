"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Search } from "lucide-react";

export default function CaseListPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const router = useRouter();

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", currentPage);
      params.append("pageSize", pageSize);

      const res = await fetch(`/api/case_management/case_handler?${params}`);
      const data = await res.json();

      if (data?.data && Array.isArray(data.data)) {
        setCases(data.data);
        setTotalCount(data.totalCount || data.data.length);
      } else if (Array.isArray(data)) {
        setCases(data);
        setTotalCount(data.length);
      } else if (data) {
        setCases([data]);
        setTotalCount(1);
      } else {
        setCases([]);
        setTotalCount(0);
      }
    } catch (err) {
      toast.error("Failed to load cases");
      setCases([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, currentPage]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setCurrentPage(1);
      fetchCases();
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  return (
    <div className="max-w-7xl mx-auto p-2">
      <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        📂 Case Management
      </h1>

      {/* Filters + Search */}
      <div className="flex flex-wrap justify-center items-center gap-4 mb-8 w-full">
        {/* Filter Dropdown */}
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 text-gray-800
    bg-white shadow-sm md:shadow-md md:hover:shadow-lg 
    focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent
    transition-all duration-200 backdrop-blur-sm 
    w-[60%] sm:w-auto md:w-auto" // ✅ mobile smaller width
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        {/* Search Bar */}
        <div className="relative w-[85%] sm:w-72 md:w-96">
          {/* ✅ smaller width on mobile */}
          <Search
            className="absolute left-3 top-2.5 text-gray-400 pointer-events-none z-10"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full  shadow-sm md:shadow-md md:hover:shadow-lg pl-10 pr-4 py-2 rounded-lg bg-white/10 text-gray-800 placeholder-gray-400
      border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/60
      focus:border-transparent transition-all duration-200 backdrop-blur-sm
      hover:bg-white/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading indicator outside table */}
      {loading && (
        <div className="flex justify-center items-center my-10">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-base font-medium">Loading cases...</span>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto w-full transition-opacity duration-200">
          <table className="table-auto w-max border-collapse border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                {[
                  "S. No.",
                  "Name",
                  "Mobile",
                  "Email",
                  "PA / IQAMA No.",
                  "City",
                  "Client",
                  "Status",
                  "Created",
                  "Updated",
                  "Action",
                ].map((header) => (
                  <th key={header} className="p-2 border font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="text-center py-6 text-gray-500 border"
                  >
                    No cases found
                  </td>
                </tr>
              ) : (
                cases.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors"
                  >
                    <td className="p-2 border text-center">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="p-2 border">{c.cm_name}</td>
                    <td className="p-2 border">{c.cm_mobile_no}</td>
                    <td className="p-2 border">{c.cm_email}</td>
                    <td className="p-2 border">{c.cm_passport_iqama}</td>
                    <td className="p-2 border">{c.cm_city}</td>
                    <td className="p-2 border">{c.cm_client_name}</td>
                    <td className="p-2 border text-center">
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
                    <td className="p-2 border">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2 border">
                      {c.updated_at
                        ? new Date(c.updated_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-2 border text-center">
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
      )}

      {/* Pagination */}
      {!loading &&
        totalCount > 0 &&
        (() => {
          const totalPages = Math.ceil(totalCount / pageSize);
          const pages = [];

          if (totalPages > 0) pages.push(1);
          if (currentPage > 4) pages.push("...");

          for (
            let i = Math.max(2, currentPage - 1);
            i <= Math.min(totalPages - 1, currentPage + 1);
            i++
          ) {
            pages.push(i);
          }

          if (currentPage + 2 < totalPages) pages.push("...");
          if (totalPages > 1) pages.push(totalPages);

          return (
            <div className="flex justify-center items-center gap-1 mt-6 flex-wrap">
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
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-gray-500"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded cursor-pointer ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-blue-100"
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

      {/* Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Complaint Details</h2>
            <p className="text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto mb-6">
              {selectedCase.cm_complaint_description ||
                "No description provided"}
            </p>

            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium text-gray-700">Status:</label>
              <select
                className="border rounded-lg px-3 py-2 focus:ring focus:ring-blue-300"
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
                    if (!res.ok) throw new Error("Failed to update");
                    toast.success("Status updated successfully");
                    setSelectedCase(null);
                    fetchCases();
                  } catch (err) {
                    toast.error("Error updating status");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
              >
                Update
              </button>
            </div>

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
