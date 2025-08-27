"use client";

import { useState, useEffect, useMemo } from "react";
import ExcelDownload from "@/component/ExcelDownload";
import { MdDelete } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import Link from "next/link";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [uniqueClientCount, setUniqueClientCount] = useState(0);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    document.title = "All Employees List";

    const fetchEmployees = async () => {
      setLoading(true);
      try {
        let url = `/api/employees?search=${encodeURIComponent(searchQuery)}&page=${currentPage}&pageSize=${pageSize}`;
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${document.cookie.replace(
              /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
              "$1"
            )}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch employees");
        }

        setEmployees(result.data || []);
        setSearchResultCount(result.data?.length || 0);
        setTotalCount(result.totalCount || 0);
        setUniqueClientCount(result.uniqueClientCount || 0);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);
        setEmployees([]);
        setTotalCount(0);
        setUniqueClientCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [currentPage, searchQuery]);

  const handleDelete = async (employee_id) => {
    const employee = employees.find((emp) => emp.id === employee_id);
    const employeeName = employee?.name || `ID ${employee_id}`;
    if (!window.confirm(`Are you sure you want to delete employee ${employeeName}?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      console.log("Deleting employee with ID:", employee_id, "Type:", typeof employee_id);
      const response = await fetch(`/api/employees?id=${employee_id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie.replace(
            /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
            "$1"
          )}`,
        },
      });

      const result = await response.json();
      console.log("Delete response:", result);

      if (!response.ok) {
        throw new Error(result.result || "Failed to delete employee");
      }

      setSuccess(`Employee ${employeeName} deleted successfully`);
      await fetchEmployees();
    } catch (err) {
      console.error("Delete error:", err.message);
      setError(err.message || "Failed to delete employee");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <>
      <div className="w-full pt-16 px-4 pb-4">
        <h2 className="text-2xl text-center font-semibold m-4">
          All Employee Details
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && (
          <p className="text-green-500 text-center mb-4">{success}</p>
        )}
        <div className="flex flex-wrap justify-center items-center mb-6 gap-4">
          <div className="flex gap-4 text-sm font-medium text-gray-700 whitespace-nowrap mr-20">
            <span>Total Clients: {uniqueClientCount}</span>
            <span>Total Employees: {totalCount}</span>
          </div>
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <IoSearch className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search employee by Name, ET No., IQAMA, etc."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <ExcelDownload data={computedEmployees} searchQuery={searchQuery} />
        </div>
        {loading ? (
          <div className="text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
            <p>Loading...</p>
          </div>
        ) : error ? (
          <p className="text-center text-red-500 mt-16">Error: {error}</p>
        ) : employees.length === 0 ? (
          <h2 className="text-center mt-20 text-lg text-gray-500">
            No employee! Add employee to see details here.
          </h2>
        ) : (
          <>
            {computedEmployees.length === 0 ? (
              <p className="text-center text-gray-500 text-sm mt-6">
                No results found for{" "}
                <span className="font-medium">{searchQuery}</span>
              </p>
            ) : (
              <>
                {searchQuery && (
                  <p className="text-center text-gray-500 text-sm mt-6">
                    Found {searchResultCount} employees matching{" "}
                    <span className="font-medium">{searchQuery}</span>
                  </p>
                )}
                <div className="overflow-x-auto w-full">
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
                          "Source",
                          "Actions",
                        ].map((header) => (
                          <th key={header} className="p-1 border">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {computedEmployees.map((employee, index) => (
                        <tr
                          key={employee.id}
                          className="odd:bg-white even:bg-gray-50"
                        >
                          <td className="p-1 border text-center">
                            {(currentPage - 1) * pageSize + index + 1}
                          </td>
                          <td className="p-1 border">{employee.et_number}</td>
                          <td className="p-1 border">
                            {employee.iqama_number}
                          </td>
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
                          <td className="p-1 border">
                            {employee.client_number}
                          </td>
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
                          <td className="p-1 border">
                            {employee.employee_source}
                          </td>
                          <td className="p-1 border flex items-center space-x-2">
                            <Link
                              href={`/operations/edit_employee/${employee.id}`}
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
                {totalCount > 0 &&
                  !searchQuery &&
                  (() => {
                    const totalPages = Math.ceil(totalCount / pageSize);
                    const pages = [];

                    if (totalPages > 0) pages.push(1);
                    if (currentPage > 4) pages.push("...");

                    for (
                      let i = Math.max(2, currentPage - 1);
                      i <= Math.min(totalPages - 1, currentPage + 1);
                      i++
                    ) {
                      pages.push(i);
                    }

                    if (currentPage + 2 < totalPages) pages.push("...");
                    if (totalPages > 1) pages.push(totalPages);

                    return (
                      <div className="flex justify-center items-center gap-1 mt-6 flex-wrap">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((prev) => prev - 1)}
                          className={`px-3 py-1 rounded ${
                            currentPage === 1
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                          }`}
                        >
                          Prev
                        </button>
                        {pages.map((page, idx) =>
                          page === "..." ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-2 py-1 text-gray-500"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 rounded cursor-pointer ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                              }`}
                            >
                              {page}
                            </button>
                          )
                        )}
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          className={`px-3 py-1 rounded ${
                            currentPage === totalPages
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    );
                  })()}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}