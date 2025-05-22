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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0); // Total employees (unchanged by search)
  const [uniqueClientCount, setUniqueClientCount] = useState(0);
  const [searchResultCount, setSearchResultCount] = useState(0); // Number of search results
  const pageSize = 20;

  useEffect(() => {
    document.title = "All Employees List";

    // Fetch total employee count and unique client count (runs only once or after delete)
    const fetchCounts = async () => {
      const { count, error: countError } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true }); // head: true avoids fetching data

      if (countError) {
        setError("Failed to fetch total employee count");
        console.error(countError);
      } else {
        setTotalCount(count || 0);
      }

      const { data: allClientsData, error: clientError } = await supabase
        .from("employees")
        .select("client_number");

      if (clientError) {
        console.error("Error fetching client numbers:", clientError.message);
      } else {
        const clientSet = new Set(
          allClientsData?.map((emp) => emp.client_number).filter(Boolean)
        );
        setUniqueClientCount(clientSet.size);
      }
    };

    // Fetch employees (paginated or search results)
    const fetchEmployees = async () => {
      setLoading(true);

      if (searchQuery) {
        // Search mode: Fetch all employees matching the search query
        const query = searchQuery.toLowerCase();
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .or(
            `name.ilike.%${query}%,et_number.ilike.%${query}%,iqama_number.ilike.%${query}%,passport_number.ilike.%${query}%,profession.ilike.%${query}%,nationality.ilike.%${query}%,client_number.ilike.%${query}%,client_name.ilike.%${query}%,mobile.ilike.%${query}%,email.ilike.%${query}%,bank_account.ilike.%${query}%,employee_status.ilike.%${query}%`
          )
          .order("id", { ascending: true });

        if (error) {
          setError("Failed to fetch employees");
          console.error(error);
        } else {
          setEmployees(data || []);
          setSearchResultCount(data?.length || 0); // Track search result count
        }
      } else {
        // Pagination mode: Fetch employees for the current page
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("id", { ascending: true })
          .range(from, to);

        if (error) {
          setError("Failed to fetch employees");
          console.error(error);
        } else {
          setEmployees(data || []);
          setSearchResultCount(data?.length || 0); // Reset search result count
        }
      }

      setLoading(false);
    };

    // Run both fetches
    fetchCounts();
    fetchEmployees();
  }, [currentPage, searchQuery]);

  const handleDelete = async (employee_id) => {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", employee_id);
    if (error) {
      console.error("Error deleting employee:", error.message);
    } else {
      setEmployees((prev) => prev.filter((emp) => emp.id !== employee_id));
      // Update totalCount and uniqueClientCount after delete
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });
      setTotalCount(count || 0);

      const { data: allClientsData } = await supabase
        .from("employees")
        .select("client_number");
      const clientSet = new Set(
        allClientsData?.map((emp) => emp.client_number).filter(Boolean)
      );
      setUniqueClientCount(clientSet.size);
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

  return (
    <>
      <div className="w-full pt-16 px-4 pb-4">
        <h2 className="text-2xl text-center font-semibold m-4">
          All Employee Details
        </h2>
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
                setCurrentPage(1); // Reset to first page on search
              }}
              placeholder="Search employee by Name, ET No., IQAMA, etc."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <ExcelDownload />
        </div>
        {loading ? (
          <p className="text-center text-lg mt-16">Loading...</p>
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
                {totalCount > 0 && !searchQuery && (
                  <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
                    {Array.from(
                      { length: Math.ceil(totalCount / pageSize) },
                      (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-3 py-1 rounded cursor-pointer ${
                            currentPage === i + 1
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
