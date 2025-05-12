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

  useEffect(() => {
    if (clientNumber) {
      fetchEmployees();
    }
  }, [clientNumber]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select(
        "id, iqama_number, name, client_name, basic_salary, hra, tra, food_allowance, other_allowance, total_salary"
      )
      .eq("client_number", clientNumber)
      .ilike("employee_status", "Active");

    if (error) {
      console.error("Error fetching employees:", error);
    } else {
      setClientName(data[0]?.client_name || "");
      const enriched = data.map((emp, index) => {
        const allowance =
          (emp.hra || 0) +
          (emp.tra || 0) +
          (emp.food_allowance || 0) +
          (emp.other_allowance || 0);
        return {
          ...emp,
          sNo: index + 1,
          allowance,
          workingDays: "",
          overtime: "",
          absent: "",
          incentive: "",
          etmamCost: "",
          deductions: 0,
          adjustedSalary: 0,
          total: 0,
        };
      });
      setEmployees(enriched);
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...employees];
    updated[index][field] = value;

    const totalSalary = parseFloat(updated[index].total_salary || 0);
    const workingDays = parseFloat(updated[index].workingDays || 0);
    const overtime = parseFloat(updated[index].overtime || 0);
    const absent = parseFloat(updated[index].absent || 0);
    const incentive = parseFloat(updated[index].incentive || 0);
    const etmamCost = parseFloat(updated[index].etmamCost || 0);

    const dailyRate = totalSalary / 30;
    const deductions = dailyRate * absent;
    const adjustedSalary =
      dailyRate * workingDays + overtime + incentive - deductions;
    const total = adjustedSalary + etmamCost;

    updated[index].deductions = deductions.toFixed(2);
    updated[index].adjustedSalary = adjustedSalary.toFixed(2);
    updated[index].total = total.toFixed(2);

    setEmployees(updated);
  };

  const renderInput = (emp, idx, field) => (
    <input
      type="number"
      step={["overtime", "incentive", "etmamCost"].includes(field) ? 0.1 : 1}
      className="w-20 p-1 border rounded text-sm"
      value={emp[field]}
      onChange={(e) => handleInputChange(idx, field, e.target.value)}
    />
  );

  return (
    <div className="w-full mt-24 p-4 mb-10">
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
                "Overtime",
                "Absent",
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
                  {renderInput(emp, idx, "overtime")}
                </td>
                <td className="p-1 border">
                  {renderInput(emp, idx, "absent")}
                </td>
                <td className="p-1 border">
                  {renderInput(emp, idx, "incentive")}
                </td>

                <td className="p-1 border text-center">{emp.deductions}</td>
                <td className="p-1 border text-center">{emp.adjustedSalary}</td>

                <td className="p-1 border">
                  {renderInput(emp, idx, "etmamCost")}
                </td>
                <td className="p-1 border text-center">{emp.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
