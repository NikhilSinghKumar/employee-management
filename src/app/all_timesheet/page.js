"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function TimesheetPage() {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [clientNumber, setClientNumber] = useState("");
  const [clientNumbers, setClientNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timesheetSummary, setTimesheetSummary] = useState([]);
  const router = useRouter();

  // Fetch client numbers
  useEffect(() => {
    async function fetchClientNumbers() {
      const res = await fetch("/api/client_numbers", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setClientNumbers(data);
      } else {
        setError(data.error);
      }
    }
    fetchClientNumbers();
  }, []);

  // Handle form submission
  const handleGenerateTimesheet = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate_timesheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ month, year, clientNumber }),
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to generate timesheet");
      }

      alert("Timesheet generated successfully!");
      router.push("/timesheet/history");
    } catch (err) {
      setError(err.message || "Unexpected error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch timesheet summary
  useEffect(() => {
    async function fetchTimesheetSummary() {
      const { data, error } = await supabase
        .from("generated_timesheet_summary")
        .select("*")
        .order("timesheet_month", { ascending: false });

      if (error) {
        console.error("Error fetching summary:", error.message);
      } else {
        setTimesheetSummary(data);
      }
    }

    fetchTimesheetSummary();
  }, []);

  // Format month and year
  const formatMonthYear = (dateString) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleString("default", { month: "long" }),
      year: date.getFullYear(),
    };
  };

  return (
    <>
      <div className="container mx-auto p-6 mt-16 max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          All Client Timesheet
        </h1>
        {error && (
          <p className="text-red-500 text-center bg-red-100 p-3 rounded-lg mb-6">
            {error}
          </p>
        )}
        <form
          onSubmit={handleGenerateTimesheet}
          className="flex flex-col sm:flex-row items-end justify-center gap-4 bg-gradient-to-br from-white via-gray-50 to-gray-100 p-6 rounded-2xl shadow-2xl ring-1 ring-gray-200 transition-all duration-300"
        >
          <div className="flex flex-col h-full justify-end w-full sm:w-auto">
            <label
              className="text-sm font-medium text-gray-700 mb-1"
              htmlFor="month"
            >
              Month
            </label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              className="block w-full sm:w-40 h-[42px] px-4 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-black focus:ring-0 transition-all duration-200"
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col h-full justify-end w-full sm:w-auto">
            <label
              className="text-sm font-medium text-gray-700 mb-1"
              htmlFor="year"
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
              className="block w-full sm:w-40 h-[42px] px-4 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-black focus:ring-0 transition-all duration-200"
            />
          </div>

          <div className="flex flex-col h-full justify-end w-full sm:w-auto">
            <label
              className="text-sm font-medium text-gray-700 mb-1"
              htmlFor="clientNumber"
            >
              Client Number
            </label>
            <select
              id="clientNumber"
              value={clientNumber}
              onChange={(e) => setClientNumber(e.target.value)}
              required
              className="block w-full sm:w-40 h-[42px] px-4 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-black focus:ring-0 transition-all duration-200"
            >
              <option value="">Select Client</option>
              {clientNumbers.map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
          </div>

          <div className="flex h-full items-end w-full sm:w-auto">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto h-[42px] px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-md hover:from-indigo-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md transition-all duration-200 cursor-pointer"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      </div>
      <div className="mt-10 overflow-x-auto w-full">
        <div className="mx-auto max-w-7xl">
          <table className="table-auto w-max border-collapse border border-gray-300 text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr className="border border-gray-300">
                <th className="px-4 py-3 border border-gray-300">S.No</th>
                <th className="px-4 py-3 border border-gray-300">
                  Client Number
                </th>
                <th className="px-4 py-3 border border-gray-300">
                  Client Name
                </th>
                <th className="px-4 py-3 border border-gray-300">Month</th>
                <th className="px-4 py-3 border border-gray-300">Year</th>
                <th className="px-4 py-3 border border-gray-300">
                  Total Employees
                </th>
                <th className="px-4 py-3 border border-gray-300">Net Salary</th>
                <th className="px-4 py-3 border border-gray-300">
                  Net Adjusted Salary
                </th>
                <th className="px-4 py-3 border border-gray-300">
                  Grand Total
                </th>
                <th className="px-4 py-3 border border-gray-300">Action</th>
                <th className="px-4 py-3 border border-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {timesheetSummary.map((entry, index) => {
                const { month, year } = formatMonthYear(entry.timesheet_month);
                return (
                  <tr key={entry.uid} className="border border-gray-300">
                    <td className="px-4 py-2 border border-gray-300 text-center">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {entry.client_number}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {entry.client_name}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {month}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">{year}</td>
                    <td className="px-4 py-2 border border-gray-300 text-center">
                      {entry.employee_count}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      SAR {entry.total_salary_sum.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      SAR {entry.adjusted_salary_sum.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 font-semibold text-blue-700 border border-gray-300">
                      SAR {entry.grand_total.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 space-x-2 border border-gray-300">
                      <button className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-xs">
                        View
                      </button>
                      <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs">
                        Edit
                      </button>
                    </td>
                    <td className="px-4 py-2 space-x-2 border border-gray-300">
                      <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs">
                        Submit
                      </button>
                      <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">
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
    </>
  );
}
