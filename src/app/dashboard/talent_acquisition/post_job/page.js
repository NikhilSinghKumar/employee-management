"use client";

import { useState, useEffect, useRef } from "react";
import { FaCircleInfo } from "react-icons/fa6";

export default function JobCreatePost() {
  const [formData, setFormData] = useState({
    jobId: "",
    jobTitle: "",
    jobLocation: "",
    jobOpeningDate: "",
    jobClosingDate: "",
    jobDescription: "",
    jobKeySkills: "",
    jobSalary: "",
    jobBenefits: "",
  });

  const [message, setMessage] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const infoRef = useRef(null);

  // ✅ universal input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.jobId.trim()) newErrors.jobId = "Job ID is required";
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job Title is required";
    if (!formData.jobLocation.trim())
      newErrors.jobLocation = "Job location is required";
    if (!formData.jobOpeningDate.trim())
      newErrors.jobOpeningDate = "Opening date is required";

    if (formData.jobDescription.trim()) {
      const wordCount = formData.jobDescription
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      if (wordCount > 2000)
        newErrors.jobDescription = "Description must not exceed 2000 words";
    }

    if (formData.jobClosingDate && formData.jobOpeningDate) {
      const open = new Date(formData.jobOpeningDate);
      const close = new Date(formData.jobClosingDate);
      if (close < open)
        newErrors.jobClosingDate = "Closing date cannot be before opening date";
    }

    return newErrors;
  };

  // ✅ submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/talent_acquisition/job_management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const result = await res.json();

      if (result.success) {
        setMessage({ text: "Job posted successfully.", type: "success" });
        setFormData({
          jobId: "",
          jobTitle: "",
          jobLocation: "",
          jobOpeningDate: "",
          jobClosingDate: "",
          jobDescription: "",
          jobKeySkills: "",
          jobSalary: "",
          jobBenefits: "",
        });
        setErrors({});
      } else {
        setMessage({
          text: result.error || "Submission failed.",
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

  useEffect(() => {
    document.title = "Job Post";
  });
  // ✅ auto-hide message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="max-w-3xl mx-auto mt-20 mb-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Create Job Post
      </h2>

      {message && (
        <p
          className={`text-sm font-medium text-center mb-4 ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {/* Inputs */}
        {[
          { label: "Job ID", name: "jobId", placeholder: "e.g. J123" },
          {
            label: "Job Title",
            name: "jobTitle",
            placeholder: "Software Engineer",
          },
          { label: "Location", name: "jobLocation", placeholder: "Bangalore" },
          {
            label: "Key Skills",
            name: "jobKeySkills",
            placeholder: "React, Node.js",
            info: "Add core skills separated by commas",
          },
          { label: "Salary", name: "jobSalary", placeholder: "5k–6k/mo" },
        ].map(({ label, name, placeholder, info }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {label}
              {info && (
                <span className="ml-1 relative" ref={infoRef}>
                  <button
                    type="button"
                    onClick={() => setShowInfo((s) => !s)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaCircleInfo className="inline" />
                  </button>
                  {showInfo && (
                    <div className="absolute z-10 mt-2 w-56 rounded-md border bg-white p-2 text-xs text-gray-600 shadow">
                      {info}
                    </div>
                  )}
                </span>
              )}
            </label>
            <input
              type="text"
              name={name}
              value={formData[name]}
              onChange={handleChange}
              placeholder={placeholder}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500 ${
                errors[name] ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors[name] && (
              <p className="mt-1 text-xs text-red-500">{errors[name]}</p>
            )}
          </div>
        ))}

        {/* Dates */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Opening Date
          </label>
          <input
            type="date"
            name="jobOpeningDate"
            value={formData.jobOpeningDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500 ${
              errors.jobOpeningDate ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Closing Date
          </label>
          <input
            type="date"
            name="jobClosingDate"
            value={formData.jobClosingDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500 ${
              errors.jobClosingDate ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>

        {/* Benefits */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Benefits
          </label>
          <textarea
            name="jobBenefits"
            value={formData.jobBenefits}
            onChange={handleChange}
            rows={2}
            placeholder="Perks, insurance, WFH policy..."
            className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500 border-gray-300"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Job Description
          </label>
          <textarea
            name="jobDescription"
            value={formData.jobDescription}
            onChange={handleChange}
            rows={5}
            placeholder="Responsibilities, required skills, etc."
            className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500 border-gray-300"
          />
          <p className="mt-1 text-xs text-gray-400">
            {formData.jobDescription.trim().split(/\s+/).filter(Boolean).length}{" "}
            / 2000 words
          </p>
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-400 flex items-center gap-2"
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
                  d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                ></path>
              </svg>
            )}
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
