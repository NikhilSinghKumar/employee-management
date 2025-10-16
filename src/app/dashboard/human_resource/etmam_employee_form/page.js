"use client";

import { useState, useEffect, useRef } from "react";
import { calculateTotalSalary } from "@/utils/employeeUtils";
import EtmamEmployeesUpload from "@/component/EtmamEmployeesUpload";

const defaultEmployee = {
  name: "",
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
  companyStaff: "Etmam Staffs",
  department: "",
  contractStartDate: "",
  contractEndDate: "",
  staffSource: "",
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
  staffStatus: "",
};

export default function EtmamEmployeeFormPage() {
  const [employee, setEmployee] = useState(defaultEmployee);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [isModified, setIsModified] = useState(false);
  const [loading, setLoading] = useState(false);
  const messageTimer = useRef(null);
  const allowances = [
    { key: "hra", label: "HRA", percentage: 0.25 },
    { key: "tra", label: "TRA", percentage: 0.1 },
    { key: "foodAllowance", label: "Food Allowance", percentage: null },
  ];

  const departments = [
    "Sales",
    "Operations",
    "HR",
    "Finance",
    "Talent Acquisition",
    "Accommodation & Transportation",
    "Manpower Affairs",
    "Executive Management",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    const validators = {
      name: /^[a-zA-Z\s'-]{1,50}$/,
      nationality: /^[a-zA-Z\s'-]{1,50}$/,
      profession: /^[a-zA-Z\s'-]{1,50}$/,
      mobile: /^[1-9]\d{0,9}$/,
      iqamaNo: /^[1-9]\d{0,9}$/,
      passportNo: /^[A-Z0-9]{1,15}$/,
      bankAccount: /^[A-Z0-9]{1,20}$/,
    };

    if (validators[name] && !validators[name].test(value) && value !== "") {
      setMessage(`Invalid ${name.replace(/([A-Z])/g, " $1").trim()}`);
      setMessageType("error");
      return;
    }

    if (
      [
        "basicSalary",
        "basicSalary",
        "hra",
        "tra",
        "foodAllowance",
        "otherAllowance",
      ].includes(name) &&
      value !== "" &&
      parseFloat(value) < 0
    ) {
      setMessage(
        `${name.replace(/([A-Z])/g, " $1").trim()} cannot be negative`
      );
      setMessageType("error");
      return;
    }

    setEmployee((prev) => {
      const updated = {
        ...prev,
        [name]: name === "medical" ? value.toUpperCase() : value,
      };

      const basicSalary = parseFloat(updated.basicSalary) || 0;

      if (name === "basicSalary" || name === "hraType") {
        if (updated.hraType === "percent") {
          updated.hra = (basicSalary * 0.25).toFixed(2);
        } else if (updated.hraType === "provided") {
          updated.hra = "0";
        }
      }

      if (name === "basicSalary" || name === "traType") {
        if (updated.traType === "percent") {
          updated.tra = (basicSalary * 0.1).toFixed(2);
        } else if (updated.traType === "provided") {
          updated.tra = "0";
        }
      }

      if (name === "basicSalary" || name === "foodAllowanceType") {
        if (updated.foodAllowanceType === "provided") {
          updated.foodAllowance = "0";
        }
      }

      return updated;
    });

    setIsModified(true);
    setMessage(""); // Clear any previous message on successful change
    setMessageType("");
  };

  useEffect(() => {
    document.title = "ETMAM Staff Form";
  }, []);

  const totalSalary = calculateTotalSalary(employee);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    // Client-side validation
    if (!employee.name) {
      setMessage("Name and Staff ID are required");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (
      employee.email &&
      !/^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(employee.email)
    ) {
      setMessage("Invalid email format");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (
      employee.contractStartDate &&
      employee.contractEndDate &&
      new Date(employee.contractEndDate) < new Date(employee.contractStartDate)
    ) {
      setMessage("Contract end date must be after start date");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: employee.name,
        mobile: employee.mobile,
        email: employee.email,
        dob: employee.dob,
        et_no: employee.etNo,
        iqama_no: employee.iqamaNo,
        iqama_exp_date: employee.iqamaExpDate,
        bank_account: employee.bankAccount,
        nationality: employee.nationality,
        passport_no: employee.passportNo,
        passport_exp_date: employee.passportExpDate,
        profession: employee.profession,
        company_staff: employee.companyStaff,
        department: employee.department,
        contract_start_date: employee.contractStartDate,
        contract_end_date: employee.contractEndDate,
        staff_source: employee.staffSource,
        basic_salary: parseFloat(employee.basicSalary) || 0,
        hra_type: employee.hraType,
        hra: parseFloat(employee.hra) || 0,
        tra_type: employee.traType,
        tra: parseFloat(employee.tra) || 0,
        food_allowance_type: employee.foodAllowanceType,
        food_allowance: parseFloat(employee.foodAllowance) || 0,
        other_allowance: parseFloat(employee.otherAllowance) || 0,
        total_salary: parseFloat(totalSalary) || 0,
        medical: employee.medical,
        staff_status: employee.staffStatus,
      };

      const response = await fetch("/api/etmam_employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        if (response.status === 401) {
          setMessage("Unauthorized: Please log in");
          setMessageType("error");
        } else if (response.status === 409) {
          setMessage("Staff ID already exists");
          setMessageType("error");
        } else if (response.status === 400) {
          setMessage(result.error || "Invalid input data");
          setMessageType("error");
        } else {
          setMessage(result.error || "Failed to add staff");
          setMessageType("error");
        }
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (!result.success) {
        setMessage(result.error || "Failed to add staff");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setMessage("Staff added successfully!");
      setMessageType("success");
      setEmployee(defaultEmployee);
      setIsModified(false);
      if (messageTimer.current) clearTimeout(messageTimer.current);
      messageTimer.current = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
    } catch (err) {
      console.error("Submission error:", err);
      setMessage("An unexpected error occurred. Please try again.");
      setMessageType("error");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmployee(defaultEmployee);
    setIsModified(false);
    setMessage("Form is reset now");
    setMessageType("success");
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 2000);
  };

  const fields = Object.keys(employee);
  const table12 = [fields.slice(0, 8), fields.slice(8, 16)];

  return (
    <>
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 pt-16 px-4 pb-4">
        <div className="bg-white p-6 rounded-lg shadow-lg min-h-[70vh] w-full max-w-screen-xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-700 m-6">
            ETMAM Staff Form
          </h2>
          {message && (
            <p
              className={`text-center text-sm mb-4 ${
                messageType === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {message}
            </p>
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
                              } whitespace-nowrap`}
                            >
                              {key1.replace(/([A-Z])/g, " $1").trim()}
                            </td>
                            <td className="p-1">
                              {key1 === "department" ? (
                                <select
                                  name="department"
                                  value={employee.department}
                                  onChange={handleChange}
                                  className="w-full p-1 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                  <option value="">Select Department</option>
                                  {departments.map((dept, idx) => (
                                    <option key={idx} value={dept}>
                                      {dept}
                                    </option>
                                  ))}
                                </select>
                              ) : (
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
                                  required={["name"].includes(key1)}
                                />
                              )}
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
                                checked={employee[`${key}Type`] === "provided"}
                                onChange={handleChange}
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
                                  checked={employee[`${key}Type`] === "percent"}
                                  onChange={handleChange}
                                  className="mr-1"
                                />
                                Percent ({percentage * 100}%)
                              </label>
                            )}
                            <label className="p-1">
                              <input
                                type="radio"
                                name={`${key}Type`}
                                value="manual"
                                checked={employee[`${key}Type`] === "manual"}
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

                      {/* Employee Status & Source */}
                      <tr className="border-b border-gray-200">
                        <td colSpan="2" className="p-1">
                          <div className="flex w-full">
                            <div className="w-1/2 pr-1">
                              <select
                                name="staffStatus"
                                value={employee.staffStatus}
                                onChange={handleChange}
                                className="w-full p-1 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              >
                                <option value="">Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="On hold">On hold</option>
                                <option value="On vacation">On vacation</option>
                              </select>
                            </div>
                            <div className="w-1/2 pl-1">
                              <select
                                name="staffSource"
                                value={employee.staffSource}
                                onChange={handleChange}
                                className="w-full p-1 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              >
                                <option value="">Source</option>
                                <option value="local">Local</option>
                                <option value="overseas">Overseas</option>
                              </select>
                            </div>
                          </div>
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
                            value={totalSalary}
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
                onClick={handleSubmit}
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

            {/* ExcelUpload Container */}
            <div className="ml-auto">
              <div className="w-auto min-w-[200px]">
                <EtmamEmployeesUpload />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
