"use client";

import { useState, useEffect, useMemo } from "react";
import ExcelDownload from "@/component/ExcelDownload";
import { IoSearch } from "react-icons/io5";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import ChangeStatusModal from "@/component/operations_action/ChangeStatusModal";

// Debounce hook
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
};

// Shimmer skeleton for loading
const TableSkeleton = () => (
  <div className="space-y-4 my-4 animate-pulse">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="p-4 border rounded-lg bg-gray-100/60">
        <div className="h-4 w-1/3 bg-gray-300 rounded mb-3"></div>
        <div className="h-3 w-2/3 bg-gray-300 rounded mb-2"></div>
        <div className="h-3 w-1/2 bg-gray-300 rounded"></div>
      </div>
    ))}
  </div>
);

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [uniqueClientCount, setUniqueClientCount] = useState(0);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const pageSize = 10;

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch Employees
  const fetchEmployees = async () => {
    if (debouncedSearch.trim()) setSearching(true);
    else setSearching(false);

    setLoading(true);
    try {
      const url = `/api/employees?search=${encodeURIComponent(
        debouncedSearch
      )}&page=${currentPage}&pageSize=${pageSize}`;

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
      if (!response.ok)
        throw new Error(result.error || "Failed to fetch employees");

      setEmployees(result.data || []);
      setSearchResultCount(result.data?.length || 0);
      setTotalCount(result.totalCount || 0);
      setUniqueClientCount(result.uniqueClientCount || 0);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch employees");
      setEmployees([]);
      setTotalCount(0);
      setUniqueClientCount(0);
    } finally {
      setLoading(false);
      setTimeout(() => setSearching(false), 400);
    }
  };

  useEffect(() => {
    document.title = "All Employees List";
  }, []);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch]);

  const handleDelete = async (employee_id) => {
    const employee = employees.find((emp) => emp.id === employee_id);
    const employeeName = employee?.name || `ID ${employee_id}`;
    if (!window.confirm(`Delete employee ${employeeName}?`)) return;

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

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
      if (!response.ok)
        throw new Error(result.result || "Failed to delete employee");

      setSuccess(`Employee ${employeeName} deleted successfully`);
      await fetchEmployees();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete employee");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 2500);
      return () => clearTimeout(t);
    }
  }, [success]);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-GB") : "";

  const computedEmployees = useMemo(
    () =>
      employees.map((employee) => ({
        ...employee,
        totalAllowance: (
          Number(employee.hra || 0) +
          Number(employee.tra || 0) +
          Number(employee.food_allowance || 0) +
          Number(employee.other_allowance || 0)
        ).toFixed(2),
      })),
    [employees]
  );

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <>
      <div className="w-full p-2">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          👨🏻‍💻 All Employee Details
        </h2>

        {/* Feedback */}
        {error && (
          <div className="mx-auto w-fit bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm border border-red-200 shadow-sm">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mx-auto w-fit bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm border border-green-200 shadow-sm">
            ✅ {success}
          </div>
        )}

        {/* Stats + Search */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
          <div className="flex gap-4 text-sm font-medium text-gray-700 whitespace-nowrap">
            <span>Total Clients: {uniqueClientCount}</span>
            <span>Total Employees: {totalCount}</span>
          </div>

          {/* Search Bar */}
          <div className="relative w-[85%] sm:w-72 md:w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
              <IoSearch className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Name, ET No., IQAMA, etc."
              className={`w-full pl-10 pr-10 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 text-sm transition-all ${
                searching
                  ? "border-blue-400 ring-2 ring-blue-300"
                  : "border-gray-300 focus:ring-[#4A5A6A]/60"
              }`}
            />

            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}

            {searching && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2 animate-spin text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              </div>
            )}
          </div>

          <ExcelDownload
            data={computedEmployees}
            searchQuery={debouncedSearch}
          />
        </div>

        {/* Search Feedback Text */}
        {debouncedSearch && !loading && (
          <div className="text-center text-gray-500 text-sm mt-1">
            {searching ? (
              <span className="animate-pulse">Searching...</span>
            ) : searchResultCount > 0 ? (
              <>
                Found <span className="font-medium">{searchResultCount}</span>{" "}
                results for{" "}
                <span className="font-medium">{debouncedSearch}</span>
              </>
            ) : (
              <span className="text-gray-400">
                No matches found for{" "}
                <span className="font-medium">{debouncedSearch}</span>
              </span>
            )}
          </div>
        )}

        {/* Loading / Empty / Table */}
        {loading ? (
          <div className="max-w-6xl mx-auto mt-6 p-4 border border-gray-200 rounded-lg">
            <TableSkeleton />
          </div>
        ) : employees.length === 0 ? (
          <h2 className="text-center mt-12 text-gray-500 text-lg">
            {debouncedSearch
              ? "No matching employees found."
              : "No employees found. Add one to see details here."}
          </h2>
        ) : (
          <>
            <div className="overflow-x-auto w-full fade-in">
              <table className="table-auto min-w-full border-collapse border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      "S.N.",
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
                      <th key={header} className="p-2 border font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {computedEmployees.map((employee, index) => (
                    <tr
                      key={employee.id}
                      className="odd:bg-white even:bg-gray-50 transition-all hover:bg-blue-50/40"
                    >
                      <td className="p-2 border text-center  w-16">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="p-2 border  w-28 truncate">
                        {employee.et_number}
                      </td>
                      <td className="p-2 border  w-28 truncate">
                        {employee.iqama_number}
                      </td>
                      <td className="p-2 border  break-words max-w-[180px]">
                        {employee.name}
                      </td>
                      <td className="p-2 border  truncate text-center">
                        {employee.passport_number}
                      </td>
                      <td className="p-2 border  truncate text-center">
                        {employee.profession}
                      </td>
                      <td className="p-2 border  truncate text-center">
                        {employee.nationality}
                      </td>
                      <td className="p-2 border  truncate">
                        {employee.client_number}
                      </td>
                      <td className="p-2 border  break-words max-w-[160px]">
                        {employee.client_name}
                      </td>
                      <td className="p-2 border  truncate">
                        {employee.mobile}
                      </td>
                      <td className="p-2 border  break-words max-w-[200px]">
                        {employee.email}
                      </td>
                      <td className="p-2 border  break-words max-w-[220px]">
                        {employee.bank_account}
                      </td>
                      <td className="p-2 border  truncate text-center">
                        {employee.basic_salary}
                      </td>
                      <td className="p-2 border  truncate text-center">
                        {employee.totalAllowance}
                      </td>
                      <td className="p-2 border  truncate text-center">
                        {employee.total_salary}
                      </td>
                      <td className="p-2 border  truncate text-center">
                        {employee.medical}
                      </td>
                      <td className="p-2 border  truncate">
                        {formatDate(employee.contract_start_date)}
                      </td>
                      <td className="p-2 border  truncate">
                        {formatDate(employee.contract_end_date)}
                      </td>
                      <td className="p-2 border  truncate">
                        {employee.employee_status}
                      </td>
                      <td className="p-2 border  truncate">
                        {employee.employee_source}
                      </td>
                      {/* <td className="p-2 border ">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/dashboard/operations/edit_employee/${employee.id}`}
                          className="text-blue-500 hover:text-blue-700 hover:scale-110 transition-transform duration-200"
                        >
                          <FaRegEdit />
                        </Link>
                        <button
                          className="text-red-500 hover:text-red-600 hover:scale-110 transition-transform duration-200"
                          onClick={() => handleDelete(employee.id)}
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td> */}
                      <td className="p-2 border text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-8 w-8 p-0 flex items-center justify-center"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-40">
                            {/* Edit */}
                            <DropdownMenuItem
                              onClick={() =>
                                (window.location.href = `/dashboard/operations/edit_employee/${employee.id}`)
                              }
                              className="cursor-pointer"
                            >
                              ✏️ Edit
                            </DropdownMenuItem>

                            {/* Change Status */}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setStatusModalOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              🔄 Change Status
                            </DropdownMenuItem>

                            {/* Delete */}
                            <DropdownMenuItem
                              onClick={() => handleDelete(employee.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              🗑️ Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
                      disabled={
                        currentPage === Math.ceil(totalCount / pageSize)
                      }
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className={`px-3 py-1 rounded ${
                        currentPage === Math.ceil(totalCount / pageSize)
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
      </div>
      <ChangeStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        employee={selectedEmployee}
        onSuccess={fetchEmployees}
      />
    </>
  );
}
