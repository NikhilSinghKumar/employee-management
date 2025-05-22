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
  basicSalary: "",
  hraType: "provided",
  hra: "",
  traType: "provided",
  tra: "",
  foodAllowance: "",
  otherAllowance: "",
  totalSalary: "00.00",
  medical: "",
  employeeStatus: "Active",
};

export default function AddEmployee() {
  const [employee, setEmployee] = useState(defaultEmployee);
  const [message, setMessage] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [loading, setLoading] = useState(false);
  const messageTimer = useRef(null);
  const allowances = [
    { key: "hra", label: "HRA", percentage: 0.25 },
    { key: "tra", label: "TRA", percentage: 0.1 },
    { key: "foodAllowance", label: "Food Allowance", percentage: null },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    const validators = {
      employeeName: /^[a-zA-Z\s'-]{1,50}$/,
      nationality: /^[a-zA-Z\s'-]{1,50}$/,
      profession: /^[a-zA-Z\s'-]{1,50}$/,
      clientName: /^[a-zA-Z\s'-]{1,50}$/,
      mobile: /^[1-9]\d{0,9}$/,
      email: /^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    };

    if (
      validators[name] &&
      name !== "email" && // Exclude email from inline validation
      !validators[name].test(value) &&
      value !== ""
    ) {
      return;
    }
    setEmployee((prev) => ({
      ...prev,
      [name]: name === "medical" ? value.toUpperCase() : value,
    }));

    setIsModified(true);
  };

  useEffect(() => {
    document.title = "New Employee Form";

    setEmployee((prev) => {
      const basicSalary = parseFloat(prev.basicSalary) || 0;

      const updatedValues = {
        totalSalary: calculateTotalSalary(prev),
      };

      if (prev.hraType === "percent") {
        updatedValues.hra = (basicSalary * 0.25).toFixed(2);
      }

      if (prev.traType === "percent") {
        updatedValues.tra = (basicSalary * 0.1).toFixed(2);
      }

      return { ...prev, ...updatedValues };
    });
  }, [
    employee.basicSalary,
    employee.hraType,
    employee.traType,
    employee.foodAllowance,
    employee.otherAllowance,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!/^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(employee.email)) {
      setMessage("Invalid email format");
      setLoading(false);
      return;
    }

    if (
      new Date(employee.contractEndDate) < new Date(employee.contractStartDate)
    ) {
      setMessage("Check Contract Date");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employee),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add employee");
      }

      setMessage("Employee added successfully!");
      setEmployee(defaultEmployee);
      setIsModified(false);
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      console.error("Unexpected error:", err);
      setMessage("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmployee(defaultEmployee);
    setIsModified(false);
    setMessage("Employee form is reset now");
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(""), 2000);
  };

  const fields = Object.keys(employee);
  const table12 = [fields.slice(0, 8), fields.slice(8, 16)];

  return (
    <>
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 pt-16 px-4 pb-4">
        <div className="bg-white p-6 rounded-lg shadow-lg min-h-[70vh] w-full max-w-screen-xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-700 m-6">
            New Employee Form
          </h2>
          {message && (
            <p className="text-center text-sm text-green-600 mb-4">{message}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 w-full h-full">
            <div className="flex flex-col">
              <div className="flex flex-col lg:flex-row gap-4 w-full h-full">
                {table12.map((group1, index) => (
                  <div key={index} className="flex-1">
                    <table
                      key={index}
                      className="w-full border border-gray-300 rounded-lg text-sm h-full"
                    >
                      <tbody>
                        {group1.map((key1, i) => (
                          <tr key={i} className="border-b border-gray-200">
                            <td
                              className={`p-1 text-gray-600 font-medium ${
                                ["dob"].includes(key1)
                                  ? "uppercase"
                                  : "capitalize"
                              }  whitespace-nowrap`}
                            >
                              {key1.replace(/([A-Z])/g, " $1").trim()}
                            </td>
                            <td className="p-1">
                              <input
                                type={
                                  [
                                    "dob",
                                    "iqamaExpDate",
                                    "passportExpDate",
                                    "contractStartDate",
                                    "contractEndDate",
                                  ].includes(key1)
                                    ? "date"
                                    : "text"
                                }
                                name={key1}
                                value={employee[key1]}
                                onChange={handleChange}
                                placeholder={`Enter ${key1
                                  .replace(/([A-Z])/g, " $1")
                                  .trim()}`}
                                className={`w-full p-1 bg-gray-100 ${
                                  [
                                    "dob",
                                    "iqamaExpDate",
                                    "passportExpDate",
                                    "contractStartDate",
                                    "contractEndDate",
                                    "email",
                                  ].includes(key1)
                                    ? "lowercase"
                                    : "capitalize"
                                } focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                required
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                <div className="flex-1">
                  <table className="w-full border border-gray-300 rounded-lg text-sm h-full">
                    <tbody>
                      {/* Basic Salary */}
                      <tr className="border-b border-gray-200">
                        <td className="p-1 text-gray-600 font-medium whitespace-nowrap">
                          Basic Salary
                        </td>
                        <td className="p-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            name="basicSalary"
                            value={employee.basicSalary}
                            onChange={handleChange}
                            placeholder="Enter Basic Salary"
                            className="w-full p-1 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                      </tr>

                      {/* Allowance Fields */}
                      {allowances.map(({ key, label, percentage }) => (
                        <tr key={key} className="border-b border-gray-200">
                          <td className="p-1 text-gray-600 font-medium whitespace-nowrap">
                            {label}
                          </td>
                          <td className="p-1">
                            <label className="p-1">
                              <input
                                type="radio"
                                name={`${key}Type`}
                                value="provided"
                                defaultChecked
                                onChange={() =>
                                  setEmployee((prev) => ({
                                    ...prev,
                                    [`${key}Type`]: "provided",
                                    [key]: "0",
                                  }))
                                }
                                className="mr-1"
                              />
                              Provided
                            </label>
                            {percentage && (
                              <label className="p-1">
                                <input
                                  type="radio"
                                  name={`${key}Type`}
                                  value="percent"
                                  onChange={() =>
                                    setEmployee((prev) => {
                                      const basicVal =
                                        parseFloat(prev.basicSalary) || 0;
                                      return {
                                        ...prev,
                                        [`${key}Type`]: "percent",
                                        [key]: (basicVal * percentage).toFixed(
                                          2
                                        ),
                                      };
                                    })
                                  }
                                  className="mr-1"
                                />
                                {percentage * 100}% of Basic
                              </label>
                            )}
                            <label className="p-1">
                              <input
                                type="radio"
                                name={`${key}Type`}
                                value="manual"
                                onChange={handleChange}
                                className="mr-1"
                              />
                              Manual
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.00"
                              name={key}
                              value={employee[key]}
                              onChange={handleChange}
                              placeholder="0.00"
                              disabled={employee[`${key}Type`] !== "manual"}
                              className="w-full p-1 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </td>
                        </tr>
                      ))}

                      {/* Other Allowance */}
                      <tr className="border-b border-gray-200">
                        <td className="p-1 text-gray-600 font-medium whitespace-nowrap">
                          Other Allowance
                        </td>
                        <td className="p-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0.00"
                            name="otherAllowance"
                            value={employee.otherAllowance}
                            onChange={handleChange}
                            placeholder="0.00"
                            className="w-full p-1 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                      </tr>

                      {/* Medical */}
                      <tr className="border-b border-gray-200">
                        <td className="p-1 text-gray-600 font-medium whitespace-nowrap">
                          Medical
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            name="medical"
                            value={employee.medical}
                            onChange={handleChange}
                            placeholder="Enter Medical Status"
                            className="w-full p-1 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                      </tr>

                      {/* Employee Status */}
                      <tr className="border-b border-gray-200">
                        <td className="p-1 text-gray-600 font-medium whitespace-nowrap">
                          Employee Status
                        </td>
                        <td className="p-1">
                          <select
                            name="employeeStatus"
                            value={employee.employeeStatus}
                            onChange={handleChange}
                            className="w-full p-1 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On hold">On hold</option>
                            <option value="On vacation">On vacation</option>
                          </select>
                        </td>
                      </tr>

                      {/* Total Salary */}
                      <tr className="border-b border-gray-200">
                        <td className="p-1 text-gray-600 font-medium whitespace-nowrap">
                          Total Salary
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={employee.totalSalary}
                            disabled
                            className="w-full p-1 bg-gray-100 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </form>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full">
            {/* Buttons Container */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="w-40 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-all cursor-pointer"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={!isModified}
                className={`w-40 ${
                  isModified
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-300 cursor-not-allowed"
                } text-white font-medium py-2 rounded-lg transition-all`}
              >
                Reset Form
              </button>
            </div>

            {/* ExcelUpload Container - Pushed to the right */}
            <div className="ml-50">
              <div className="w-auto min-w-[200px]">
                <ExcelUpload />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
