"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

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
          dob: data.dob?.slice(0, 10) || "",
          iqama_expiry_date: data.iqama_expiry_date?.slice(0, 10) || "",
          passport_expiry_date: data.passport_expiry_date?.slice(0, 10) || "",
          contract_start_date: data.contract_start_date?.slice(0, 10) || "",
          contract_end_date: data.contract_end_date?.slice(0, 10) || "",
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

    // simple ISO YYYY-MM-DD validator
    const isValidISODate = (s) => {
      if (!s) return false;
      // quick format check
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
      const [y, m, d] = s.split("-").map(Number);
      const dt = new Date(s);
      return (
        dt instanceof Date &&
        !isNaN(dt.getTime()) &&
        dt.getFullYear() === y &&
        dt.getMonth() + 1 === m &&
        dt.getDate() === d
      );
    };

    requiredFields.forEach((field) => {
      if (!employee?.[field]) {
        errors[field] = `${field.replace("_", " ")} is required`;
      }
    });

    // validate only if a date field has a value
    dateFields.forEach((field) => {
      const val = employee?.[field];
      if (val && val !== "" && !isValidISODate(val)) {
        errors[field] = `Invalid date for ${field.replace(
          "_",
          " "
        )} (use YYYY-MM-DD)`;
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
        dob: employee.dob || null,
        iqama_expiry_date: employee.iqama_expiry_date || null,
        passport_expiry_date: employee.passport_expiry_date || null,
        contract_start_date: employee.contract_start_date || null,
        contract_end_date: employee.contract_end_date || null,
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
          {
            name: "dob",
            label: "DOB",
            type: "date",
            isDate: true,
          },
          { name: "et_number", label: "Et No.", type: "text" },
          { name: "iqama_number", label: "Iqama No.", type: "text" },
          {
            name: "iqama_expiry_date",
            label: "Iqama Exp Date",
            type: "date",
            isDate: true,
          },
          { name: "bank_account", label: "Bank Account", type: "text" },
          { name: "nationality", label: "Nationality", type: "text" },
          { name: "passport_number", label: "Passport Number", type: "text" },
          {
            name: "passport_expiry_date",
            label: "Passport Exp Date",
            type: "date",
            isDate: true,
          },
          { name: "profession", label: "Profession", type: "text" },
          { name: "client_number", label: "Client No.", type: "text" },
          { name: "client_name", label: "Client Name", type: "text" },
          {
            name: "contract_start_date",
            label: "Contract Start Date",
            type: "date",
            isDate: true,
          },
          {
            name: "contract_end_date",
            label: "Contract End Date",
            type: "date",
            isDate: true,
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
                field.isDate
                  ? (employee[field.name] || "").slice(0, 10) // ensure YYYY-MM-DD
                  : employee[field.name] || ""
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
