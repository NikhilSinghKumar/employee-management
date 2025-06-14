"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function ClientTimesheetPage() {
  const { client_number, year, month } = useParams();
  const [timesheetData, setTimesheetData] = useState([]);
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    async function fetchTimesheetData() {
      const fromDate = `${year}-${month}-01`;
      const toDate = `${year}-${month}-31`;

      const { data, error } = await supabase
        .from("generated_timesheet")
        .select(
          `
    *,
    employees!inner(name, client_name, iqama_number, client_number, hra, tra, food_allowance, other_allowance)
  `
        )
        .eq("timesheet_month", fromDate)
        .eq("employees.client_number", client_number);

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      setTimesheetData(data || []);

      // Get client name from first employee (assuming all are same client)
      if (data && data.length > 0) {
        setClientName(data[0].employees.client_name);
      }
    }

    fetchTimesheetData();
  }, [client_number, year, month]);

  const monthYear = `${month}-${year}`;

  return (
    <div className="p-8 mt-20">
      <h1 className="text-2xl font-bold text-center mb-6">
        {clientName || "Loading..."} — Timesheet — {month}-{year}
      </h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
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
              <th className="border px-4 py-2">Incentives</th>
              <th className="border px-4 py-2">Deductions</th>
              <th className="border px-4 py-2">Adjusted Salary</th>
              <th className="border px-4 py-2">Etmam Cost</th>
              <th className="border px-4 py-2">Net Cost</th>
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
                    SAR {(item.basic_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">
                    SAR {allowance.toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">
                    SAR {(item.total_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {item.working_days}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {item.overtime_hrs}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {item.absent_hrs}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    SAR {(item.incentive ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">
                    SAR {(item.deductions ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">
                    SAR {(item.adjusted_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">
                    SAR {(item.etmam_cost ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2 font-semibold">
                    SAR {(item.net_cost ?? 0).toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {timesheetData.length === 0 && (
              <tr>
                <td colSpan="14" className="text-center py-4">
                  No timesheet data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
