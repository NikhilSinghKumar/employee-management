"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";
import { calculateGrandTotal } from "@/utils/calculateGrandTotal";

const ClientTimesheetPage = () => {
  const [clientNumbers, setClientNumbers] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [allSummaryData, setAllSummaryData] = useState([]); // Store all grouped data
  const [summaryData, setSummaryData] = useState([]); // Paginated data
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const router = useRouter();

  const pageSize = 10;

  useEffect(() => {
    const fetchClientNumbers = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("client_number")
        .neq("client_number", null)
        .order("client_number", { ascending: true });

      if (error) {
        console.error("Error fetching client numbers:", error.message);
        return;
      }

      const uniqueClients = [...new Set(data.map((emp) => emp.client_number))];
      setClientNumbers(uniqueClients);
    };

    fetchClientNumbers();
  }, []);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  useEffect(() => {
    // Paginate the grouped data on the client side
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    const paginatedData = allSummaryData.slice(from, to + 1);
    setSummaryData(paginatedData);
  }, [currentPage, allSummaryData]);

  const fetchSummaryData = async () => {
    // Fetch all data (or filter by month/year if provided)
    let query = supabase
      .from("timesheet")
      .select(
        `
        client_number,
        timesheet_month,
        total_cost,
        employee_id,
        employees(client_name)
      `
      )
      .order("timesheet_month", { ascending: false })
      .order("client_number", { ascending: true });

    if (month && year) {
      const timesheetMonthStart = `${year}-${month.padStart(2, "0")}-01`;
      const timesheetMonthEnd = `${year}-${month.padStart(2, "0")}-31`;
      query = query
        .gte("timesheet_month", timesheetMonthStart)
        .lte("timesheet_month", timesheetMonthEnd);
    }

    if (selectedClient) {
      query = query.eq("client_number", selectedClient);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching timesheet summary:", error.message);
      return;
    }

    // Group data by client_number, year, month
    const groupedData = data.reduce((acc, row) => {
      const timesheetDate = new Date(row.timesheet_month);
      const month = timesheetDate.getMonth() + 1;
      const year = timesheetDate.getFullYear();
      const key = `${row.client_number}-${year}-${month}`;

      if (!acc[key]) {
        acc[key] = {
          client_number: row.client_number,
          client_name: row.employees?.client_name || "Unknown",
          month: month.toString().padStart(2, "0"),
          year: year.toString(),
          employee_ids: new Set(),
          employeeData: {},
        };
      }

      acc[key].employee_ids.add(row.employee_id);
      acc[key].employeeData[row.employee_id] = {
        totalCost: row.total_cost || 0,
      };

      return acc;
    }, {});

    const rows = Object.values(groupedData).map((group) => {
      const { grandTotal } = calculateGrandTotal(group.employeeData);
      return {
        client_number: group.client_number,
        client_name: group.client_name,
        month: group.month,
        year: group.year,
        total_employees: group.employee_ids.size,
        grand_total: grandTotal,
        status: "Submitted",
      };
    });

    setAllSummaryData(rows);
    setTotalPages(Math.ceil(rows.length / pageSize));
    // Initial pagination
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    setSummaryData(rows.slice(from, to + 1));
  };

  const handleSubmit = () => {
    if (selectedClient && month && year) {
      router.push(
        `/timesheet?client=${selectedClient}&month=${month}&year=${year}`
      );
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

        {/* Submit Button */}
        <div className="ml-4">
          <button
            onClick={handleSubmit}
            disabled={!selectedClient || !month || !year}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            Generate Timesheet
          </button>
        </div>
      </div>

      {/* Summary Table */}
      <div className="w-full mt-20 p-4 mb-10">
        <h1 className="text-2xl font-bold text-center mb-6">
          Timesheet Summary
        </h1>
        <div className="flex justify-center overflow-x-auto w-full">
          <table className="table-auto w-max border-collapse border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100">
                {[
                  "S. No.",
                  "Client Number",
                  "Client Name",
                  "Month",
                  "Year",
                  "Total Employees",
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
                  key={`${row.client_number}-${row.year}-${row.month}`}
                  className="odd:bg-white even:bg-gray-50"
                >
                  <td className="p-2 border text-center">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="p-2 border">{row.client_number}</td>
                  <td className="p-2 border">{row.client_name}</td>
                  <td className="p-2 border">{row.month}</td>
                  <td className="p-2 border">{row.year}</td>
                  <td className="p-2 border text-center">
                    {row.total_employees}
                  </td>
                  <td className="p-2 border text-right">
                    {row.grand_total.toFixed(2)}
                  </td>
                  <td className="p-2 border text-center">
                    <Link
                      href={`/timesheet?client=${row.client_number}&month=${row.month}&year=${row.year}`}
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

        {/* Pagination */}
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
            onClick={() => setCurrentPage((p) => (p < totalPages ? p + 1 : p))}
            disabled={currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientTimesheetPage;
