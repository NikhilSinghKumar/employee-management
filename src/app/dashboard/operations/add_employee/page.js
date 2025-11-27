"use client";

import { useState, useEffect, useRef } from "react";
import { calculateTotalSalary } from "@/utils/employeeUtils";
import ExcelUpload from "@/component/ExcelUpload";

const defaultEmployee = {
  employeeName: "",
  mobile: "",
  email: "",
  dob: "",
  etNo: "",
  iqamaNo: "",
  iqamaExpDate: "",
  bankAccount: "",
  nationality: "",
  passportNo: "",
  passportExpDate: "",
  profession: "",
  clientNo: "",
  clientName: "",
  contractStartDate: "",
  contractEndDate: "",
  employeeSource: "",
  basicSalary: "",
  hraType: "provided",
  hra: "",
  traType: "provided",
  tra: "",
  foodAllowanceType: "provided",
  foodAllowance: "",
  otherAllowance: "",
  totalSalary: "0.00",
  medical: "",
  employeeStatus: "",
};

export default function AddEmployee() {
  const [employee, setEmployee] = useState(defaultEmployee);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const messageTimer = useRef(null);

  const allowances = [
    { key: "hra", label: "HRA", percentage: 0.25 },
    { key: "tra", label: "TRA", percentage: 0.1 },
    { key: "foodAllowance", label: "Food Allowance", percentage: null },
  ];

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "employeeName",
      "mobile",
      "email",
      "dob",
      "nationality",
      "passportNo",
      "profession",
      "clientName",
      "clientNo",
      "contractStartDate",
      "employeeStatus",
    ];
    requiredFields.forEach((field) => {
      if (!employee[field].trim()) {
        newErrors[field] = `${field
          .replace(/([A-Z])/g, " $1")
          .trim()} is required`;
      }
    });
    if (
      employee.email &&
      !/^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(employee.email)
    ) {
      newErrors.email = "Invalid email format";
    }
    if (
      employee.contractStartDate &&
      employee.contractEndDate &&
      new Date(employee.contractEndDate) < new Date(employee.contractStartDate)
    ) {
      newErrors.contractEndDate =
        "Contract end date cannot be before start date";
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setEmployee((prev) => ({
      ...prev,
      [name]:
        type === "radio"
          ? value
          : name === "medical"
          ? value.toUpperCase()
          : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setMessage({ text: "", type: "" });
  };

  const handleAllowanceChange = (key, value) => {
    setEmployee((prev) => {
      const basicSalary = parseFloat(prev.basicSalary) || 0;
      const updates = { [`${key}Type`]: value };
      if (value === "provided") {
        updates[key] = "0";
      } else if (value === "percent" && key !== "foodAllowance") {
        updates[key] = (
          basicSalary * allowances.find((a) => a.key === key).percentage
        ).toFixed(2);
      }
      return { ...prev, ...updates };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTimeout(() => {
        const messageElement = document.querySelector(".animate-fade-in");
        if (messageElement) {
          messageElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ text: "Employee added successfully!", type: "success" });
        setEmployee(defaultEmployee);
        setErrors({});
      } else {
        setMessage({
          text: result.error || "Failed to add employee",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setMessage({
        text: "Server error. Please try again later.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEmployee(defaultEmployee);
    setErrors({});
    setMessage({ text: "Form reset successfully", type: "success" });
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(
      () => setMessage({ text: "", type: "" }),
      3000
    );
  };

  useEffect(() => {
    document.title = "Add New Employee";
    setEmployee((prev) => ({
      ...prev,
      totalSalary: calculateTotalSalary(prev),
    }));
  }, [
    employee.basicSalary,
    employee.hraType,
    employee.traType,
    employee.foodAllowanceType,
    employee.foodAllowance,
    employee.otherAllowance,
  ]);

  useEffect(() => {
    if (message.text) {
      const messageElement = document.querySelector(".animate-fade-in");
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 w-[95%] sm:w-full max-w-3xl border border-[#cfd8df] mx-auto">
        <div className="flex flex-col items-center mb-2">
          <h1 className="text-2xl font-semibold text-[#4A5A6A] text-center">
            Add New Employee
          </h1>
        </div>

        <div className="flex justify-center items-center h-4 mb-5">
          {message.text && (
            <div
              className={`animate-fade-in text-sm ${
                message.type === "success"
                  ? "text-green-600"
                  : "text-red-600 bg-red-100 p-3 rounded-lg"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal Information */}
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-[#4A5A6A]">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Employee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="employeeName"
                  value={employee.employeeName}
                  onChange={handleChange}
                  placeholder="Enter Employee Name"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.employeeName ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.employeeName && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.employeeName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Mobile <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={employee.mobile}
                  onChange={handleChange}
                  placeholder="Enter Mobile Number"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.mobile ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.mobile && (
                  <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>
                )}
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={employee.email}
                  onChange={handleChange}
                  placeholder="Enter Email"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  value={employee.dob}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.dob ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.dob && (
                  <p className="mt-1 text-xs text-red-500">{errors.dob}</p>
                )}
              </div>
            </div>
          </div>

          {/* Identification */}
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-[#4A5A6A]">
              Identification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  ET Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="etNo"
                  value={employee.etNo}
                  onChange={handleChange}
                  placeholder="Enter ET Number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Iqama Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="iqamaNo"
                  value={employee.iqamaNo}
                  onChange={handleChange}
                  placeholder="Enter Iqama Number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Iqama Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="iqamaExpDate"
                  value={employee.iqamaExpDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Passport Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="passportNo"
                  value={employee.passportNo}
                  onChange={handleChange}
                  placeholder="Enter Passport Number"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.passportNo ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.passportNo && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.passportNo}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Passport Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="passportExpDate"
                  value={employee.passportExpDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Nationality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={employee.nationality}
                  onChange={handleChange}
                  placeholder="Enter Nationality"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.nationality ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.nationality && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.nationality}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-[#4A5A6A]">
              Employment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Profession <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="profession"
                  value={employee.profession}
                  onChange={handleChange}
                  placeholder="Enter Profession"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.profession ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.profession && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.profession}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Client Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clientNo"
                  value={employee.clientNo}
                  onChange={handleChange}
                  placeholder="Enter Client Number"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.clientNo ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.clientNo && (
                  <p className="mt-1 text-xs text-red-500">{errors.clientNo}</p>
                )}
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={employee.clientName}
                  onChange={handleChange}
                  placeholder="Enter Client Name"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.clientName ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.clientName && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.clientName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Contract Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="contractStartDate"
                  value={employee.contractStartDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.contractStartDate
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                />
                {errors.contractStartDate && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.contractStartDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Contract End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="contractEndDate"
                  value={employee.contractEndDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                  required
                />
                {errors.contractEndDate && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.contractEndDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Bank Account No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankAccount"
                  value={employee.bankAccount}
                  onChange={handleChange}
                  placeholder="Enter Bank Account Number"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.bankAccount ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.bankAccount && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.bankAccount}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Employee Source <span className="text-red-500">*</span>
                </label>
                <select
                  name="employeeSource"
                  value={employee.employeeSource}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                  required
                >
                  <option value="">Select Source</option>
                  <option value="local">Local</option>
                  <option value="overseas">Overseas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-[#4A5A6A]">Compensation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Basic Salary <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="basicSalary"
                  value={employee.basicSalary}
                  onChange={handleChange}
                  placeholder="Enter Basic Salary"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Medical <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="medical"
                  value={employee.medical}
                  onChange={handleChange}
                  placeholder="Enter Medical Status"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                  required
                />
              </div>
              {allowances.map(({ key, label, percentage }) => (
                <div key={key}>
                  <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`${key}Type`}
                        value="provided"
                        checked={employee[`${key}Type`] === "provided"}
                        onChange={() => handleAllowanceChange(key, "provided")}
                        className="mr-1"
                      />
                      Provided
                    </label>
                    {percentage && (
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`${key}Type`}
                          value="percent"
                          checked={employee[`${key}Type`] === "percent"}
                          onChange={() => handleAllowanceChange(key, "percent")}
                          className="mr-1"
                        />
                        Percent ({percentage * 100}%)
                      </label>
                    )}
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`${key}Type`}
                        value="manual"
                        checked={employee[`${key}Type`] === "manual"}
                        onChange={() => handleAllowanceChange(key, "manual")}
                        className="mr-1"
                      />
                      Manual
                    </label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.00"
                    name={key}
                    value={employee[key]}
                    onChange={handleChange}
                    placeholder="0.00"
                    disabled={employee[`${key}Type`] !== "manual"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Other Allowance <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  name="otherAllowance"
                  value={employee.otherAllowance}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Total Salary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={employee.totalSalary}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-[#4A5A6A]">Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Employee Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="employeeStatus"
                  value={employee.employeeStatus}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                    errors.employeeStatus ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On hold">On hold</option>
                  <option value="On vacation">On vacation</option>
                </select>
                {errors.employeeStatus && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.employeeStatus}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className={`max-w-xs w-full py-2.5 rounded-lg text-white font-medium transition-all duration-200 ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#4A5A6A] hover:bg-[#3b4b59] hover:shadow-md"
              } flex items-center justify-center gap-2`}
            >
              {isLoading && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isLoading ? "Submitting..." : "Submit Employee"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="max-w-xs w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200"
            >
              Reset Form
            </button>
          </div>
        </form>
        <div className="flex justify-center items-center mt-4">
          <div className="w-auto min-w-[200px]">
            <ExcelUpload />
          </div>
        </div>
      </div>
    </div>
  );
}
