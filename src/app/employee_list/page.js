"use client";

import { useState, useEffect } from "react";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem("token");
      console.log("Token from localStorage:", token);
      if (!token) {
        setError("Unauthorized Access: Please login first.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("http://localhost:3000/api/employees", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Failed to fetch employees");

        setEmployees(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);
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
                <th className="p-1 border">Sr. No.</th>
                <th className="p-1 border">ET No.</th>
                <th className="p-1 border">IQAMA No</th>
                <th className="p-1 border">Name</th>
                <th className="p-1 border">Passport No.</th>
                <th className="p-1 border">Profession</th>
                <th className="p-1 border">Nationality</th>
                <th className="p-1 border">Client No.</th>
                <th className="p-1 border">Client Name</th>
                <th className="p-1 border">Mobile</th>
                <th className="p-1 border">Email</th>
                <th className="p-1 border">Bank Account</th>
                <th className="p-1 border">Basic Salary</th>
                <th className="p-1 border">Allowance</th>
                <th className="p-1 border">Total Salary</th>
                <th className="p-1 border">Medical Type</th>
                <th className="p-1 border">Start Date</th>
                <th className="p-1 border">End Date</th>
                <th className="p-1 border">Status</th>
                <th className="p-1 border">Setting</th>
              </tr>
            </thead>
            <tbody className="border border-red-500">
              {employees.map((employee) => (
                <tr key={employee.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-1 border">{employee.id}</td>
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
                  <td className="p-1 border">
                    {(
                      Number(employee.hra || 0) +
                      Number(employee.tra || 0) +
                      Number(employee.food_allowance || 0) +
                      Number(employee.other_allowance || 0)
                    ).toFixed(2)}
                  </td>
                  <td className="p-1 border">{employee.total_salary}</td>
                  <td className="p-1 border text-center">{employee.medical}</td>
                  <td className="p-1 border">
                    {new Date(employee.contract_start_date).toLocaleDateString(
                      "en-GB"
                    )}
                  </td>
                  <td className="p-1 border">
                    {new Date(employee.contract_end_date).toLocaleDateString(
                      "en-GB"
                    )}
                  </td>
                  <td className="p-1 border">{employee.employee_status}</td>
                  <td className="p-1 border">
                    <span className="p-1">Edit</span>
                    <span className="p-1">Delete</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
