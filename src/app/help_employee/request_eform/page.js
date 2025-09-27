"use client";

import { useState, useEffect, useMemo } from "react";

export default function CaseManagementForm() {
  const [formData, setFormData] = useState({
    cmName: "",
    cmMobileNo: "",
    cmEmail: "",
    cmNationality: "",
    cmPassportIqama: "",
    cmCity: "",
    cmClientName: "",
    cmComplaintDescription: "",
  });

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {};

    // Trimmed values for validation
    const name = formData.cmName.trim();
    const mobile = formData.cmMobileNo.trim();
    const email = formData.cmEmail.trim();
    const nationality = formData.cmNationality.trim();
    const passport = formData.cmPassportIqama.trim();
    const city = formData.cmCity.trim();
    const client = formData.cmClientName.trim();
    const description = formData.cmComplaintDescription.trim();

    if (!name) newErrors.cmName = "Name is required";

    if (!mobile) {
      newErrors.cmMobileNo = "Mobile number is required";
    }

    // if (!email) {
    //   newErrors.cmEmail = "Email is required";
    // } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    //   newErrors.cmEmail = "Enter a valid email address";
    // }

    if (!nationality) newErrors.cmNationality = "Nationality is required";

    if (!passport) newErrors.cmPassportIqama = "Passport/ Iqama is required";

    // if (!city) newErrors.cmCity = "City is required";

    if (!client) newErrors.cmClientName = "Client name is required";

    if (description) {
      const wordCount = description.split(/\s+/).filter(Boolean).length;
      if (wordCount > 500) {
        newErrors.cmComplaintDescription =
          "Description must not exceed 500 words";
      }
    }

    return newErrors;
  };

  // ✅ Unified change handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "cmMobileNo") {
      let cleaned = value.replace(/\D/g, ""); // only digits
      if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
      setFormData({ ...formData, [name]: cleaned });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear error when user starts typing
    if (errors[name]) {
      const { [name]: removed, ...rest } = errors;
      setErrors(rest);
    }
  };

  // ✅ Handle submit with improved error handling
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Trim all values before sending
      const normalizedData = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v.trim()])
      );

      // Convert camelCase → snake_case
      const payload = {
        cm_name: normalizedData.cmName,
        cm_mobile_no: normalizedData.cmMobileNo,
        cm_email: normalizedData.cmEmail || null,
        cm_nationality: normalizedData.cmNationality,
        cm_passport_iqama: normalizedData.cmPassportIqama,
        cm_city: normalizedData.cmCity || null,
        cm_client_name: normalizedData.cmClientName,
        cm_complaint_description: normalizedData.cmComplaintDescription,
      };

      const res = await fetch("/api/case_management/employee_request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        // Handle structured backend errors
        if (result?.fieldErrors) {
          setErrors(result.fieldErrors); // e.g., { cmEmail: "Already exists" }
          throw new Error("Validation error from server");
        }
        throw new Error(result?.error || "Server error");
      }

      if (result?.success) {
        setMessage({ text: "Form submitted successfully.", type: "success" });
        setFormData({
          cmName: "",
          cmMobileNo: "",
          cmEmail: "",
          cmNationality: "",
          cmPassportIqama: "",
          cmCity: "",
          cmClientName: "",
          cmComplaintDescription: "",
        });
        setErrors({});
      } else {
        setMessage({
          text: `Error: ${result?.error || "Unknown error"}`,
          type: "error",
        });
      }
    } catch (error) {
      console.error(error);
      setMessage({
        text: `Failed to submit data: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Auto-clear success message
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ✅ Word counter
  const wordCount = useMemo(() => {
    return formData.cmComplaintDescription.trim().split(/\s+/).filter(Boolean)
      .length;
  }, [formData.cmComplaintDescription]);

  return (
    <div className="max-w-4xl mx-auto mt-6 p-6 sm:p-8 bg-gradient-to-br from-gray-30 to-gray-60 rounded-2xl shadow-xl">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        Employee Request Form
      </h2>
      <div className="min-h-[24px] mb-3 text-center">
        {message && (
          <p
            role="alert"
            className={`text-sm font-medium transition-opacity duration-300 ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {/* Text fields */}
        {[
          { label: "Name*", name: "cmName", placeholder: "Enter Name" },
          {
            label: "Mobile No.*",
            name: "cmMobileNo",
            placeholder: "Enter Mobile No.",
            type: "text",
          },
          {
            label: "Email",
            name: "cmEmail",
            placeholder: "Enter Email Id",
            type: "text",
          },
          {
            label: "Nationality*",
            name: "cmNationality",
            placeholder: "Enter Nationality",
          },
          {
            label: "Passport/ Iqama*",
            name: "cmPassportIqama",
            placeholder: "Enter Passport or Iqama",
          },
          { label: "City", name: "cmCity", placeholder: "Enter City" },
          {
            label: "Client Name*",
            name: "cmClientName",
            placeholder: "Enter Client Name",
          },
        ].map(({ label, name, placeholder, type = "text" }) => (
          <div key={name} className="flex flex-col">
            <label
              htmlFor={name}
              className="text-sm font-medium text-gray-700 mb-1"
            >
              {label}
            </label>
            <input
              id={name}
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              placeholder={placeholder}
              inputMode={name === "cmMobileNo" ? "numeric" : undefined}
              maxLength={name === "cmMobileNo" ? 10 : undefined}
              disabled={isLoading}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
              className={`p-2 border rounded-md focus:ring-1 focus:ring-indigo-500 text-sm ${
                errors[name] ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors[name] && (
              <p
                id={`${name}-error`}
                className="text-xs text-red-500 mt-1"
                role="alert"
              >
                {errors[name]}
              </p>
            )}
          </div>
        ))}

        {/* Description */}
        <div className="flex flex-col md:col-span-2">
          <label
            htmlFor="cmComplaintDescription"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Complain Details*
          </label>
          <textarea
            id="cmComplaintDescription"
            name="cmComplaintDescription"
            value={formData.cmComplaintDescription}
            onChange={handleChange}
            rows={4}
            placeholder="Write your complain..."
            disabled={isLoading}
            aria-describedby={
              errors.cmComplaintDescription
                ? "cmComplaintDescription-error"
                : undefined
            }
            className={`p-2 border rounded-md text-sm focus:ring-1 focus:ring-indigo-500 ${
              errors.cmComplaintDescription
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {errors.cmComplaintDescription && (
            <p
              id="cmComplaintDescription-error"
              className="text-xs text-red-500 mt-1"
              role="alert"
            >
              {errors.cmComplaintDescription}
            </p>
          )}
          <p
            className={`text-xs mt-1 ${
              wordCount > 500 ? "text-red-500" : "text-gray-500"
            }`}
          >
            {wordCount} / 500 words
          </p>
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 text-white py-2 px-6 rounded-md text-sm cursor-pointer font-medium hover:bg-indigo-700 transition disabled:bg-indigo-400"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
