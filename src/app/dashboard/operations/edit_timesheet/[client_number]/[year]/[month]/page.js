"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import DownloadTimesheet from "@/component/DownloadTimesheet";
import UploadTimesheet from "@/component/UploadTimesheet";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pageSize = 10;

  const totalPages = Math.ceil(totalCount / pageSize);

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

  // Refetch timesheet data based on search or pagination
  const fetchTimesheetData = async (page = currentPage, search = "") => {
    setLoading(true);
    try {
      const fromDate = `${year}-${month}-01`;
      let query = supabase
        .from("generated_timesheet")
        .select(
          `uid, *, employees!inner(name, client_name, iqama_number, client_number, hra, tra, food_allowance, other_allowance)`,
          { count: "exact" }
        )
        .eq("timesheet_month", fromDate)
        .eq("employees.client_number", client_number)
        .order("iqama_number", { ascending: true });

      if (search) {
        query = query.ilike("employees.iqama_number", `%${search}%`);
        setIsSearching(true);
      } else {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query
          .order("iqama_number", { foreignTable: "employees", ascending: true })
          .range(from, to);
        setIsSearching(false);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch timesheet data: ${error.message}`);
      }

      const sortedData = data
        ? data.sort((a, b) =>
            a.employees.iqama_number.localeCompare(b.employees.iqama_number)
          )
        : [];
      setTimesheetData(sortedData);
      setTotalCount(count || 0);

      if (data && data.length > 0) {
        setClientName(data[0].employees.client_name);
        const initialValues = {};
        data.forEach((item) => {
          initialValues[item.uid] = {
            working_days: item.working_days || 0,
            overtime_hrs: item.overtime_hrs || 0,
            absent_hrs: item.absent_hrs || 0,
            incentive: item.incentive || 0,
            etmam_cost: item.etmam_cost || 0,
            penalty: item.penalty || 0,
          };
        });
        setEditedValues(initialValues);
        setOriginalValues(initialValues);
      } else {
        setClientName("");
        setEditedValues({});
        setOriginalValues({});
      }
    } catch (err) {
      console.error("Fetch error details:", err);
      setError(err.message || "Failed to fetch timesheet data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
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
        throw new Error(`Failed to fetch summary data: ${error.message}`);
      }
      setSummaryData(data);
    } catch (err) {
      console.error("Summary fetch error:", err);
      setError(err.message || "Failed to fetch summary data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = `Edit ${clientName || "Loading..."} ${month}-${year}`;
    if (searchTerm) {
      fetchTimesheetData(1, searchTerm);
    } else {
      fetchTimesheetData(currentPage);
    }
    fetchSummaryData();
  }, [clientName, client_number, year, month, currentPage, searchTerm]);

  const handleInputChange = (timesheetUid, field, value) => {
    setEditedValues((prev) => ({
      ...prev,
      [timesheetUid]: {
        ...prev[timesheetUid],
        [field]: value,
      },
    }));
  };

  const handleSaveClick = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      for (const timesheetUid in editedValues) {
        const updates = editedValues[timesheetUid];
        for (const field of [
          "working_days",
          "overtime_hrs",
          "absent_hrs",
          "incentive",
          "etmam_cost",
          "penalty",
        ]) {
          if (
            updates[field] !== undefined &&
            (isNaN(updates[field]) || updates[field] < 0)
          ) {
            throw new Error(
              `${field.replace("_", " ")} must be a non-negative number.`
            );
          }
        }
      }

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

      if (searchTerm) {
        await fetchTimesheetData(1, searchTerm);
      } else {
        await fetchTimesheetData(currentPage);
      }
      await fetchSummaryData();

      setSuccess("Timesheet updated successfully!");
    } catch (error) {
      console.error("Error updating timesheet:", error);
      setError(error.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setEditedValues(originalValues);
    setError(null);
    setSuccess(null);
    setSearchTerm("");
    fetchTimesheetData(currentPage);
  };

  const handleUploadSuccess = async () => {
    setError(null);
    setSuccess("Timesheet uploaded successfully!");
    if (searchTerm) {
      await fetchTimesheetData(1, searchTerm);
    } else {
      await fetchTimesheetData(currentPage);
    }
    await fetchSummaryData();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    fetchTimesheetData(1);
  };

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
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        {clientName || "Loading..."} — Edit Timesheet — {month}-{year}
      </h1>

      <div className="flex justify-center mb-6">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search Employee by Iqama Number"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-700 p-4 mb-4 text-center">{error}</div>
      )}
      {success && (
        <div className="text-green-700 p-4 mb-4 text-center">{success}</div>
      )}

      <div className="w-full overflow-x-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
            <p className="mt-2">Loading...</p>
          </div>
        ) : timesheetData.length === 0 ? (
          <div className="text-center text-gray-500 text-lg py-10">
            No timesheet data available.
          </div>
        ) : (
          <table className="table-auto w-max min-w-full border-collapse border text-xs lg:text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="table-cell-style table-cell-center">S.No</th>
                <th className="table-cell-style table-cell-center">
                  Iqama Number
                </th>
                <th className="table-cell-style table-cell-center">
                  Employee Name
                </th>
                <th className="table-cell-style table-cell-center">
                  Basic Salary
                </th>
                <th className="table-cell-style table-cell-center">
                  Allowance
                </th>
                <th className="table-cell-style table-cell-center">
                  Total Salary
                </th>
                <th className="table-cell-style table-cell-center">
                  Working Days
                </th>
                <th className="table-cell-style table-cell-center">
                  Overtime Hrs
                </th>
                <th className="table-cell-style table-cell-center">
                  Absent Hrs
                </th>
                <th className="table-cell-style table-cell-center">Overtime</th>
                <th className="table-cell-style table-cell-center">
                  Incentives
                </th>
                <th className="table-cell-style table-cell-center">Penalty</th>
                <th className="table-cell-style table-cell-center">
                  Deductions
                </th>
                <th className="table-cell-style table-cell-center">
                  Adjusted Salary
                </th>
                <th className="table-cell-style table-cell-center">
                  Etmam Cost
                </th>
                <th className="table-cell-style table-cell-center font-semibold">
                  Total Cost
                </th>
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
                    <td className="table-cell-style table-cell-center">
                      {isSearching
                        ? index + 1
                        : (currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="table-cell-style table-cell-center">
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
            </tbody>
          </table>
        )}
      </div>

      {!isSearching && timesheetData.length > 0 && !loading && (
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

      <div className="flex justify-center gap-4 mt-8 mb-8">
        <button
          onClick={handleSaveClick}
          disabled={loading}
          className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${
            loading ? "bg-gray-400 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleCancelClick}
          disabled={loading}
          className={`bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ${
            loading ? "bg-gray-400 cursor-not-allowed" : ""
          }`}
        >
          Cancel
        </button>
        <button
          onClick={() => router.push("/dashboard/operations/all_timesheet")}
          disabled={loading}
          className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${
            loading ? "bg-gray-400 cursor-not-allowed" : ""
          }`}
        >
          Back
        </button>
        <DownloadTimesheet
          clientNumber={client_number}
          year={year}
          month={month}
          disabled={loading}
        />
        <UploadTimesheet
          clientNumber={client_number}
          year={year}
          month={month}
          onUploadSuccess={handleUploadSuccess}
          disabled={loading}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-center mb-4">
          Timesheet Summary
        </h2>
        <div className="overflow-x-auto flex justify-center">
          {loading ? (
            <div className="text-center text-gray-500 py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
              <p className="mt-2">Loading...</p>
            </div>
          ) : summaryData ? (
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
              </tbody>
            </table>
          ) : (
            <div className="text-center text-gray-500 text-lg py-10">
              No summary data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
