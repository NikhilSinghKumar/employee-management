"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function EditTimesheetPage() {
  const { client_number, year, month } = useParams();
  const [timesheetData, setTimesheetData] = useState([]);
  const [clientName, setClientName] = useState("");
  const [summaryData, setSummaryData] = useState(null);
  const [editedValues, setEditedValues] = useState({}); // Store edited values
  const [originalValues, setOriginalValues] = useState({}); // Store original values for cancel
  const [error, setError] = useState(null); // Track errors
  const [success, setSuccess] = useState(null); // Track success messages
  const router = useRouter();

  // Fetch timesheet and summary data
  useEffect(() => {
    async function fetchTimesheetData() {
      const fromDate = `${year}-${month}-01`;
      const { data, error } = await supabase
        .from("generated_timesheet")
        .select(
          `uid, *, employees!inner(name, client_name, iqama_number, client_number, hra, tra, food_allowance, other_allowance)`
        )
        .eq("timesheet_month", fromDate)
        .eq("employees.client_number", client_number)
        .order("iqama_number", { foreignTable: "employees", ascending: true }); // Sort by iqama_number

      if (error) {
        console.error("Fetch error details:", error);
        setError(`Failed to fetch timesheet data: ${error.message}`);
        return;
      }

      // Log fetched data to inspect order
      console.log("Fetched timesheet data:", data);

      // Sort data in JavaScript as a fallback
      const sortedData12 = data
        ? data.sort((a, b) =>
            a.employees.iqama_number.localeCompare(b.employees.iqama_number)
          )
        : [];
      setTimesheetData(sortedData12);
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

    fetchTimesheetData();
    fetchSummaryData();
  }, [client_number, year, month]);

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
      const { data: updatedTimesheets, error: fetchError } = await supabase
        .from("generated_timesheet")
        .select(
          `uid, *, employees!inner(name, client_name, iqama_number, client_number, hra, tra, food_allowance, other_allowance)`
        )
        .eq("timesheet_month", fromDate)
        .eq("employees.client_number", client_number)
        .order("iqama_number", { foreignTable: "employees", ascending: true }); // Sort by iqama_number

      if (fetchError) {
        console.error("Refetch error:", fetchError);
        setError(`Failed to refetch timesheet data: ${fetchError.message}`);
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
    setEditedValues(originalValues); // Reset to original values
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
      }, 3000); // 3 seconds
    }
    return () => clearTimeout(timer); // Cleanup timer on unmount or state change
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
      <div className="overflow-x-auto w-full flex justify-center mb-10">
        <table className="table-auto w-max border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="border px-4 py-2">S.No</th>
              <th className="border px-4 py-2">Iqama Number</th>
              <th className="border px-4 py-2">Employee Name</th>
              <th className="border px-4 py-2">Basic Salary</th>
              <th className="border px-4 py-2">Allowance</th>
              <th className="border px-4 py-2">Total Salary</th>
              <th className="border px-4 py-2">Working Days</th>
              <th className="border px-4 py-2">Overtime Hrs</th>
              <th className="border px-4 py-2">Absent Hrs</th>
              <th className="border px-4 py-2">Overtime</th>
              <th className="border px-4 py-2">Incentives</th>
              <th className="border px-4 py-2">Deductions</th>
              <th className="border px-4 py-2">Adjusted Salary</th>
              <th className="border px-4 py-2">Etmam Cost</th>
              <th className="border px-4 py-2 font-semibold">Total Cost</th>
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
                  <td className="border px-4 py-2 text-center">{index + 1}</td>
                  <td className="border px-4 py-2">
                    {item.employees.iqama_number}
                  </td>
                  <td className="border px-4 py-2">{item.employees.name}</td>
                  <td className="border px-4 py-2">
                    {(item.basic_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">{allowance.toFixed(2)}</td>
                  <td className="border px-4 py-2">
                    {(item.total_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <input
                      type="number"
                      min="0"
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
                  <td className="border px-4 py-2 text-center">
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
                  <td className="border px-4 py-2 text-center">
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
                  <td className="border px-4 py-2 text-center">
                    {(item.overtime ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2 text-center">
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
                  <td className="border px-4 py-2">
                    {(item.deductions ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">
                    {(item.adjusted_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">
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
                  <td className="border px-4 py-2 font-semibold">
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

      {/* Save and Cancel Buttons */}
      <div className="flex justify-center gap-4 mb-10">
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
