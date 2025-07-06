"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import DownloadTimesheet from "@/component/DownloadTimesheet";

export default function EditTimesheetPage() {
  const { client_number, year, month } = useParams();
  const [timesheetData, setTimesheetData] = useState([]);
  const [clientName, setClientName] = useState("");
  const [summaryData, setSummaryData] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [originalValues, setOriginalValues] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();
  const pageSize = 10;

  const totalPages = Math.ceil(totalCount / pageSize);

  // Function to get pagination pages (e.g., 1, 2, 3, ..., 10)
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

  // Fetch timesheet and summary data with pagination
  useEffect(() => {
    async function fetchTimesheetData(page = currentPage) {
      const fromDate = `${year}-${month}-01`;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("generated_timesheet")
        .select(
          `uid, *, employees!inner(name, client_name, iqama_number, client_number, hra, tra, food_allowance, other_allowance)`,
          { count: "exact" }
        )
        .eq("timesheet_month", fromDate)
        .eq("employees.client_number", client_number)
        .order("iqama_number", { foreignTable: "employees", ascending: true })
        .range(from, to);

      if (error) {
        console.error("Fetch error details:", error);
        setError(`Failed to fetch timesheet data: ${error.message}`);
        return;
      }

      // Log fetched data to inspect order
      console.log("Fetched timesheet data:", data);

      // Sort data in JavaScript as a fallback
      const sortedData = data
        ? data.sort((a, b) =>
            a.employees.iqama_number.localeCompare(b.employees.iqama_number)
          )
        : [];
      setTimesheetData(sortedData);
      setTotalCount(count || 0);

      if (data && data.length > 0) {
        setClientName(data[0].employees.client_name);
        // Initialize edited and original values
        const initialValues = {};
        data.forEach((item) => {
          initialValues[item.uid] = {
            working_days: item.working_days || 0,
            overtime_hrs: item.overtime_hrs || 0,
            absent_hrs: item.absent_hrs || 0,
            incentive: item.incentive || 0,
            etmam_cost: item.etmam_cost || 0,
          };
        });
        setEditedValues(initialValues);
        setOriginalValues(initialValues);
      }
    }

    async function fetchSummaryData() {
      const fromDate = `${year}-${month}-01`;
      const { data, error } = await supabase
        .from("generated_timesheet_summary")
        .select(
          "working_days_count, total_salary_sum, total_cost_sum, vat_sum, grand_total"
        )
        .eq("client_number", client_number)
        .eq("timesheet_month", fromDate)
        .single();

      if (error) {
        console.error("Summary fetch error:", error);
        setError(`Failed to fetch summary data: ${error.message}`);
      } else {
        setSummaryData(data);
      }
    }

    fetchTimesheetData(currentPage);
    fetchSummaryData();
  }, [client_number, year, month, currentPage]);

  // Handle input changes for editable fields
  const handleInputChange = (timesheetUid, field, value) => {
    setEditedValues((prev) => ({
      ...prev,
      [timesheetUid]: {
        ...prev[timesheetUid],
        [field]: value,
      },
    }));
  };

  // Handle save button click
  const handleSaveClick = async () => {
    setError(null);
    setSuccess(null);

    // Validate all edited values
    for (const timesheetUid in editedValues) {
      const updates = editedValues[timesheetUid];
      for (const field of [
        "working_days",
        "overtime_hrs",
        "absent_hrs",
        "incentive",
        "etmam_cost",
      ]) {
        if (
          updates[field] !== undefined &&
          (isNaN(updates[field]) || updates[field] < 0)
        ) {
          setError(`${field.replace("_", " ")} must be a non-negative number.`);
          return;
        }
      }
    }

    try {
      // Send all updates in a single batch
      const updatePromises = Object.keys(editedValues).map((timesheetUid) =>
        fetch("/api/generate_timesheet", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timesheetId: timesheetUid,
            updates: editedValues[timesheetUid],
          }),
          credentials: "include",
        }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "Failed to update timesheet.");
          }
          return result;
        })
      );

      await Promise.all(updatePromises);

      // Refetch timesheet data to reflect changes
      const fromDate = `${year}-${month}-01`;
      const {
        data: updatedTimesheets,
        error: fetchError,
        count,
      } = await supabase
        .from("generated_timesheet")
        .select(
          `uid, *, employees!inner(name, client_name, iqama_number, client_number, hra, tra, food_allowance, other_allowance)`,
          { count: "exact" }
        )
        .eq("timesheet_month", fromDate)
        .eq("employees.client_number", client_number)
        .order("iqama_number", { foreignTable: "employees", ascending: true })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (fetchError) {
        console.error("Refetch error:", fetchError);
        setError(`Failed to refetch timesheet data: ${fetchError.message}`);
        Middle: true;
      } else {
        // Log refetched data to inspect order
        console.log("Refetched timesheet data:", updatedTimesheets);

        // Sort data in JavaScript as a fallback
        const sortedData = updatedTimesheets
          ? updatedTimesheets.sort((a, b) =>
              a.employees.iqama_number.localeCompare(b.employees.iqama_number)
            )
          : [];
        setTimesheetData(sortedData);
        setTotalCount(count || 0);

        if (updatedTimesheets && updatedTimesheets.length > 0) {
          setClientName(updatedTimesheets[0].employees.client_name);
        }
        // Update original values to reflect saved changes
        const newOriginalValues = {};
        updatedTimesheets.forEach((item) => {
          newOriginalValues[item.uid] = {
            working_days: item.working_days || 0,
            overtime_hrs: item.overtime_hrs || 0,
            absent_hrs: item.absent_hrs || 0,
            incentive: item.incentive || 0,
            etmam_cost: item.etmam_cost || 0,
            penalty: item.penalty || 0,
          };
        });
        setOriginalValues(newOriginalValues);
      }

      // Refetch summary data to reflect changes
      const { data: summary, error: summaryError } = await supabase
        .from("generated_timesheet_summary")
        .select(
          "working_days_count, total_salary_sum, total_cost_sum, vat_sum, grand_total"
        )
        .eq("client_number", client_number)
        .eq("timesheet_month", fromDate)
        .single();

      if (summaryError) {
        console.error("Summary refetch error:", summaryError);
        setError("Failed to refresh summary data.");
      } else {
        setSummaryData(summary);
      }

      setSuccess("Timesheet updated successfully!");
    } catch (error) {
      console.error("Error updating timesheet:", error);
      setError("Server error. Please try again.");
    }
  };

  // Handle cancel button click
  const handleCancelClick = () => {
    setEditedValues(originalValues);
    setError(null);
    setSuccess(null);
  };

  // Set timeout for error and success messages
  useEffect(() => {
    let timer;
    if (error || success) {
      timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [error, success]);

  const monthYear = `${month}-${year}`;

  return (
    <div className="p-8 mt-20">
      <h1 className="text-2xl font-bold text-center mb-6">
        {clientName || "Loading..."} — Edit Timesheet — {month}-{year}
      </h1>

      {/* Display Error or Success Messages */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">{error}</div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-4 mb-4 rounded">
          {success}
        </div>
      )}

      {/* Main Timesheet Table */}
      <div className="w-full overflow-x-auto">
        <table className="table-auto w-max min-w-full border-collapse border text-xs lg:text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="table-cell-style">S.No</th>
              <th className="table-cell-style">Iqama Number</th>
              <th className="table-cell-style text-left">Employee Name</th>
              <th className="table-cell-style">Basic Salary</th>
              <th className="table-cell-style">Allowance</th>
              <th className="table-cell-style">Total Salary</th>
              <th className="table-cell-style">Working Days</th>
              <th className="table-cell-style">Overtime Hrs</th>
              <th className="table-cell-style">Absent Hrs</th>
              <th className="table-cell-style">Overtime</th>
              <th className="table-cell-style">Incentives</th>
              <th className="table-cell-style">Penalty</th>
              <th className="table-cell-style">Deductions</th>
              <th className="table-cell-style">Adjusted Salary</th>
              <th className="table-cell-style">Etmam Cost</th>
              <th className="table-cell-style font-semibold">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {timesheetData.map((item, index) => {
              const allowance =
                (item.employees.hra ?? 0) +
                (item.employees.tra ?? 0) +
                (item.employees.food_allowance ?? 0) +
                (item.employees.other_allowance ?? 0);

              return (
                <tr key={item.uid} className="border">
                  <td className="table-cell-style">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="table-cell-style">
                    {item.employees.iqama_number}
                  </td>
                  <td className="table-cell-style text-left">
                    {item.employees.name}
                  </td>
                  <td className="table-cell-style">
                    {(item.basic_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style">{allowance.toFixed(2)}</td>
                  <td className="table-cell-style">
                    {(item.total_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={
                        editedValues[item.uid]?.working_days ??
                        item.working_days
                      }
                      onChange={(e) =>
                        handleInputChange(
                          item.uid,
                          "working_days",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 text-center border rounded"
                    />
                  </td>
                  <td className="table-cell-style">
                    <input
                      type="number"
                      min="0"
                      value={
                        editedValues[item.uid]?.overtime_hrs ??
                        item.overtime_hrs
                      }
                      onChange={(e) =>
                        handleInputChange(
                          item.uid,
                          "overtime_hrs",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 text-center border rounded"
                    />
                  </td>
                  <td className="table-cell-style">
                    <input
                      type="number"
                      min="0"
                      value={
                        editedValues[item.uid]?.absent_hrs ?? item.absent_hrs
                      }
                      onChange={(e) =>
                        handleInputChange(
                          item.uid,
                          "absent_hrs",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 text-center border rounded"
                    />
                  </td>
                  <td className="table-cell-style">
                    {(item.overtime ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        editedValues[item.uid]?.incentive ?? item.incentive
                      }
                      onChange={(e) =>
                        handleInputChange(
                          item.uid,
                          "incentive",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-16 text-center border rounded"
                    />
                  </td>
                  <td className="table-cell-style">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editedValues[item.uid]?.penalty ?? item.penalty}
                      onChange={(e) =>
                        handleInputChange(
                          item.uid,
                          "penalty",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-16 text-center border rounded"
                    />
                  </td>
                  <td className="table-cell-style">
                    {(item.deductions ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style">
                    {(item.adjusted_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        editedValues[item.uid]?.etmam_cost ?? item.etmam_cost
                      }
                      onChange={(e) =>
                        handleInputChange(
                          item.uid,
                          "etmam_cost",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-16 text-center border rounded"
                    />
                  </td>
                  <td className="table-cell-style font-semibold">
                    {(item.total_cost ?? 0).toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {timesheetData.length === 0 && (
              <tr>
                <td colSpan="15" className="text-center py-4">
                  No timesheet data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {timesheetData.length > 0 && (
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

      {/* Save and Cancel Buttons */}
      <div className="flex justify-center gap-4 mt-4 mb-10">
        <button
          onClick={handleSaveClick}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Save
        </button>
        <button
          onClick={handleCancelClick}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Cancel
        </button>
        <button
          onClick={() => router.push("/all_timesheet")}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back
        </button>
        <DownloadTimesheet
          clientNumber={client_number}
          year={year}
          month={month}
        />
      </div>

      {/* Timesheet Summary Table */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-center mb-4">
          Timesheet Summary
        </h2>
        <div className="overflow-x-auto flex justify-center">
          <table className="table-auto border-collapse border border-gray-300 text-sm w-max">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="border px-4 py-2">Total Working Days</th>
                <th className="border px-4 py-2">Net Salary</th>
                <th className="border px-4 py-2">Net Cost Total</th>
                <th className="border px-4 py-2">VAT</th>
                <th className="border px-4 py-2">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {summaryData ? (
                <tr className="text-center">
                  <td className="border px-4 py-2">
                    {summaryData.working_days_count ?? 0}
                  </td>
                  <td className="border px-4 py-2">
                    {summaryData.total_salary_sum?.toFixed(2) ?? "0.00"}
                  </td>
                  <td className="border px-4 py-2">
                    {summaryData.total_cost_sum?.toFixed(2) ?? "0.00"}
                  </td>
                  <td className="border px-4 py-2">
                    {summaryData.vat_sum?.toFixed(2) ?? "0.00"}
                  </td>
                  <td className="border px-4 py-2 font-bold">
                    {summaryData.grand_total?.toFixed(2) ?? "0.00"}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No summary data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
