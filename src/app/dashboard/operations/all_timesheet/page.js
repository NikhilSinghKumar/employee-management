"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import TimesheetActions from "@/component/AllTimesheetActions";

export default function TimesheetPage() {
  const [clientNumber, setClientNumber] = useState("");
  const [clientNumbers, setClientNumbers] = useState([]);
  const [pageLoading, setPageLoading] = useState(true); // table skeleton
  const [actionLoading, setActionLoading] = useState(false); // generate button
  const [timesheetSummary, setTimesheetSummary] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const pageSize = 10;
  const router = useRouter();

  // Month/Year based on 15-day window rule
  const today = new Date();
  const dayOfMonth = today.getDate();

  // If today <= 15 → show previous month
  let displayDate = new Date(today);

  if (dayOfMonth <= 15) {
    displayDate.setMonth(displayDate.getMonth() - 1);
  }

  // These are the month/year you must use
  const currentMonth = String(displayDate.getMonth() + 1).padStart(2, "0");
  const currentYear = displayDate.getFullYear().toString();
  const formattedMonth = displayDate.toLocaleString("default", {
    month: "long",
  });

  // // Derive month and year from currentDate
  // const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  // const currentYear = currentDate.getFullYear().toString();
  // const formattedMonth = currentDate.toLocaleString("default", {
  //   month: "long",
  // });

  const totalPages = Math.ceil(totalCount / pageSize);

  // Automatic update for month/year
  useEffect(() => {
    const checkDate = () => {
      const now = new Date();
      if (
        now.getMonth() !== currentDate.getMonth() ||
        now.getFullYear() !== currentDate.getFullYear()
      ) {
        setCurrentDate(new Date());
      }
    };

    const timer = setInterval(checkDate, 60 * 1000);
    return () => clearInterval(timer);
  }, [currentDate]);

  // Fetch client numbers
  useEffect(() => {
    async function fetchClientNumbers() {
      try {
        const res = await fetch("/api/client_numbers", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setClientNumbers(data);
        } else {
          toast.error(data.error || "Failed to fetch client numbers");
        }
      } catch (err) {
        toast.error(err.message || "Unexpected error fetching client numbers");
        console.error(err);
      }
    }
    fetchClientNumbers();
  }, []);

  // Handle Generate Timesheet
  const handleGenerateTimesheet = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/generate_timesheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: currentMonth,
          year: currentYear,
          clientNumber,
        }),
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to generate timesheet");
      }
      toast.success("Timesheet generated successfully");

      // Refetch summary after successful generation
      await fetchTimesheetSummary(1);
      setCurrentPage(1);
    } catch (err) {
      toast.error(err.message || "Unexpected error");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch paginated timesheet summary
  useEffect(() => {
    document.title = "All Client Timesheet";
    fetchTimesheetSummary();
  }, [currentPage]);

  async function fetchTimesheetSummary(page = currentPage) {
    setPageLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("generated_timesheet_summary")
        .select("*", { count: "exact" })
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

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Client Timesheets
          </h1>
          <p className="text-sm text-gray-500">
            Generate and manage monthly client payroll timesheets
          </p>
        </div>

        <form
          onSubmit={handleGenerateTimesheet}
          className="p-4 flex flex-wrap gap-4 items-end"
        >
          {/* Month and Year Display */}
          <div className="flex flex-col">
            <span className="px-4 h-[42px] flex items-center justify-center rounded-md bg-gray-100 text-gray-700">
              {formattedMonth}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="px-4 h-[42px] flex items-center justify-center rounded-md bg-gray-100 text-gray-700">
              {currentYear}
            </span>
          </div>

          {/* Client Number */}
          <div className="flex flex-col h-full justify-end w-full sm:w-auto">
            <select
              id="clientNumber"
              value={clientNumber}
              onChange={(e) => setClientNumber(e.target.value)}
              required
              className="block w-full sm:w-40 h-[40px] px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-black"
            >
              <option value="">Select Client</option>
              {clientNumbers.map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex h-full items-end w-full sm:w-auto">
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full sm:w-auto h-[40px] px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-md cursor-pointer hover:from-indigo-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {actionLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
        <hr className="my-4 border-t border-gray-300" />

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
                    const { month, year } = formatMonthYear(
                      entry.timesheet_month
                    );
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
                        <td className="px-4 py-2 border">{month}</td>
                        <td className="px-4 py-2 border">{year}</td>
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
                            className={`px-2 py-1 rounded text-xs font-semibold 
                            ${
                              entry.status === "draft" &&
                              "bg-gray-200 text-gray-700"
                            }
                            ${
                              entry.status === "pending" &&
                              "bg-yellow-100 text-yellow-700"
                            }
                            ${
                              entry.status === "approved" &&
                              "bg-green-100 text-green-700"
                            }
                            ${
                              entry.status === "revision_required" &&
                              "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {entry.status.replace("_", " ")}
                          </span>
                        </td>

                        <td className="px-4 py-2 border text-center">
                          <TimesheetActions
                            clientNumber={entry.client_number}
                            year={year}
                            month={entry.timesheet_month.slice(5, 7)}
                            status={entry.status}
                            onSubmit={() => handleSubmitTimesheet(entry)}
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
    </>
  );
}
