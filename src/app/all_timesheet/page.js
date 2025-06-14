"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function TimesheetPage() {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [clientNumber, setClientNumber] = useState("");
  const [clientNumbers, setClientNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timesheetSummary, setTimesheetSummary] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const pageSize = 10;

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
        body: JSON.stringify({ month, year, clientNumber }),
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Failed to generate timesheet");
      setSuccessMessage("Timesheet generated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Refetch summary after successful generation
      await fetchTimesheetSummary(1); // Reset to first page to show new row
      setCurrentPage(1); // Optionally reset pagination
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

  async function fetchTimesheetSummary() {
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from("generated_timesheet_summary")
      .select("*", { count: "exact" })
      .order("timesheet_month", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching summary:", error.message);
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
    const totalPages = Math.ceil(totalCount / pageSize);
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
      return () => clearTimeout(timer); // Clean up if component unmounts or error changes
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
          {/* Month */}
          <div className="flex flex-col h-full justify-end w-full sm:w-auto">
            <label
              htmlFor="month"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Month
            </label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              className="block w-full sm:w-40 h-[42px] px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-black"
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="flex flex-col h-full justify-end w-full sm:w-auto">
            <label
              htmlFor="year"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Year
            </label>
            <input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              min="2000"
              max="2100"
              className="block w-full sm:w-40 h-[42px] px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-black"
            />
          </div>

          {/* Client Number */}
          <div className="flex flex-col h-full justify-end w-full sm:w-auto">
            <label
              htmlFor="clientNumber"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Client Number
            </label>
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
              className="w-full sm:w-auto h-[42px] px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-md hover:from-indigo-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
            <p className="text-green-600 text-center ">{successMessage}</p>
          ) : (
            <div className="h-full"></div> // empty filler to preserve height
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <div className="mx-auto max-w-7xl">
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
                const { month, year } = formatMonthYear(entry.timesheet_month);
                return (
                  <tr key={entry.uid} className="border border-gray-300">
                    <td className="px-4 py-2 border text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-2 border">{entry.client_number}</td>
                    <td className="px-4 py-2 border">{entry.client_name}</td>
                    <td className="px-4 py-2 border">{month}</td>
                    <td className="px-4 py-2 border">{year}</td>
                    <td className="px-4 py-2 border text-center">
                      {entry.employee_count}
                    </td>
                    <td className="px-4 py-2 border">
                      SAR {entry.total_salary_sum.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 border">
                      SAR {entry.adjusted_salary_sum.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 font-semibold border">
                      SAR {entry.grand_total.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 space-x-2 border">
                      <button className="px-3 py-1 text-gray rounded hover:bg-indigo-600 text-xs cursor-pointer">
                        View
                      </button>
                      <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs cursor-pointer">
                        Edit
                      </button>
                    </td>
                    <td className="px-4 py-2 space-x-2 border">
                      <button className="px-3 py-1 text-green hover:bg-green-600 text-xs cursor-pointer">
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
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 space-x-1 flex-wrap">
        <button
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50 cursor-pointer"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>

        {getPaginationPages().map((page, idx) =>
          page === "..." ? (
            <span key={idx} className="px-3 py-1">
              ...
            </span>
          ) : (
            <button
              key={idx}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded border cursor-pointer ${
                currentPage === page
                  ? "font-bold bg-blue-100 border-blue-400"
                  : "bg-white border-gray-300"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50 cursor-pointer"
          onClick={() =>
            setCurrentPage((p) =>
              p < Math.ceil(totalCount / pageSize) ? p + 1 : p
            )
          }
          disabled={currentPage >= Math.ceil(totalCount / pageSize)}
        >
          Next
        </button>
      </div>
    </>
  );
}
