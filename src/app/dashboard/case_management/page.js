"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Search } from "lucide-react";
import CaseManagementActions from "@/component/CaseManagementActions";
import ConfirmDeleteDialog from "@/component/case_management_action_modals/ConfirmDeleteDialog";
import ViewCaseModal from "@/component/case_management_action_modals/ViewCaseModal";
import StatusModal from "@/component/case_management_action_modals/StatusModal";
import AssignModal from "@/component/case_management_action_modals/AssignModal";
import StatusBadge from "@/components/StatusBadge";

export default function CaseListPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const handleCaseAction = async (action, caseItem) => {
    if (action === "view") {
      setSelectedCase({ ...caseItem, mode: "view" });

      return;
    }

    if (action === "status") {
      setSelectedCase({
        ...caseItem,
        mode: "status",
      });
      return;
    }

    if (action === "assign") {
      // Open assign modal (we'll make it next)
      setSelectedCase({
        ...caseItem,
        mode: "assign",
      });
      return;
    }

    if (action === "delete") {
      setSelectedCase(caseItem);
      setIsDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/case_management/case_handler`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCase.id }),
      });

      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Case deleted successfully");
      fetchCases();
    } catch (err) {
      toast.error("Error deleting case");
    } finally {
      setIsDialogOpen(false);
    }
  };

  return (
    <>
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
          focus:outline-none focus:ring-2 focus:ring-[#4A5A6A]/60 focus:border-transparent
          transition-all duration-200 backdrop-blur-sm 
          w-[60%] sm:w-auto md:w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Search Bar */}
          <div className="relative w-[85%] sm:w-72 md:w-96">
            <Search
              className="absolute left-3 top-2.5 text-gray-400 pointer-events-none z-10"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-full shadow-sm md:shadow-md md:hover:shadow-lg pl-10 pr-4 py-2 rounded-lg bg-white/10 text-gray-800 placeholder-gray-400
            border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4A5A6A]/60
            focus:border-transparent transition-all duration-200 backdrop-blur-sm
            hover:bg-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 🩶 Shimmer Loading Skeleton */}
        {loading && (
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
        {!loading && (
          <div className="overflow-x-auto w-full fade-in">
            {cases.length === 0 ? (
              <p className="text-center text-gray-600 py-6">
                {searchTerm
                  ? `No results found for “${searchTerm}”.`
                  : "No cases available at the moment."}
              </p>
            ) : (
              <table className="table-auto min-w-full border-collapse border border-gray-200 text-sm">
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
                      "Remarks",
                      "Action",
                    ].map((header) => (
                      <th key={header} className="p-2 border font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c, idx) => (
                    <tr
                      key={c.id || `${idx}-${c.cm_name}`}
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
                        <StatusBadge status={c.cm_status} />
                      </td>
                      <td className="p-2 border">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      {/* <td className="p-2 border">
                        {c.updated_at
                          ? new Date(c.updated_at).toLocaleDateString()
                          : "-"}
                      </td> */}
                      <td className="p-2 border">{c.remarks}</td>
                      <td className="p-2 border text-center">
                        <CaseManagementActions
                          enquiry={c}
                          onAction={handleCaseAction}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 📄 Pagination */}
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
              <div className="flex justify-center items-center gap-1 mt-6 flex-wrap fade-in">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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
      </div>
      <ViewCaseModal
        isOpen={selectedCase?.mode === "view"}
        onClose={() => setSelectedCase(null)}
        caseData={selectedCase}
      />
      <StatusModal
        isOpen={selectedCase?.mode === "status"}
        onClose={() => setSelectedCase(null)}
        caseData={selectedCase}
        onStatusUpdated={fetchCases}
      />

      <AssignModal
        isOpen={selectedCase?.mode === "assign"}
        onClose={() => setSelectedCase(null)}
        caseData={selectedCase}
      />

      <ConfirmDeleteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        caseName={selectedCase?.cm_name}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
