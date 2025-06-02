"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

const ClientTimesheetPage = () => {
  const [clientNumbers, setClientNumbers] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [summaryData, setSummaryData] = useState([]);
  const [allSummaryData, setAllSummaryData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isTimesheetGenerated, setIsTimesheetGenerated] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [error, setError] = useState(null);
  const pageSize = 10;
  const router = useRouter();

  // Combine month and year into a date string (e.g., "2024-01-01")
  const getTimesheetDate = () => {
    if (!month || !year) return null;
    const paddedMonth = month.padStart(2, "0");
    const dateStr = `${year}-${paddedMonth}-01`;
    const date = new Date(dateStr);
    if (
      isNaN(date.getTime()) ||
      parseInt(month) < 1 ||
      parseInt(month) > 12 ||
      parseInt(year) < 2000 ||
      parseInt(year) > 9999
    ) {
      return null;
    }
    return dateStr;
  };

  // Fetch unique client numbers from employees table
  useEffect(() => {
    const fetchClientNumbers = async () => {
      setClientLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("client_number")
        .neq("client_number", null)
        .order("client_number", { ascending: true });

      if (error) {
        console.error("Error fetching client numbers:", error.message);
        setError("Failed to load client numbers");
        setClientLoading(false);
        return;
      }

      const uniqueClients = [...new Set(data.map((emp) => emp.client_number))];
      if (uniqueClients.length === 0) {
        setError("No clients found");
      }
      setClientNumbers(uniqueClients);
      setClientLoading(false);
    };

    fetchClientNumbers();
  }, []);

  // Check if timesheet already exists for the selected combination via API
  useEffect(() => {
    const checkExistingTimesheet = async () => {
      if (!selectedClient || !month || !year) {
        setIsTimesheetGenerated(false);
        setSummaryData([]);
        setAllSummaryData([]);
        setTotalPages(0);
        setError(null);
        return;
      }

      const timesheetDate = getTimesheetDate();
      if (!timesheetDate) {
        setError("Invalid month or year");
        setIsTimesheetGenerated(false);
        setSummaryData([]);
        setAllSummaryData([]);
        setTotalPages(0);
        return;
      }

      setCheckLoading(true);
      try {
        const response = await fetch(
          `/api/client_summary_table?client_number=${encodeURIComponent(
            selectedClient
          )}&timesheet_month=${encodeURIComponent(timesheetDate)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to check timesheet");
        }

        const exists = result.exists;
        setIsTimesheetGenerated(exists);
        setError(null);

        if (exists && result.data && result.data.length > 0) {
          setAllSummaryData(result.data);
          setTotalPages(Math.ceil(result.data.length / pageSize));
        } else {
          setSummaryData([]);
          setAllSummaryData([]);
          setTotalPages(0);
        }
      } catch (err) {
        console.error("Error checking existing timesheet:", err.message);
        setError("Error checking timesheet: " + err.message);
      } finally {
        setCheckLoading(false);
      }
    };

    checkExistingTimesheet();
  }, [selectedClient, month, year]);

  // Paginate the data
  useEffect(() => {
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    const paginatedData = allSummaryData.slice(from, to + 1);
    setSummaryData(paginatedData);
  }, [currentPage, allSummaryData]);

  // Fetch employee data and calculate summary
  const fetchSummaryData = async () => {
    if (!selectedClient || !month || !year) return;

    const timesheetDate = getTimesheetDate();
    if (!timesheetDate) {
      setError("Invalid month or year");
      setGenerateLoading(false);
      return;
    }

    setGenerateLoading(true);
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("client_number, client_name, total_salary")
        .eq("client_number", selectedClient)
        .eq("status", "active");

      if (employeeError) {
        throw new Error(employeeError.message);
      }

      if (!employeeData || employeeData.length === 0) {
        setAllSummaryData([
          {
            client_number: selectedClient,
            client_name: "Unknown",
            timesheet_month: timesheetDate,
            total_employees: 0,
            total_salary: 0,
            adjusted_salary: 0,
            grand_total: 0,
            status: "Pending",
          },
        ]);
        setTotalPages(1);
        setError(null);
        return;
      }

      const totalEmployees = employeeData.length;
      const totalSalary = employeeData.reduce(
        (sum, emp) => sum + (emp.total_salary || 0),
        0
      );
      const clientName = employeeData[0]?.client_name || "Unknown";

      const summaryRow = {
        client_number: selectedClient,
        client_name: clientName,
        timesheet_month: timesheetDate,
        total_employees: totalEmployees,
        total_salary: totalSalary,
        adjusted_salary: 0,
        grand_total: 0,
        status: "Pending",
      };

      setAllSummaryData([summaryRow]);
      setTotalPages(1);
      setSummaryData([summaryRow]);
      setError(null);
    } catch (err) {
      console.error("Error fetching employee data:", err.message);
      setError("Error loading summary: " + err.message);
    } finally {
      setGenerateLoading(false);
    }
  };

  // Handle timesheet generation
  const handleGenerateTimesheet = async () => {
    if (!selectedClient || !month || !year) return;

    setGenerateLoading(true);
    try {
      await fetchSummaryData();

      const timesheetDate = getTimesheetDate();
      if (!timesheetDate) {
        setError("Invalid month or year");
        setGenerateLoading(false);
        return;
      }

      const summaryRow = allSummaryData[0] || {
        client_number: selectedClient,
        client_name: "Unknown",
        timesheet_month: timesheetDate,
        total_employees: 0,
        total_salary: 0,
        adjusted_salary: 0,
        grand_total: 0,
        status: "Pending",
      };

      const { error } = await supabase.from("client_summary_table").insert({
        client_number: selectedClient,
        timesheet_month: timesheetDate,
        client_name: summaryRow.client_name,
        total_employees: summaryRow.total_employees,
        total_salary: summaryRow.total_salary,
        sum_total_adjusted_salary: summaryRow.adjusted_salary,
        grand_total: summaryRow.grand_total,
        status: summaryRow.status,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsTimesheetGenerated(true);
      setError(null);
      router.push(
        `/timesheet?client=${selectedClient}×heet_month=${timesheetDate}`
      );
    } catch (err) {
      console.error("Error saving timesheet summary:", err.message);
      setError("Error generating timesheet: " + err.message);
    } finally {
      setGenerateLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg mt-20">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        All Clients Timesheet
      </h1>

      <div className="flex justify-center flex-wrap p-8">
        {/* Month */}
        <div>
          <select
            className="border rounded px-3 py-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <select
            className="border rounded px-3 py-2"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">Year</option>
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Client Number */}
        <div className="ml-4">
          <select
            className="border rounded px-3 py-2 min-w-[150px]"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="">Select Client</option>
            {clientNumbers.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>
        </div>

        {/* Generate Timesheet Button */}
        <div className="ml-4">
          <button
            onClick={handleGenerateTimesheet}
            disabled={
              !selectedClient ||
              !month ||
              !year ||
              isTimesheetGenerated ||
              generateLoading
            }
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-70 cursor-pointer"
          >
            {generateLoading ? "Generating..." : "Generate Timesheet"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="text-center text-red-600 mb-4">{error}</div>}

      {/* Message for Existing Timesheet */}
      {isTimesheetGenerated && !error && (
        <div className="text-center text-red-600 mb-4">
          Timesheet already generated for this client, month, and year.
        </div>
      )}

      {/* Loading Clients */}
      {clientLoading && (
        <div className="text-center text-gray-600 mb-4">Loading clients...</div>
      )}

      {/* Summary Table */}
      <div className="w-full mt-20 p-4 mb-10">
        <h1 className="text-2xl font-bold text-center mb-6">
          Timesheet Summary
        </h1>
        {summaryData.length === 0 &&
          !isTimesheetGenerated &&
          !checkLoading &&
          !generateLoading &&
          !error && (
            <div className="text-center text-gray-600 mb-4">
              Generate timesheet to display here
            </div>
          )}
        {(checkLoading || generateLoading) && (
          <div className="text-center text-gray-600 mb-4">Loading...</div>
        )}
        {summaryData.length > 0 && (
          <div className="flex justify-center overflow-x-auto w-full">
            <table className="table-auto w-max border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {[
                    "S. No.",
                    "Client Number",
                    "Client Name",
                    "Timesheet Month",
                    "Total Employees",
                    "Total Salary",
                    "Adjusted Salary",
                    "Grand Total",
                    "Action",
                    "Status",
                  ].map((col) => (
                    <th key={col} className="border p-2">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaryData.map((row, index) => (
                  <tr
                    key={`${row.client_number}-${row.timesheet_month}`}
                    className="odd:bg-white even:bg-gray-50"
                  >
                    <td className="p-2 border text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="p-2 border text-center">
                      {row.client_number}
                    </td>
                    <td className="p-2 border">{row.client_name}</td>
                    <td className="p-2 border text-center">
                      {new Date(row.timesheet_month).toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-2 border text-center">
                      {row.total_employees}
                    </td>
                    <td className="p-2 border text-center">
                      {row.total_salary.toFixed(2)}
                    </td>
                    <td className="p-2 border text-center">
                      {row.adjusted_salary.toFixed(2)}
                    </td>
                    <td className="p-2 border text-center">
                      {row.grand_total.toFixed(2)}
                    </td>
                    <td className="p-2 border text-center">
                      <Link
                        href={`/timesheet?client=${row.client_number}×heet_month=${row.timesheet_month}`}
                        className="text-blue-600 hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                    <td className="p-2 border text-center">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {summaryData.length > 0 && (
          <div className="flex justify-center mt-4 space-x-1 flex-wrap">
            <button
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded border ${
                    currentPage === pageNum
                      ? "font-bold bg-blue-100 border-blue-400"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}
            <button
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              onClick={() =>
                setCurrentPage((p) => (p < totalPages ? p + 1 : p))
              }
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientTimesheetPage;
