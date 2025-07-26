"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function TimesheetPage() {
  const [clientNumber, setClientNumber] = useState("");
  const [clientNumbers, setClientNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timesheetSummary, setTimesheetSummary] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date()); // State for current date
  const pageSize = 10;
  const router = useRouter();

  // Derive month and year from currentDate
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is 0-based, so +1
  const currentYear = currentDate.getFullYear().toString();
  const formattedMonth = currentDate.toLocaleString("default", {
    month: "long",
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  // Automatic update for month/year
  useEffect(() => {
    const checkDate = () => {
      const now = new Date();
      // Check if month or year has changed
      if (
        now.getMonth() !== currentDate.getMonth() ||
        now.getFullYear() !== currentDate.getFullYear()
      ) {
        setCurrentDate(new Date()); // Update date to trigger re-render
      }
    };

    // Check every minute (or adjust interval as needed)
    const timer = setInterval(checkDate, 60 * 1000); // 60 seconds
    return () => clearInterval(timer); // Cleanup on unmount
  }, [currentDate]);

  // Fetch client numbers
  useEffect(() => {
    async function fetchClientNumbers() {
      const res = await fetch("/api/client_numbers", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setClientNumbers(data);
      else setError(data.error);
    }
    fetchClientNumbers();
  }, []);

  // Handle Generate Timesheet
  const handleGenerateTimesheet = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
      if (!res.ok)
        throw new Error(result.error || "Failed to generate timesheet");
      setSuccessMessage("Timesheet generated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Refetch summary after successful generation
      await fetchTimesheetSummary(1); // Reset to first page to show new row
      setCurrentPage(1); // Reset pagination
    } catch (err) {
      setError(err.message || "Unexpected error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch paginated timesheet summary
  useEffect(() => {
    fetchTimesheetSummary();
  }, [currentPage]);

  async function fetchTimesheetSummary(page = currentPage) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from("generated_timesheet_summary")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false }) // Sort by created_at descending
      .range(from, to);

    if (error) {
      console.error("Error fetching summary:", error.message);
      setError(error.message || "Failed to fetch timesheet summary");
      return;
    }
    setTimesheetSummary(data || []);
    setTotalCount(count || 0);
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

  // Auto-hide error message after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <>
      <div className="container mx-auto p-6 mt-16 max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          All Client Timesheet
        </h1>

        <form
          onSubmit={handleGenerateTimesheet}
          className="flex flex-col sm:flex-row items-end justify-center gap-4 bg-gradient-to-br from-white via-gray-50 to-gray-100 p-6 rounded-2xl shadow-2xl ring-1 ring-gray-300"
        >
          {/* Month and Year Display */}
          <div className="flex flex-col h-full justify-end w-full sm:w-auto">
            <div className="block w-full flex items-center justify-center sm:w-40 h-[42px] px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700">
              {formattedMonth}
            </div>
          </div>
          <div className="flex flex-col h-full justify-end w-full sm:w-auto">
            <div className="block w-full flex items-center justify-center sm:w-40 h-[42px] px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700">
              {currentYear}
            </div>
          </div>

          {/* Client Number */}
          <div className="flex flex-col h-full justify-end w-full sm:w-auto">
            <select
              id="clientNumber"
              value={clientNumber}
              onChange={(e) => setClientNumber(e.target.value)}
              required
              className="block w-full sm:w-40 h-[42px] px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-black"
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
              disabled={loading}
              className="w-full sm:w-auto h-[42px] px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-md cursor-pointer hover:from-indigo-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
        <div className="h-12 mb-4 mt-1">
          {error ? (
            <p className="text-red-600 text-center transition-opacity duration-300 ease-in-out opacity-100">
              {error}
            </p>
          ) : successMessage ? (
            <p className="text-green-600 text-center">{successMessage}</p>
          ) : (
            <div className="h-full"></div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <div className="mx-auto max-w-7xl">
          {timesheetSummary.length === 0 ? (
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
                  <th className="px-4 py-3 border">Action</th>
                  <th className="px-4 py-3 border">Status</th>
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
                      <td className="px-4 py-2 border">{entry.client_name}</td>
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
                      <td className="px-4 py-2 space-x-2 border">
                        <button
                          onClick={() =>
                            router.push(
                              `/operations/timesheet/${
                                entry.client_number
                              }/${year}/${entry.timesheet_month.slice(5, 7)}`
                            )
                          }
                          className="px-3 py-1 text-gray rounded hover:bg-indigo-600 hover:text-white text-xs cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/operations/edit_timesheet/${
                                entry.client_number
                              }/${year}/${entry.timesheet_month.slice(5, 7)}`
                            )
                          }
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                      <td className="px-4 py-2 space-x-2 border">
                        <button className="px-3 py-1 text-green hover:bg-green-600 hover:text-white text-xs cursor-pointer">
                          Submit
                        </button>
                        <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs cursor-pointer">
                          Closed
                        </button>
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
      {timesheetSummary.length > 0 && (
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
    </>
  );
}
