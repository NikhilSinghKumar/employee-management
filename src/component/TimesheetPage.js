"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function TimesheetPage() {
  const searchParams = useSearchParams();
  const clientNumber = searchParams.get("client");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const [employees, setEmployees] = useState([]);
  const [clientName, setClientName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [allEmployeeData, setAllEmployeeData] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const fetchData = async () => {
      if (!clientNumber || !month || !year) return;

      // Step 1: Fetch all employee salaries (not paginated) to ensure total_salary is available for summary
      await fetchAllEmployeeSalaries();
      // Step 2: Fetch draft data
      await fetchAllDraftData();
      // Step 3: Fetch timesheet data
      await fetchAllTimesheetData();
      // Step 4: Fetch paginated employees for display
      await fetchEmployees();
    };

    fetchData();
  }, [clientNumber, month, year, currentPage]);

  const fetchAllEmployeeSalaries = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, total_salary")
      .eq("client_number", clientNumber)
      .ilike("employee_status", "Active");

    if (error) {
      console.error("Error fetching employee salaries:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      return;
    }

    const salaryMap = data.reduce((acc, emp) => {
      acc[emp.id] = { ...acc[emp.id], total_salary: emp.total_salary || 0 };
      return acc;
    }, {});
    setAllEmployeeData(salaryMap);
  };

  const fetchAllDraftData = async () => {
    const timesheet_month = `${year}-${month.padStart(2, "0")}-01`;
    const { data, error } = await supabase
      .from("timesheet_draft")
      .select(
        "employee_id, working_days, overtime_hrs, absent_hrs, incentive, etmam_cost, overtime, deductions, adjusted_salary, total_cost"
      )
      .eq("client_number", clientNumber)
      .eq("timesheet_month", timesheet_month);

    if (error) {
      console.error("Error fetching draft data:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      return;
    }

    console.log("Fetched draft data:", data);
    const draftMap = data.reduce(
      (acc, draft) => {
        acc[draft.employee_id] = {
          ...acc[draft.employee_id], // Preserve total_salary
          workingDays: draft.working_days ?? null,
          overtimeHrs: draft.overtime_hrs ?? null,
          absentHrs: draft.absent_hrs ?? null,
          incentive: draft.incentive ?? null,
          etmamCost: draft.etmam_cost ?? null,
          overtime: draft.overtime ?? null,
          deductions: draft.deductions ?? null,
          adjustedSalary: draft.adjusted_salary ?? null,
          totalCost: draft.total_cost ?? null,
        };
        return acc;
      },
      { ...allEmployeeData }
    );

    console.log("Draft map:", draftMap);
    setAllEmployeeData(draftMap);
  };

  const fetchAllTimesheetData = async () => {
    const timesheet_month = `${year}-${month.padStart(2, "0")}-01`;
    const { data, error } = await supabase
      .from("timesheet")
      .select(
        "employee_id, working_days, overtime_hrs, absent_hrs, incentive, etmam_cost, overtime, deductions, adjusted_salary, total_cost"
      )
      .eq("client_number", clientNumber)
      .eq("timesheet_month", timesheet_month);

    if (error) {
      console.error("Error fetching timesheet data:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      return;
    }

    console.log("Fetched timesheet data:", data);

    const timesheetMap = data.reduce(
      (acc, timesheet) => {
        acc[timesheet.employee_id] = {
          ...acc[timesheet.employee_id], // Preserve total_salary
          workingDays: timesheet.working_days ?? null,
          overtimeHrs: timesheet.overtime_hrs ?? null,
          absentHrs: timesheet.absent_hrs ?? null,
          incentive: timesheet.incentive ?? null,
          etmamCost: timesheet.etmam_cost ?? null,
          overtime: timesheet.overtime ?? null,
          deductions: timesheet.deductions ?? null,
          adjustedSalary: timesheet.adjusted_salary ?? null,
          totalCost: timesheet.total_cost ?? null,
        };
        return acc;
      },
      { ...allEmployeeData }
    );

    console.log("Timesheet map:", timesheetMap);
    setAllEmployeeData(timesheetMap);
    setIsSubmitted(data.length > 0);
  };

  const fetchEmployees = async () => {
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    const { count, data, error } = await supabase
      .from("employees")
      .select(
        "id, iqama_number, name, client_name, basic_salary, hra, tra, food_allowance, other_allowance, total_salary",
        { count: "exact" }
      )
      .eq("client_number", clientNumber)
      .ilike("employee_status", "Active")
      .range(from, to);

    if (error) {
      console.error("Error fetching employees:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      return;
    }

    setTotalCount(count);
    setClientName(data[0]?.client_name || "");
    const enriched = data.map((emp, index) => {
      const allowance =
        (emp.hra || 0) +
        (emp.tra || 0) +
        (emp.food_allowance || 0) +
        (emp.other_allowance || 0);
      const draft = allEmployeeData[emp.id] || {};
      return {
        ...emp,
        sNo: from + index + 1,
        allowance,
        workingDays: draft.workingDays ?? "",
        overtimeHrs: draft.overtimeHrs ?? "",
        absentHrs: draft.absentHrs ?? "",
        incentive: draft.incentive ?? "",
        etmamCost: draft.etmamCost ?? "",
        overtime: draft.overtime ?? 0,
        deductions: draft.deductions ?? 0,
        adjustedSalary: draft.adjustedSalary ?? 0,
        totalCost: draft.totalCost ?? 0,
      };
    });

    console.log("Enriched employees:", enriched);
    setEmployees(enriched);
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...employees];
    updated[index][field] = value === "" ? "" : Number(value);

    const basic_salary = parseFloat(updated[index].basic_salary || 0);
    const totalSalary = parseFloat(updated[index].total_salary || 0);
    const workingDays = parseFloat(updated[index].workingDays || 0);
    const overtimeHrs = parseFloat(updated[index].overtimeHrs || 0);
    const absentHrs = parseFloat(updated[index].absentHrs || 0);
    const incentive = parseFloat(updated[index].incentive || 0);
    const etmamCost = parseFloat(updated[index].etmamCost || 0);

    const dailyrate = totalSalary / 30;
    const hourlyRate = totalSalary / (30 * 8);
    const overtimehourlyRate = (basic_salary / 240) * 1.5;
    const overtime = overtimehourlyRate * overtimeHrs;
    const deductions = hourlyRate * absentHrs;
    const adjustedSalary =
      dailyrate * workingDays + overtime + incentive - deductions;
    const totalCost = adjustedSalary + etmamCost;

    updated[index].deductions = isNaN(deductions) ? "" : deductions.toFixed(2);
    updated[index].overtime = isNaN(overtime) ? "" : overtime.toFixed(2);
    updated[index].adjustedSalary = isNaN(adjustedSalary)
      ? ""
      : adjustedSalary.toFixed(2);
    updated[index].totalCost = isNaN(totalCost) ? "" : totalCost.toFixed(2);

    setAllEmployeeData((prev) => ({
      ...prev,
      [updated[index].id]: {
        ...prev[updated[index].id],
        workingDays: updated[index].workingDays,
        overtimeHrs: updated[index].overtimeHrs,
        absentHrs: updated[index].absentHrs,
        incentive: updated[index].incentive,
        etmamCost: updated[index].etmamCost,
        overtime: updated[index].overtime,
        deductions: updated[index].deductions,
        adjustedSalary: updated[index].adjustedSalary,
        totalCost: updated[index].totalCost,
        total_salary: updated[index].total_salary, // Ensure total_salary is preserved
      },
    }));

    setEmployees(updated);
  };

  const handleSaveDraft = async () => {
    if (!month || !year) {
      alert("Missing month, or year from URL");
      return;
    }

    const timesheet_month = `${year}-${month.padStart(2, "0")}-01`;

    const draftData = employees.map((emp) => ({
      employee_id: emp.id,
      client_number: clientNumber,
      timesheet_month,
      working_days:
        emp.workingDays === "" ? null : parseFloat(emp.workingDays) || 0,
      overtime_hrs:
        emp.overtimeHrs === "" ? null : parseFloat(emp.overtimeHrs) || 0,
      absent_hrs: emp.absentHrs === "" ? null : parseFloat(emp.absentHrs) || 0,
      incentive: emp.incentive === "" ? null : parseFloat(emp.incentive) || 0,
      etmam_cost: emp.etmamCost === "" ? null : parseFloat(emp.etmamCost) || 0,
      overtime: emp.overtime === "" ? null : parseFloat(emp.overtime) || 0,
      deductions:
        emp.deductions === "" ? null : parseFloat(emp.deductions) || 0,
      adjusted_salary:
        emp.adjustedSalary === "" ? null : parseFloat(emp.adjustedSalary) || 0,
      total_cost: emp.totalCost === "" ? null : parseFloat(emp.totalCost) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    console.log("Saving draft data:", draftData);

    const { error } = await supabase
      .from("timesheet_draft")
      .upsert(draftData, { onConflict: ["employee_id", "timesheet_month"] });

    if (error) {
      console.error("Error saving draft:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      alert(`Failed to save draft: ${error.message}`);
    } else {
      alert("Draft saved successfully");
      await fetchAllDraftData();
    }
  };

  const handleSubmitTimesheet = async () => {
    if (!month || !year) {
      alert("Missing month, or year from URL");
      return;
    }

    const timesheet_month = `${year}-${month.padStart(2, "0")}-01`;

    try {
      const { data: drafts, error: fetchError } = await supabase
        .from("timesheet_draft")
        .select("*")
        .eq("client_number", clientNumber)
        .eq("timesheet_month", timesheet_month);

      if (fetchError) {
        console.error("Error fetching draft data:", fetchError);
        alert("Failed to fetch draft data");
        return;
      }

      if (!drafts || drafts.length === 0) {
        alert("No draft data available to submit");
        return;
      }

      const { error: insertError } = await supabase
        .from("timesheet")
        .insert(drafts.map(({ id, ...rest }) => rest));

      if (insertError) {
        console.error("Error inserting into timesheet:", insertError);
        alert("Failed to submit timesheet");
        return;
      }

      const { error: deleteError } = await supabase
        .from("timesheet_draft")
        .delete()
        .eq("client_number", clientNumber)
        .eq("timesheet_month", timesheet_month);

      if (deleteError) {
        console.error("Error deleting draft data:", deleteError);
        alert("Failed to clear draft data");
        return;
      }

      alert("Timesheet submitted successfully!");
      setIsSubmitted(true);
      // Re-fetch all data in the correct order
      await fetchAllEmployeeSalaries();
      await fetchAllTimesheetData();
      await fetchEmployees();
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong while submitting timesheet");
    }
  };

  const renderInput = (emp, idx, field) => {
    const min = [
      "workingDays",
      "overtimeHrs",
      "absentHrs",
      "incentive",
    ].includes(field)
      ? 0
      : undefined;
    const max = field === "workingDays" ? 30 : undefined;
    const step = [
      "overtimeHrs",
      "absentHrs",
      "incentive",
      "etmamCost",
    ].includes(field)
      ? 0.1
      : 1;

    return (
      <input
        type="number"
        step={step}
        className="w-20 p-1 border rounded text-sm"
        value={emp[field] ?? ""}
        onChange={(e) => {
          let value = e.target.value;
          if (value === "") {
            handleInputChange(idx, field, "");
          } else {
            value = Number(value);
            if (field === "workingDays") {
              value = Math.max(0, Math.min(30, value));
            } else if (["overtimeHrs", "absentHrs"].includes(field)) {
              value = Math.max(0, value);
            }
            handleInputChange(idx, field, value);
          }
        }}
        min={min}
        max={max}
        disabled={isSubmitted}
      />
    );
  };

  const summaryTotals = Object.values(allEmployeeData).reduce(
    (acc, emp) => ({
      workingDays: acc.workingDays + parseFloat(emp.workingDays || 0),
      totalSalary: acc.totalSalary + parseFloat(emp.total_salary || 0),
      totalCost: acc.totalCost + parseFloat(emp.totalCost || 0),
    }),
    { workingDays: 0, totalSalary: 0, totalCost: 0 }
  );

  return (
    <div className="w-full mt-20 p-4 mb-10">
      <h1 className="text-2xl font-bold text-center mb-6">
        {clientName || "Loading..."} — Timesheet — {month}-{year}
      </h1>
      <div className="flex justify-center overflow-x-auto w-full">
        <table className="table-auto w-max border-collapse border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100">
              {[
                "S. No.",
                "Iqama",
                "Name",
                "Basic Salary",
                "Allowance",
                "Total Salary",
                "Working Days",
                "OT Hrs",
                "Overtime",
                "Absent Hrs",
                "Incentive",
                "Deductions",
                "Adjusted Salary",
                "Etmam Cost",
                "Total Cost",
              ].map((col) => (
                <th key={col} className="border p-1">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, idx) => (
              <tr key={emp.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-1 border text-center">{emp.sNo}</td>
                <td className="p-1 border">{emp.iqama_number}</td>
                <td className="p-1 border">{emp.name}</td>
                <td className="p-1 border text-center">{emp.basic_salary}</td>
                <td className="p-1 border text-center">{emp.allowance}</td>
                <td className="p-1 border text-center">{emp.total_salary}</td>
                <td className="p-1 border">
                  {renderInput(emp, idx, "workingDays")}
                </td>
                <td className="p-1 border">
                  {renderInput(emp, idx, "overtimeHrs")}
                </td>
                <td className="p-1 border text-center">{emp.overtime}</td>
                <td className="p-1 border">
                  {renderInput(emp, idx, "absentHrs")}
                </td>
                <td className="p-1 border">
                  {renderInput(emp, idx, "incentive")}
                </td>
                <td className="p-1 border text-center">{emp.deductions}</td>
                <td className="p-1 border text-center">{emp.adjustedSalary}</td>
                <td className="p-1 border">
                  {renderInput(emp, idx, "etmamCost")}
                </td>
                <td className="p-1 border text-center font-semibold">
                  {emp.totalCost}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center mt-4 space-x-1 flex-wrap">
        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        {Array.from(
          { length: Math.ceil(totalCount / pageSize) },
          (_, i) => i + 1
        ).map((pageNum) => (
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
        ))}
        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
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
      <div className="flex justify-center mt-6 space-x-4">
        <button
          onClick={handleSaveDraft}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded cursor-pointer disabled:opacity-50"
          disabled={isSubmitted}
        >
          Save
        </button>
        <button
          onClick={handleSubmitTimesheet}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded cursor-pointer disabled:opacity-50"
          disabled={isSubmitted}
        >
          Submit
        </button>
      </div>
      {isSubmitted && (
        <p className="text-center mt-4 text-green-600">
          Timesheet submitted successfully.
        </p>
      )}
      <div className="flex justify-center mt-10">
        <table className="table-auto border border-gray-300 text-sm">
          <tbody>
            <tr>
              <td
                rowSpan={5}
                className="border px-4 py-2 font-bold bg-gray-100"
              >
                Total
              </td>
              <td className="border px-4 py-2">Working Days</td>
              <td className="border px-4 py-2"></td>
              <td className="border px-4 py-2 text-right">
                {summaryTotals.workingDays.toFixed(0)}
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2">Salary</td>
              <td className="border px-4 py-2"></td>
              <td className="border px-4 py-2 text-right">
                {summaryTotals.totalSalary.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2">Cost</td>
              <td className="border px-4 py-2"></td>
              <td className="border px-4 py-2 text-right">
                {summaryTotals.totalCost.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2">VAT (15%)</td>
              <td className="border px-4 py-2"></td>
              <td className="border px-4 py-2 text-right">
                {(summaryTotals.totalCost * 0.15).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2 font-semibold">Grand Total</td>
              <td className="border px-4 py-2"></td>
              <td className="border px-4 py-2 text-right font-semibold">
                {(summaryTotals.totalCost * 1.15).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
