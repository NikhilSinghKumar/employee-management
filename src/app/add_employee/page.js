"use client";

import { useState, useEffect } from "react";
import { calculateTotalSalary } from "@/utils/employeeUtils";

export default function AddEmployee() {
  const [employee, setEmployee] = useState({
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
    hraType: "",
    hra: "",
    traType: "",
    tra: "",
    foodAllowance: "",
    otherAllowance: "",
    totalSalary: "00.00",
    medical: "",
    employeeStatus: "Active",
  });
  const [message, setMessage] = useState("");
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

    if (
      name === "contractEndDate" &&
      new Date(value) < new Date(employee.contractStartDate)
    ) {
      alert("Contract End Date must be greater than Contract Start Date");
      return;
    }

    setEmployee((prev) => ({
      ...prev,
      [name]: name === "medical" ? value.toUpperCase() : value,
    }));
  };

  useEffect(() => {
    setEmployee((prev) => ({
      ...prev,
      totalSalary: calculateTotalSalary(prev),
    }));
  }, [
    employee.basicSalary,
    employee.hraType,
    employee.hra,
    employee.traType,
    employee.tra,
    employee.foodAllowance,
    employee.otherAllowance,
  ]);

  const handleSubmit = async (e) => {
    console.log("Employee Details: ", employee);
    e.preventDefault();
    setMessage("");
    if (!/^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(employee.email)) {
      setMessage("Invalid email format");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...employee,
        }),
      });
      if (res.ok) {
        setMessage("Employee added successfully!");
      } else {
        setMessage("Failed to add employee.");
      }
    } catch (error) {
      setMessage("An error occurred.");
    }
  };

  const fields = Object.keys(employee);
  const table12 = [fields.slice(0, 8), fields.slice(8, 16)];

  return (
    <div className="flex justify-center items-center max-h-screen bg-gray-100 p-4 overflow-hidden">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-7xl">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
          Add New Employee
        </h2>
        {message && (
          <p className="text-center text-sm text-green-600 mb-4">{message}</p>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="flex flex-col ">
            <div className="grid grid-cols-3 gap-4">
              {table12.map((group1, index) => (
                <table
                  key={index}
                  className="w-full border border-gray-300 rounded-lg text-sm"
                >
                  <tbody>
                    {group1.map((key1, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td
                          className={`p-1 text-gray-600 font-medium ${
                            ["dob"].includes(key1) ? "uppercase" : "capitalize"
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
              ))}
              <table className="w-full border border-gray-300 rounded-lg text-sm">
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
                                    [key]: (basicVal * percentage).toFixed(2),
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
          <button
            type="submit"
            className="w-3xs bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-all cursor-pointer"
          >
            Add Employee
          </button>
        </form>
      </div>
    </div>
  );
}
