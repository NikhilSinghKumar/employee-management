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
        .eq("employees.client_number", client_number);

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
                    {item.working_days}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {item.overtime_hrs}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {item.absent_hrs}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {item.overtime}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {(item.incentive ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">
                    {(item.deductions ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">
                    {(item.adjusted_salary ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">
                    {(item.etmam_cost ?? 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2 font-semibold">
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
