"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL + "/api/employees";

// Format ISO date to DD-MM-YYYY for display
function formatDateToDDMMYYYY(isoDate) {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Convert DD-MM-YYYY back to YYYY-MM-DD for MySQL
function formatDateToYYYYMMDD(dateStr) {
  const [day, month, year] = dateStr.split("-");
  return `${year}-${month}-${day}`;
}

export default function EditEmployeePage() {
  const params = useParams();
  const id = params?.id;
  const [employee, setEmployee] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    async function fetchEmployee() {
      try {
        const res = await fetch(`${API_URL}/${id}`, {
          // Use /id directly for cleaner API design
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        // Expecting data.data to be a single object, not an array
        if (
          data.data &&
          typeof data.data === "object" &&
          !Array.isArray(data.data)
        ) {
          setEmployee({
            ...data.data,
            dob: formatDateToDDMMYYYY(data.data.dob),
            iqama_expiry_date: formatDateToDDMMYYYY(
              data.data.iqama_expiry_date
            ),
            passport_expiry_date: formatDateToDDMMYYYY(
              data.data.passport_expiry_date
            ),
            contract_start_date: formatDateToDDMMYYYY(
              data.data.contract_start_date
            ),
            contract_end_date: formatDateToDDMMYYYY(
              data.data.contract_end_date
            ),
          });
        } else if (Array.isArray(data.data) && data.data.length > 0) {
          setEmployee(data.data[0]); // Fallback if API returns an array
        } else {
          console.error("Unexpected employee format:", data);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    }

    fetchEmployee();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    const updatedEmployee = {
      ...employee,
      dob: formatDateToYYYYMMDD(employee.dob),
      iqama_expiry_date: formatDateToYYYYMMDD(employee.iqama_expiry_date),
      passport_expiry_date: formatDateToYYYYMMDD(employee.passport_expiry_date),
      contract_start_date: formatDateToYYYYMMDD(employee.contract_start_date),
      contract_end_date: formatDateToYYYYMMDD(employee.contract_end_date),
    };
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEmployee),
        credentials: "include",
      });
      if (res.ok) router.push("/employee_list");
      else console.error("Update failed:", await res.text());
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!id) return <div>Loading ID...</div>;
  if (!employee) return <div>Loading employee...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Edit Employee</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <label className="font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={employee.name || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Mobile</label>
          <input
            type="text"
            name="mobile"
            value={employee.mobile || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Email</label>
          <input
            type="text"
            name="email"
            value={employee.email || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">DOB</label>
          <input
            type="text"
            name="dob"
            value={employee.dob || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Et No.</label>
          <input
            type="text"
            name="et_number"
            value={employee.et_number || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Iqama No.</label>
          <input
            type="text"
            name="iqama_number"
            value={employee.iqama_number || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Iqama Exp Date</label>
          <input
            type="text"
            name="iqama_expiry_date"
            value={employee.iqama_expiry_date || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Bank Account</label>
          <input
            type="text"
            name="bank_account"
            value={employee.bank_account || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Nationality</label>
          <input
            type="text"
            name="nationality"
            value={employee.nationality || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Passport Number</label>
          <input
            type="text"
            name="passport_number"
            value={employee.passport_number || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Passport Exp Date</label>
          <input
            type="text"
            name="passport_expiry_date"
            value={employee.passport_expiry_date || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Profession</label>
          <input
            type="text"
            name="profession"
            value={employee.profession || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Client No.</label>
          <input
            type="text"
            name="client_number"
            value={employee.client_number || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Client Name</label>
          <input
            type="text"
            name="client_name"
            value={employee.client_name || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Contract Start Date</label>
          <input
            type="text"
            name="contract_start_date"
            value={employee.contract_start_date || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Contract End Date</label>
          <input
            type="text"
            name="contract_end_date"
            value={employee.contract_end_date || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Basic Salary</label>
          <input
            type="text"
            name="basic_salary"
            value={employee.basic_salary || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">HRA Type</label>
          <input
            type="text"
            name="hra_type"
            value={employee.hra_type || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">HRA</label>
          <input
            type="text"
            name="hra"
            value={employee.hra || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">TRA Type</label>
          <input
            type="text"
            name="tra_type"
            value={employee.tra_type || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">TRA</label>
          <input
            type="text"
            name="tra"
            value={employee.tra || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Food Allowance Type</label>
          <input
            type="text"
            name="food_allowance_type"
            value={employee.food_allowance_type || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Food Allowance</label>
          <input
            type="text"
            name="food_allowance"
            value={employee.food_allowance || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Other Allowance</label>
          <input
            type="text"
            name="other_allowance"
            value={employee.other_allowance || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Total Salary</label>
          <input
            type="text"
            name="total_salary"
            value={employee.total_salary || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Medical</label>
          <input
            type="text"
            name="medical"
            value={employee.medical || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Employee Status</label>
          <input
            type="text"
            name="employee_status"
            value={employee.employee_status || ""}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="col-span-2 flex justify-start gap-4 mt-4">
          <button
            type="submit"
            disabled={isUpdating}
            className={`px-4 py-2 rounded text-white cursor-pointer ${
              isUpdating ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500"
            }`}
          >
            {isUpdating ? "Updating..." : "Update Employee"}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-400 text-white rounded cursor-pointer"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
