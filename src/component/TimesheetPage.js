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
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  useEffect(() => {
    if (clientNumber) {
      fetchEmployees();
    }
  }, [clientNumber, currentPage]);

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
      console.error("Error fetching employees:", error);
    } else {
      setTotalCount(count);
      setClientName(data[0]?.client_name || "");
      const enriched = data.map((emp, index) => {
        const allowance =
          (emp.hra || 0) +
          (emp.tra || 0) +
          (emp.food_allowance || 0) +
          (emp.other_allowance || 0);
        return {
          ...emp,
          sNo: from + index + 1,
          allowance,
          workingDays: "",
          overtime: 0,
          absentHrs: "",
          incentive: "",
          etmamCost: "",
          deductions: 0,
          adjustedSalary: 0,
          totalCost: 0,
        };
      });
      setEmployees(enriched);
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...employees];
    updated[index][field] = value;

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

    updated[index].deductions = deductions.toFixed(2);
    updated[index].overtime = overtime.toFixed(2);
    updated[index].adjustedSalary = adjustedSalary.toFixed(2);
    updated[index].totalCost = totalCost.toFixed(2);

    setEmployees(updated);
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
        value={emp[field]}
        onChange={(e) => {
          let value = Number(e.target.value);

          if (field === "workingDays") {
            value = Math.max(0, Math.min(30, value));
          } else if (["overtimeHrs", "absentHrs"].includes(field)) {
            value = Math.max(0, value);
          }

          handleInputChange(idx, field, value);
        }}
        min={min}
        max={max}
      />
    );
  };

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
      {/* Summary Table */}
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
                {employees.reduce(
                  (sum, emp) => sum + parseFloat(emp.workingDays || 0),
                  0
                )}
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2">Salary</td>
              <td className="border px-4 py-2"></td>
              <td className="border px-4 py-2 text-right">
                {employees
                  .reduce(
                    (sum, emp) => sum + parseFloat(emp.total_salary || 0),
                    0
                  )
                  .toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2">Cost</td>
              <td className="border px-4 py-2"></td>
              <td className="border px-4 py-2 text-right">
                {employees
                  .reduce((sum, emp) => sum + parseFloat(emp.total || 0), 0)
                  .toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2">VAT (15%)</td>
              <td className="border px-4 py-2"></td>
              <td className="border px-4 py-2 text-right">
                {(
                  employees.reduce(
                    (sum, emp) => sum + parseFloat(emp.total || 0),
                    0
                  ) * 0.15
                ).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2 font-semibold">Grand Total</td>
              <td className="border px-4 py-2"></td>
              <td className="border px-4 py-2 text-right font-semibold">
                {(
                  employees.reduce(
                    (sum, emp) => sum + parseFloat(emp.total || 0),
                    0
                  ) * 1.15
                ).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
