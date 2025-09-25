"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export default function JobApplicationForm() {
  const params = useParams();
  const job_id = params.id;

  const [formData, setFormData] = useState({
    applicantName: "",
    applicantMobileNo: "",
    applicantNationality: "",
    applicantPassportIqama: "",
    applicantCity: "",
    applicantExperienceYears: "",
    applicantIsNoticePeriod: "No",
    applicantNoticePeriodDays: "0",
    applicantCurrentSalary: "",
    applicantExpectedSalary: "",
    applicantCV: null,
    applicantDescription: "",
    jobId: job_id || "",
  });

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const infoRef = useRef(null);

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.applicantName.trim())
      newErrors.applicantName = "Name is required";

    // if (!/^[1-9][0-9]{9}$/.test(formData.applicantMobileNo)) {
    //   newErrors.applicantMobileNo =
    //     "Mobile number must be exactly 10 digits and cannot start with 0";
    // }
    if (!formData.applicantMobileNo.trim())
      newErrors.applicantMobileNo = "Mobile number is required";
    if (!formData.applicantNationality.trim())
      newErrors.applicantNationality = "Nationality is required";

    if (!formData.applicantPassportIqama.trim())
      newErrors.applicantPassportIqama = "Passport/ Iqama is required";

    if (!formData.applicantCity.trim())
      newErrors.applicantCity = "City is required";

    if (
      formData.applicantIsNoticePeriod === "Yes" &&
      !formData.applicantNoticePeriodDays.trim()
    ) {
      newErrors.applicantNoticePeriodDays = "Notice period days is required";
    }
    if (!formData.applicantExperienceYears.trim()) {
      newErrors.applicantExperienceYears = "Experience is required";
    } else if (
      isNaN(formData.applicantExperienceYears) ||
      formData.applicantExperienceYears < 0
    ) {
      newErrors.applicantExperienceYears = "Enter a valid number of years";
    }

    if (formData.applicantDescription.trim()) {
      const wordCount = formData.applicantDescription
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

      if (wordCount > 500) {
        newErrors.applicantDescription =
          "Description must not exceed 500 words";
      }
    }

    return newErrors;
  };

  // ✅ Unified change handler
  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    // File upload
    if (type === "file") {
      const file = files?.[0];
      if (!file) return;

      if (file.size > 500 * 1024) {
        setFormData({ ...formData, applicantCV: null });
        setErrors({
          ...errors,
          applicantCV: "File size must be less than 500KB",
        });
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        setFormData({ ...formData, applicantCV: null });
        setErrors({
          ...errors,
          applicantCV: "Only PDF or Word documents are allowed",
        });
        return;
      }

      setFormData({ ...formData, [name]: file });
      if (errors[name]) setErrors({ ...errors, [name]: "" });
      return;
    }

    // ✅ Special handling for mobile number
    if (name === "applicantMobileNo") {
      let cleaned = value.replace(/\D/g, ""); // only digits
      if (cleaned.length > 10) {
        cleaned = cleaned.slice(0, 10); // enforce max 10 digits
      }
      setFormData({ ...formData, [name]: cleaned });
      if (errors[name]) setErrors({ ...errors, [name]: "" });
      return;
    }

    // Radio for Notice Period
    if (name === "applicantIsNoticePeriod") {
      setFormData({
        ...formData,
        [name]: value,
        applicantNoticePeriodDays:
          value === "No" ? "0" : formData.applicantNoticePeriodDays || "0",
      });
    } else {
      // Normal text/number inputs
      setFormData({ ...formData, [name]: value });
    }

    // Clear error
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  // ✅ Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== "applicantCV") {
          formPayload.append(key, formData[key]);
        }
      });

      if (formData.applicantCV) {
        formPayload.append("applicantCV", formData.applicantCV);
      }

      formPayload.append("jobId", formData.jobId);

      const res = await fetch("/api/talent_acquisition/job_applicant", {
        method: "POST",
        body: formPayload,
      });

      const result = await res.json();

      if (result.success) {
        setMessage({ text: "Form submitted successfully.", type: "success" });
        setFormData({
          applicantName: "",
          applicantMobileNo: "",
          applicantNationality: "",
          applicantPassportIqama: "",
          applicantCity: "",
          applicantExperienceYears: "",
          applicantIsNoticePeriod: "",
          applicantNoticePeriodDays: "0",
          applicantCurrentSalary: "",
          applicantExpectedSalary: "",
          applicantCV: null,
          applicantDescription: "",
        });
        setErrors({});
      } else {
        setMessage({
          text: `Error: ${result.result || result.error}`,
          type: "error",
        });
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: "Failed to submit data.", type: "error" });
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
  const wordCount = formData.applicantDescription
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-gradient-to-br from-gray-30 to-gray-60 rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Application Form
      </h2>

      <div className="min-h-[24px] mb-4 text-center">
        {message && (
          <p
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
          { label: "Name*", name: "applicantName", placeholder: "Enter Name" },
          {
            label: "Mobile No.*",
            name: "applicantMobileNo",
            placeholder: "Enter Mobile No.",
            type: "text",
          },
          {
            label: "Nationality*",
            name: "applicantNationality",
            placeholder: "Enter Nationality",
          },
          {
            label: "Passport/ Iqama*",
            name: "applicantPassportIqama",
            placeholder: "Enter Passport or Iqama",
          },
          { label: "City*", name: "applicantCity", placeholder: "Enter City" },
          {
            label: "Experience (Years)*",
            name: "applicantExperienceYears",
            placeholder: "Enter years",
            type: "number",
          },
          {
            label: "Current Salary",
            name: "applicantCurrentSalary",
            placeholder: "Enter Current Salary",
          },
          {
            label: "Expected Salary",
            name: "applicantExpectedSalary",
            placeholder: "Enter Expected Salary",
          },
        ].map(({ label, name, placeholder, type = "text" }) => (
          <div key={name} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              placeholder={placeholder}
              inputMode={name === "applicantMobileNo" ? "numeric" : undefined}
              maxLength={name === "applicantMobileNo" ? 10 : undefined}
              className={`p-2 border rounded-md focus:ring-1 focus:ring-indigo-500 text-sm ${
                errors[name] ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors[name] && (
              <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
            )}
          </div>
        ))}

        {/* Notice Period */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Notice Period
          </label>
          <div className="flex space-x-4">
            {["Yes", "No"].map((val) => (
              <label key={val} className="flex items-center space-x-2 text-sm">
                <input
                  type="radio"
                  name="applicantIsNoticePeriod"
                  value={val}
                  checked={formData.applicantIsNoticePeriod === val}
                  onChange={handleChange}
                />
                <span>{val}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notice Period Days */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Notice Period Days
          </label>
          <input
            type="number"
            name="applicantNoticePeriodDays"
            min={0}
            value={formData.applicantNoticePeriodDays}
            onChange={handleChange}
            placeholder="Days"
            disabled={formData.applicantIsNoticePeriod === "No"}
            className={`p-2 border rounded-md focus:ring-1 focus:ring-indigo-500 text-sm ${
              errors.applicantNoticePeriodDays
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
        </div>

        {/* Upload CV */}
        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Upload CV
          </label>
          <input
            key={formData.applicantCV ? formData.applicantCV.name : "empty"}
            type="file"
            name="applicantCV"
            accept=".pdf,.doc,.docx"
            onChange={handleChange}
            className={`p-2 border rounded-md text-sm ${
              errors.applicantCV ? "border-red-500" : "border-gray-300"
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-medium">Only PDF, DOC, DOCX</span> — Max size:{" "}
            <span className="font-medium">500KB</span>.
          </p>
          <div className="h-5 mt-1 text-xs">
            {errors.applicantCV ? (
              <span className="text-red-500">{errors.applicantCV}</span>
            ) : formData.applicantCV ? (
              <span className="text-green-600">
                ✅ {formData.applicantCV.name} uploaded successfully
              </span>
            ) : null}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Additional Information
          </label>
          <textarea
            name="applicantDescription"
            value={formData.applicantDescription}
            onChange={handleChange}
            rows={4}
            placeholder="Write something..."
            className={`p-2 border rounded-md text-sm focus:ring-1 focus:ring-indigo-500 ${
              errors.applicantDescription ? "border-red-500" : "border-gray-300"
            }`}
          />
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
            className="bg-indigo-600 text-white py-2 px-6 rounded-md text-sm font-medium hover:bg-indigo-700 transition disabled:bg-indigo-400"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
