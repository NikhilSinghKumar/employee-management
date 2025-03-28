"use client";

import { useState, useEffect, useMemo } from "react";
import ExcelDownload from "@/component/ExcelDownload";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL + "/api/employees";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Failed to fetch employees");

        setEmployees(data.data || []);
      } catch (err) {
        setError(
          err?.message || "Something went wrong while fetching employees"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB");

  const computedEmployees = useMemo(() => {
    return employees.map((employee) => ({
      ...employee,
      totalAllowance: (
        Number(employee.hra || 0) +
        Number(employee.tra || 0) +
        Number(employee.food_allowance || 0) +
        Number(employee.other_allowance || 0)
      ).toFixed(2),
    }));
  }, [employees]);

  const handleEdit = (id) => {
    console.log("Edit Employee ID:", id);
  };

  const handleDelete = (id) => {
    console.log("Delete Employee ID:", id);
  };

  if (loading) return <p className="text-center text-lg mt-6">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500 mt-6">Error: {error}</p>;

  return (
    <>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold m-4">Employee List</h2>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="table-auto w-max border-collapse border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100">
                {[
                  "Sr. No.",
                  "ET No.",
                  "IQAMA No",
                  "Name",
                  "Passport No.",
                  "Profession",
                  "Nationality",
                  "Client No.",
                  "Client Name",
                  "Mobile",
                  "Email",
                  "Bank Account",
                  "Basic Salary",
                  "Allowance",
                  "Total Salary",
                  "Medical Type",
                  "Start Date",
                  "End Date",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th key={header} className="p-1 border">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="border border-red-500">
              {computedEmployees.map((employee, index) => (
                <tr key={employee.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-1 border">{index + 1}</td>
                  <td className="p-1 border">{employee.et_number}</td>
                  <td className="p-1 border">{employee.iqama_number}</td>
                  <td className="p-1 border">{employee.name}</td>
                  <td className="p-1 border">{employee.passport_number}</td>
                  <td className="p-1 border">{employee.profession}</td>
                  <td className="p-1 border">{employee.nationality}</td>
                  <td className="p-1 border">{employee.client_number}</td>
                  <td className="p-1 border">{employee.client_name}</td>
                  <td className="p-1 border">{employee.mobile}</td>
                  <td className="p-1 border">{employee.email}</td>
                  <td className="p-1 border">{employee.bank_account}</td>
                  <td className="p-1 border">{employee.basic_salary}</td>
                  <td className="p-1 border">{employee.totalAllowance}</td>
                  <td className="p-1 border">{employee.total_salary}</td>
                  <td className="p-1 border text-center">{employee.medical}</td>
                  <td className="p-1 border">
                    {formatDate(employee.contract_start_date)}
                  </td>
                  <td className="p-1 border">
                    {formatDate(employee.contract_end_date)}
                  </td>
                  <td className="p-1 border">{employee.employee_status}</td>
                  <td className="p-1 border">
                    <button
                      className="text-blue-500 hover:underline"
                      onClick={() => handleEdit(employee.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:underline ml-2"
                      onClick={() => handleDelete(employee.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ExcelDownload />
    </>
  );
}
