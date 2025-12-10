"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// Format ISO date to DD-MM-YYYY for display
function formatDateToDDMMYYYY(isoDate) {
  if (!isoDate) return "";
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return "";
  }
}

// Convert DD-MM-YYYY back to YYYY-MM-DD
function formatDateToYYYYMMDD(dateStr) {
  if (!dateStr) return null;
  try {
    const [day, month, year] = dateStr.split("-");
    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) return null;
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

// Validate DD-MM-YYYY format
function isValidDateFormat(dateStr) {
  const regex = /^\d{2}-\d{2}-\d{4}$/;
  if (!regex.test(dateStr)) return false;
  const [day, month, year] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getDate() === day &&
    date.getMonth() + 1 === month &&
    date.getFullYear() === year
  );
}

export default function EditEmployeePage() {
  const params = useParams();
  const id = params?.id;
  const [employee, setEmployee] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    document.title = "Edit Employee";
    if (!id) {
      setError("Invalid employee ID");
      return;
    }

    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/api/employees/${id}`, {
          method: "GET",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch employee");
        }

        const data = result.data;

        if (!data) {
          throw new Error("Employee not found");
        }

        setEmployee({
          ...data,
          dob: formatDateToDDMMYYYY(data.dob),
          iqama_expiry_date: formatDateToDDMMYYYY(data.iqama_expiry_date),
          passport_expiry_date: formatDateToDDMMYYYY(data.passport_expiry_date),
          contract_start_date: formatDateToDDMMYYYY(data.contract_start_date),
          contract_end_date: formatDateToDDMMYYYY(data.contract_end_date),
        });
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      }
    };

    fetchEmployee();
  }, [id]);

  const validateForm = () => {
    const errors = {};
    const requiredFields = ["name", "mobile"];
    const dateFields = [
      "dob",
      "iqama_expiry_date",
      "passport_expiry_date",
      "contract_start_date",
      "contract_end_date",
    ];

    requiredFields.forEach((field) => {
      if (!employee?.[field]) {
        errors[field] = `${field.replace("_", " ")} is required`;
      }
    });

    dateFields.forEach((field) => {
      if (employee?.[field] && !isValidDateFormat(employee[field])) {
        errors[field] = `Invalid date format for ${field.replace(
          "_",
          " "
        )}. Use DD-MM-YYYY`;
      }
    });

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = [
      "basic_salary",
      "hra",
      "tra",
      "food_allowance",
      "other_allowance",
    ];

    setEmployee((prev) => {
      const updatedEmployee = { ...prev, [name]: value };

      if (numericFields.includes(name)) {
        const basic = parseFloat(updatedEmployee.basic_salary) || 0;
        const hra = parseFloat(updatedEmployee.hra) || 0;
        const tra = parseFloat(updatedEmployee.tra) || 0;
        const food = parseFloat(updatedEmployee.food_allowance) || 0;
        const other = parseFloat(updatedEmployee.other_allowance) || 0;

        updatedEmployee.total_salary = (
          basic +
          hra +
          tra +
          food +
          other
        ).toString();
      }

      return updatedEmployee;
    });

    // Clear validation error for this field
    setValidationErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please correct the highlighted fields.");
      return;
    }

    setIsUpdating(true);
    const loadingToast = toast.loading("Updating employee...");

    try {
      const updatedEmployee = {
        ...employee,
        dob: formatDateToYYYYMMDD(employee.dob),
        iqama_expiry_date: formatDateToYYYYMMDD(employee.iqama_expiry_date),
        passport_expiry_date: formatDateToYYYYMMDD(
          employee.passport_expiry_date
        ),
        contract_start_date: formatDateToYYYYMMDD(employee.contract_start_date),
        contract_end_date: formatDateToYYYYMMDD(employee.contract_end_date),
      };

      const response = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedEmployee),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update employee");
      }

      toast.success("Employee updated successfully!", {
        id: loadingToast,
      });

      setTimeout(() => {
        router.push("/dashboard/operations/employee_list");
      }, 1000);
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    } finally {
      setIsUpdating(false);
    }
  };

  if (error && !employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!id || !employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="animate-pulse text-[16px]" style={{ color: "#555B69" }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white shadow rounded-lg mt-18 pb-8 px-4">
      <h2 className="text-xl font-semibold mb-4">Edit Employee</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {[
          { name: "name", label: "Name", type: "text" },
          { name: "mobile", label: "Mobile", type: "text" },
          { name: "email", label: "Email", type: "text" },
          { name: "dob", label: "DOB", type: "text" },
          { name: "et_number", label: "Et No.", type: "text" },
          { name: "iqama_number", label: "Iqama No.", type: "text" },
          { name: "iqama_expiry_date", label: "Iqama Exp Date", type: "text" },
          { name: "bank_account", label: "Bank Account", type: "text" },
          { name: "nationality", label: "Nationality", type: "text" },
          { name: "passport_number", label: "Passport Number", type: "text" },
          {
            name: "passport_expiry_date",
            label: "Passport Exp Date",
            type: "text",
          },
          { name: "profession", label: "Profession", type: "text" },
          { name: "client_number", label: "Client No.", type: "text" },
          { name: "client_name", label: "Client Name", type: "text" },
          {
            name: "contract_start_date",
            label: "Contract Start Date",
            type: "text",
          },
          {
            name: "contract_end_date",
            label: "Contract End Date",
            type: "text",
          },
          {
            name: "basic_salary",
            label: "Basic Salary",
            type: "number",
            step: "0.01",
          },
          { name: "hra_type", label: "HRA Type", type: "text" },
          { name: "hra", label: "HRA", type: "number", step: "0.01" },
          { name: "tra_type", label: "TRA Type", type: "text" },
          { name: "tra", label: "TRA", type: "number", step: "0.01" },
          {
            name: "food_allowance_type",
            label: "Food Allowance Type",
            type: "text",
          },
          {
            name: "food_allowance",
            label: "Food Allowance",
            type: "number",
            step: "0.01",
          },
          {
            name: "other_allowance",
            label: "Other Allowance",
            type: "number",
            step: "0.01",
          },
          {
            name: "total_salary",
            label: "Total Salary",
            type: "number",
            disabled: true,
          },
          { name: "medical", label: "Medical", type: "text" },
          { name: "employee_status", label: "Employee Status", type: "text" },
          { name: "employee_source", label: "Employee Source", type: "text" },
        ].map((field) => (
          <div key={field.name} className="flex flex-col">
            <label className="font-medium">{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={
                employee[field.name] !== null &&
                employee[field.name] !== undefined
                  ? employee[field.name]
                  : ""
              }
              onChange={handleChange}
              disabled={field.disabled}
              step={field.step}
              className={`p-2 border rounded-sm text-sm ${
                validationErrors[field.name] ? "border-red-500" : ""
              }`}
            />
            {validationErrors[field.name] && (
              <span className="text-red-500 text-xs mt-1">
                {validationErrors[field.name]}
              </span>
            )}
          </div>
        ))}
        <div className="col-span-1 flex justify-start gap-4 mt-4">
          <button
            type="submit"
            disabled={isUpdating}
            className={`px-4 py-2 rounded text-white cursor-pointer ${
              isUpdating
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 cursor-pointer"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
