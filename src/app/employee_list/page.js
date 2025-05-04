"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";
import ExcelDownload from "@/component/ExcelDownload";
import { MdDelete } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import Link from "next/link";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.title = "All Employees List";
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from("employees").select("*");
      if (error) {
        setError("Failed to fetch employees");
        console.error(error);
      } else {
        setEmployees(data || []);
      }
      setLoading(false);
    };

    fetchEmployees();
  }, []);

  const handleDelete = async (id) => {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      console.error("Error deleting employee:", error.message);
    } else {
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    }
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-GB") : "";

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

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return computedEmployees;

    const query = searchQuery.toLowerCase();
    return computedEmployees.filter((employee) => {
      const fields = [
        employee.name,
        employee.et_number,
        employee.iqama_number,
        employee.passport_number,
        employee.profession,
        employee.nationality,
        employee.client_number,
        employee.client_name,
        employee.mobile,
        employee.email,
        employee.bank_account,
        employee.employee_status,
      ];

      return fields.some((field) =>
        String(field ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [computedEmployees, searchQuery]);

  if (loading)
    return <p className="text-center text-lg mt-6 pt-20">Loading...</p>;
  if (error)
    return (
      <p className="text-center text-red-500 mt-6 pt-20">Error: {error}</p>
    );

  return (
    <>
      <div className="container mx-auto pt-16 px-4 pb-4">
        {employees.length === 0 ? (
          <h2 className="text-center mt-20 text-lg text-gray-500">
            No employee! Add employee to see details here.
          </h2>
        ) : (
          <>
            <h2 className="text-2xl text-center font-semibold m-4">
              All Employee Details
            </h2>
            <div className="flex flex-wrap justify-center items-center mb-6 gap-4">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <IoSearch className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employee by Name, ET No., IQAMA, etc."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <ExcelDownload />
            </div>

            {filteredEmployees.length === 0 ? (
              <p className="text-center text-gray-500 text-sm mt-6">
                No results found for{" "}
                <span className="font-medium">{searchQuery}</span>
              </p>
            ) : (
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
                  <tbody>
                    {filteredEmployees.map((employee, index) => (
                      <tr
                        key={employee.id}
                        className="odd:bg-white even:bg-gray-50"
                      >
                        <td className="p-1 border text-center">{index + 1}</td>
                        <td className="p-1 border">{employee.et_number}</td>
                        <td className="p-1 border">{employee.iqama_number}</td>
                        <td className="p-1 border">{employee.name}</td>
                        <td className="p-1 border text-center">
                          {employee.passport_number}
                        </td>
                        <td className="p-1 border text-center">
                          {employee.profession}
                        </td>
                        <td className="p-1 border text-center">
                          {employee.nationality}
                        </td>
                        <td className="p-1 border">{employee.client_number}</td>
                        <td className="p-1 border text-center">
                          {employee.client_name}
                        </td>
                        <td className="p-1 border">{employee.mobile}</td>
                        <td className="p-1 border">{employee.email}</td>
                        <td className="p-1 border text-center">
                          {employee.bank_account}
                        </td>
                        <td className="p-1 border text-center">
                          {employee.basic_salary}
                        </td>
                        <td className="p-1 border text-center">
                          {employee.totalAllowance}
                        </td>
                        <td className="p-1 border text-center">
                          {employee.total_salary}
                        </td>
                        <td className="p-1 border text-center">
                          {employee.medical}
                        </td>
                        <td className="p-1 border">
                          {formatDate(employee.contract_start_date)}
                        </td>
                        <td className="p-1 border">
                          {formatDate(employee.contract_end_date)}
                        </td>
                        <td className="p-1 border">
                          {employee.employee_status}
                        </td>
                        <td className="p-1 border flex items-center space-x-2">
                          <Link
                            href={`/edit_employee/${employee.id}`}
                            className="text-blue-500 cursor-pointer hover:text-blue-700 hover:scale-110 transition-transform duration-200"
                          >
                            <FaRegEdit />
                          </Link>
                          <button
                            className="text-red-500 cursor-pointer hover:text-red-600 hover:scale-110 transition-transform duration-200"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <MdDelete />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
