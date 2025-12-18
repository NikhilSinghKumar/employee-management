"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-hot-toast";
import FinanceTimesheetActions from "@/component/FinanceTimesheetActions";
import RevisionModal from "@/component/RevisionModal";

const STATUS_STYLES = {
  draft: "bg-gray-200 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  revision_required: "bg-orange-100 text-orange-700",
};

export default function TimesheetPage() {
  const [pageLoading, setPageLoading] = useState(true); // table skeleton
  const [submittingId, setSubmittingId] = useState(null);
  const [timesheetSummary, setTimesheetSummary] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);

  const openRevisionModal = (entry) => {
    setSelectedEntry(entry);
    setRevisionReason("");
    setRevisionModalOpen(true);
  };

  // Month/Year based on 15-day window rule
  const today = new Date();
  const dayOfMonth = today.getDate();

  // If today <= 15 → show previous month
  const displayDate = new Date(today);

  if (dayOfMonth <= 15) {
    displayDate.setMonth(displayDate.getMonth() - 1);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  // Fetch paginated timesheet summary
  useEffect(() => {
    document.title = "All Client Timesheet";
    fetchTimesheetSummary(currentPage);
  }, [currentPage]);

  async function fetchTimesheetSummary(page = currentPage) {
    setPageLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("generated_timesheet_summary")
        .select("*", { count: "exact" })
        .in("status", ["pending", "approved", "revision_required"])
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(error.message || "Failed to fetch timesheet summary");
      }
      setTimesheetSummary(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      toast.error(err.message || "Failed to fetch timesheet summary");
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }

  const formatMonthYear = (dateString) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleString("default", { month: "long" }),
      year: date.getFullYear(),
    };
  };

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

  const handleApprove = async (entry) => {
    setSubmittingId(entry.uid);
    try {
      const res = await fetch("/api/finance_timesheet/approve_timesheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clientNumber: entry.client_number,
          month: entry.timesheet_month.slice(5, 7),
          year: entry.timesheet_month.slice(0, 4),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success("Timesheet approved");
      fetchTimesheetSummary(currentPage);
    } catch (err) {
      toast.error(err.message || "Approval failed");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRevision = (entry) => {
    setSelectedEntry(entry);
    setRevisionReason("");
    setRevisionModalOpen(true);
  };

  const closeRevisionModal = () => {
    setRevisionModalOpen(false);
    setRevisionReason("");
    setSelectedEntry(null);
  };

  const submitRevision = async () => {
    if (submittingId) return;
    if (!revisionReason.trim()) {
      toast.error("Revision reason is required");
      return;
    }

    setSubmittingId(selectedEntry.uid);

    try {
      const res = await fetch("/api/finance_timesheet/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clientNumber: selectedEntry.client_number,
          month: selectedEntry.timesheet_month.slice(5, 7),
          year: selectedEntry.timesheet_month.slice(0, 4),
          revisionReason: revisionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Sent back for revision");
      setRevisionModalOpen(false);
      fetchTimesheetSummary(currentPage);
    } catch (err) {
      toast.error(err.message || "Revision failed");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Finance Timesheets
          </h1>
          <p className="text-sm text-gray-500">
            Monthly timesheet to generate invoice
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <div className="mx-auto mt-4 max-w-7xl">
            {pageLoading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-11 gap-4">
                    {[...Array(11)].map((__, j) => (
                      <div
                        key={j}
                        className="h-6 bg-gray-100 rounded animate-pulse"
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : timesheetSummary.length === 0 ? (
              <p className="text-center text-gray-500 text-lg py-10">
                No timesheet data available.
              </p>
            ) : (
              <table className="table-auto w-max border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                  <tr className="border border-gray-300">
                    <th className="px-4 py-3 border">S.No</th>
                    <th className="px-4 py-3 border">Client Number</th>
                    <th className="px-4 py-3 border">Client Name</th>
                    <th className="px-4 py-3 border">Month</th>
                    <th className="px-4 py-3 border">Year</th>
                    <th className="px-4 py-3 border">Total Employees</th>
                    <th className="px-4 py-3 border">Net Salary</th>
                    <th className="px-4 py-3 border">Net Adjusted Salary</th>
                    <th className="px-4 py-3 border">Grand Total</th>
                    <th className="px-4 py-3 border">Status</th>
                    <th className="px-4 py-3 border">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {timesheetSummary.map((entry, index) => {
                    const date = new Date(entry.timesheet_month);
                    const monthLabel = date.toLocaleString("default", {
                      month: "long",
                    });
                    const yearLabel = date.getFullYear();
                    const monthNum = entry.timesheet_month.slice(5, 7);
                    const yearStr = entry.timesheet_month.slice(0, 4);
                    return (
                      <tr key={entry.uid} className="border border-gray-300">
                        <td className="px-4 py-2 border text-center">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-4 py-2 border">
                          {entry.client_number}
                        </td>
                        <td className="px-4 py-2 border">
                          {entry.client_name}
                        </td>
                        <td className="px-4 py-2 border">{monthLabel}</td>
                        <td className="px-4 py-2 border">{yearLabel}</td>
                        <td className="px-4 py-2 border text-center">
                          {entry.employee_count}
                        </td>
                        <td className="px-4 py-2 border">
                          {entry.total_salary_sum.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 border">
                          {entry.adjusted_salary_sum.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 font-semibold border">
                          {entry.grand_total.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 border text-center capitalize">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              STATUS_STYLES[entry.status]
                            }`}
                          >
                            {entry.status.replace("_", " ")}
                          </span>
                        </td>

                        <td className="px-4 py-2 border text-center">
                          <FinanceTimesheetActions
                            submitting={submittingId === entry.uid}
                            clientNumber={entry.client_number}
                            year={yearStr}
                            month={monthNum}
                            status={entry.status}
                            onApprove={() => handleApprove(entry)}
                            onRevision={() => handleRevision(entry)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalCount > pageSize && !pageLoading && (
          <div className="flex justify-center mt-4 space-x-2">
            <button
              className={`px-4 py-2 border rounded ${
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
                <span key={idx} className="px-4 py-2 text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  key={idx}
                  className={`px-4 py-2 border rounded ${
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
              className={`px-4 py-2 border rounded ${
                currentPage === totalPages || totalPages === 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        )}
      </div>
      <RevisionModal
        open={revisionModalOpen}
        onClose={closeRevisionModal}
        reason={revisionReason}
        setReason={setRevisionReason}
        submitting={submittingId === selectedEntry?.uid}
        onSubmit={submitRevision}
      />
    </>
  );
}
