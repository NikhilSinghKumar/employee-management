"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

// Format ISO date to DD-MM-YYYY for display
function formatDateToDDMMYYYY(isoDate) {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Convert DD-MM-YYYY back to YYYY-MM-DD
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
    document.title = "Edit Employee";
    if (!id) return;

    const fetchEmployee = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching employee:", error);
        return;
      }

      if (data) {
    
        setEmployee({
          ...data, 
          dob: formatDateToDDMMYYYY(data.dob),
          iqama_expiry_date: formatDateToDDMMYYYY(data.iqama_expiry_date),
          passport_expiry_date: formatDateToDDMMYYYY(data.passport_expiry_date),
          contract_start_date: formatDateToDDMMYYYY(data.contract_start_date),
          contract_end_date: formatDateToDDMMYYYY(data.contract_end_date),
        });
      }
    };

    fetchEmployee();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ["basic_salary", "hra", "tra", "food_allowance", "other_allowance"];
  
    setEmployee((prev) => {
      const updatedEmployee = { ...prev, [name]: value };
  
      if (numericFields.includes(name)) {
        const basic = parseFloat(updatedEmployee.basic_salary) || 0;
        const hra = parseFloat(updatedEmployee.hra) || 0;
        const tra = parseFloat(updatedEmployee.tra) || 0;
        const food = parseFloat(updatedEmployee.food_allowance) || 0;
        const other = parseFloat(updatedEmployee.other_allowance) || 0;
  
        updatedEmployee.total_salary = (basic + hra + tra + food + other).toString();
      }
  
      return updatedEmployee;
    });
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    const updatedEmployee = {
      ...employee,
    };

    const { error } = await supabase
      .from("employees")
      .update(updatedEmployee)
      .eq("id", id);

    if (error) {
      console.error("Update failed:", error);
    } else {
      router.push("/employee_list");
    }

    setIsUpdating(false);
  };

  if (!id) return <div>Loading ID...</div>;
  if (!employee) return <div>Loading employee...</div>;

  if (!id) return <div>Loading ID...</div>;
  if (!employee) return <div>Loading employee...</div>;

  return (
    <>
      <div className="max-w-3xl mx-auto p-4 bg-white shadow rounded-lg mt-18 pb-8 px-4">
        <h2 className="text-xl font-semibold mb-4">Edit Employee</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={employee.name || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Mobile</label>
            <input
              type="text"
              name="mobile"
              value={employee.mobile || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Email</label>
            <input
              type="text"
              name="email"
              value={employee.email || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">DOB</label>
            <input
              type="text"
              name="dob"
              value={employee.dob || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Et No.</label>
            <input
              type="text"
              name="et_number"
              value={employee.et_number || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Iqama No.</label>
            <input
              type="text"
              name="iqama_number"
              value={employee.iqama_number || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Iqama Exp Date</label>
            <input
              type="text"
              name="iqama_expiry_date"
              value={employee.iqama_expiry_date || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Bank Account</label>
            <input
              type="text"
              name="bank_account"
              value={employee.bank_account || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Nationality</label>
            <input
              type="text"
              name="nationality"
              value={employee.nationality || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Passport Number</label>
            <input
              type="text"
              name="passport_number"
              value={employee.passport_number || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Passport Exp Date</label>
            <input
              type="text"
              name="passport_expiry_date"
              value={employee.passport_expiry_date || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Profession</label>
            <input
              type="text"
              name="profession"
              value={employee.profession || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Client No.</label>
            <input
              type="text"
              name="client_number"
              value={employee.client_number || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Client Name</label>
            <input
              type="text"
              name="client_name"
              value={employee.client_name || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Contract Start Date</label>
            <input
              type="text"
              name="contract_start_date"
              value={employee.contract_start_date || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Contract End Date</label>
            <input
              type="text"
              name="contract_end_date"
              value={employee.contract_end_date || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Basic Salary</label>
            <input
              type="number"
              name="basic_salary"
              step="0.01"
              value={employee.basic_salary || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">HRA Type</label>
            <input
              type="text"
              name="hra_type"
              value={employee.hra_type || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">HRA</label>
            <input
              type="number"
              name="hra"
              step="0.01"
              value={employee.hra || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">TRA Type</label>
            <input
              type="text"
              name="tra_type"
              value={employee.tra_type || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">TRA</label>
            <input
              type="number"
              name="tra"
              step="0.01"
              value={employee.tra || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Food Allowance Type</label>
            <input
              type="text"
              name="food_allowance_type"
              value={employee.food_allowance_type || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Food Allowance</label>
            <input
              type="number"
              name="food_allowance"
              step="0.01"
              value={employee.food_allowance || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Other Allowance</label>
            <input
              type="number"
              name="other_allowance"
              step="0.01"
              value={employee.other_allowance || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Total Salary</label>
            <input
              type="number"
              name="total_salary"
              value={employee.total_salary || ""}
              onChange={handleChange}
              disabled
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Medical</label>
            <input
              type="text"
              name="medical"
              value={employee.medical || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Employee Status</label>
            <input
              type="text"
              name="employee_status"
              value={employee.employee_status || ""}
              onChange={handleChange}
              className="p-2 border rounded-sm text-sm"
            />
          </div>
          <div className="col-span-1 flex justify-start gap-4 mt-4">
            <button
              type="submit"
              disabled={isUpdating}
              className={`px-4 py-2 rounded text-white cursor-pointer ${
                isUpdating ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500"
              }`}
            >
              {isUpdating ? "Updating..." : "Update"}
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
    </>
  );
}