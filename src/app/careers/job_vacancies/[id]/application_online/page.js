"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";

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

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const infoRef = useRef(null);

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.applicantName.trim())
      newErrors.applicantName = "Name is required";
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

    if (type === "file") {
      const file = files?.[0];
      if (!file) return;

      if (file.size > 500 * 1024) {
        setFormData({ ...formData, applicantCV: null });
        setErrors({
          ...errors,
          applicantCV: "File size must be less than 500KB",
        });
        toast.error("File size must be less than 500KB");
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
        toast.error("Only PDF or Word documents are allowed");
        return;
      }

      setFormData({ ...formData, [name]: file });
      if (errors[name]) setErrors({ ...errors, [name]: "" });
      return;
    }

    if (name === "applicantMobileNo") {
      let cleaned = value.replace(/\D/g, "");
      if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
      setFormData({ ...formData, [name]: cleaned });
      if (errors[name]) setErrors({ ...errors, [name]: "" });
      return;
    }

    if (name === "applicantIsNoticePeriod") {
      setFormData({
        ...formData,
        [name]: value,
        applicantNoticePeriodDays:
          value === "No" ? "0" : formData.applicantNoticePeriodDays || "0",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  // ✅ Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the highlighted errors");
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
        toast.success("Form submitted successfully 🎉");
        setFormData({
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
        });
        setErrors({});
      } else {
        toast.error(`Error: ${result.result || result.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit data");
    } finally {
      setIsLoading(false);
    }
  };

  const wordCount = formData.applicantDescription
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8 sm:py-12 bg-gradient-to-tr from-blue-600 via-blue-500 to-green-400">
      {/* Blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      {/* Form container */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 mx-4 sm:mx-auto max-w-lg w-full z-10">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="h-25 w-auto mb-2"
          />
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Application Form
          </h2>
        </div>

        {/* form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {/* Text fields */}
          {[
            {
              label: "Name",
              name: "applicantName",
              placeholder: "Enter Name",
              required: true,
            },
            {
              label: "Mobile No.",
              name: "applicantMobileNo",
              placeholder: "Enter Mobile No.",
              type: "text",
              required: true,
            },
            {
              label: "Nationality",
              name: "applicantNationality",
              placeholder: "Enter Nationality",
              required: true,
            },
            {
              label: "Passport/ Iqama",
              name: "applicantPassportIqama",
              placeholder: "Enter Passport or Iqama",
              required: true,
            },
            {
              label: "City",
              name: "applicantCity",
              placeholder: "Enter City",
              required: true,
            },
            {
              label: "Experience (Years)",
              name: "applicantExperienceYears",
              placeholder: "Enter years",
              type: "number",
              required: true,
            },
            {
              label: "Current Salary",
              name: "applicantCurrentSalary",
              placeholder: "Enter Current Salary",
              required: false,
            },
            {
              label: "Expected Salary",
              name: "applicantExpectedSalary",
              placeholder: "Enter Expected Salary",
              required: false,
            },
          ].map(({ label, name, placeholder, type = "text", required }) => (
            <div key={name} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500">*</span>}
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
                <label
                  key={val}
                  className="flex items-center space-x-2 text-sm"
                >
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
              <span className="font-medium">Only PDF, DOC, DOCX</span> — Max
              size: <span className="font-medium">500KB</span>.
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
                errors.applicantDescription
                  ? "border-red-500"
                  : "border-gray-300"
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
    </div>
  );
}
