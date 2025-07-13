"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function ClientTimesheetPage() {
  const { client_number, year, month } = useParams();
  const [timesheetData, setTimesheetData] = useState([]);
  const [clientName, setClientName] = useState("");
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    async function fetchTimesheetData() {
      const fromDate = `${year}-${month}-01`;

      const { data, error } = await supabase
        .from("generated_timesheet")
        .select(
          `
    *,
    employees!inner(name, client_name, iqama_number, client_number, hra, tra, food_allowance, other_allowance)
  `
        )
        .eq("timesheet_month", fromDate)
        .eq("employees.client_number", client_number)
        .order("iqama_number", { ascending: true });

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      setTimesheetData(data || []);
      if (data && data.length > 0) {
        setClientName(data[0].employees.client_name);
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
      } else {
        setSummaryData(data);
      }
    }

    fetchTimesheetData();
    fetchSummaryData();
  }, [client_number, year, month]);

  const monthYear = `${month}-${year}`;

  return (
    <div className="p-8 mt-20">
      <h1 className="text-2xl font-bold text-center mb-6">
        {clientName || "Loading..."} — Timesheet — {month}-{year}
      </h1>

      {/* Main Timesheet Table */}
      <div className="w-full overflow-x-auto">
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
              <th className="table-cell-style table-cell-center">Allowance</th>
              <th className="table-cell-style table-cell-center">
                Total Salary
              </th>
              <th className="table-cell-style table-cell-center">
                Working Days
              </th>
              <th className="table-cell-style table-cell-center">
                Overtime Hrs
              </th>
              <th className="table-cell-style table-cell-center">Absent Hrs</th>
              <th className="table-cell-style table-cell-center">Overtime</th>
              <th className="table-cell-style table-cell-center">Incentives</th>
              <th className="table-cell-style table-cell-center">Penalty</th>
              <th className="table-cell-style table-cell-center">Deductions</th>
              <th className="table-cell-style table-cell-center">
                Adjusted Salary
              </th>
              <th className="table-cell-style table-cell-center">Etmam Cost</th>
              <th className="table-cell-style table-cell-center font-bold">
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
                    {index + 1}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {item.employees.iqama_number}
                  </td>
                  <td className="table-cell-style table-cell-left">
                    {item.employees.name}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {(item.basic_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {allowance.toFixed(2)}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {(item.total_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {item.working_days}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {item.overtime_hrs}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {item.absent_hrs}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {item.overtime}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {(item.incentive ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {(item.penalty ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {(item.deductions ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {(item.adjusted_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style table-cell-center">
                    {(item.etmam_cost ?? 0).toFixed(2)}
                  </td>
                  <td className="table-cell-style table-cell-center font-bold">
                    {(item.total_cost ?? 0).toFixed(2)}
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

      {/* ✅ Timesheet Summary Table */}
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
                <th className="border px-4 py-2 font-bold">Grand Total</th>
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
