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

  // ✅ validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.jobId.trim()) newErrors.jobId = "Job ID is required";
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job Title is required";
    if (!formData.jobLocation.trim())
      newErrors.jobLocation = "Job location is required";
    if (!formData.jobOpeningDate.trim())
      newErrors.jobOpeningDate = "Job opening date is required";

    if (formData.jobDescription.trim()) {
      const wordCount = formData.jobDescription
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      if (wordCount > 2000)
        newErrors.jobDescription = "Description must not exceed 2000 words";
    }

    // Closing date should not be before opening date
    if (formData.jobClosingDate && formData.jobOpeningDate) {
      const open = new Date(formData.jobOpeningDate);
      const close = new Date(formData.jobClosingDate);
      if (close < open)
        newErrors.jobClosingDate = "Closing date cannot be before opening date";
    }

    return newErrors;
  };

  // ✅ universal input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
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

    try {
      const res = await fetch("/api/talent_acquisition/job_management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const result = await res.json();

      if (result.success) {
        setMessage({ text: "Form submitted successfully.", type: "success" });
        // reset form
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
          text: `Error: ${result.error || "Unknown error"}`,
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

  // ✅ auto-clear success/error messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ✅ info popup outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    }
    if (showInfo) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInfo]);

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-gradient-to-br from-gray-30 to-gray-60 rounded-2xl shadow-xl mt-20 mb-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Job Post
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
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Basic text inputs */}
        {[
          { label: "Job ID", name: "jobId", placeholder: "Enter Job ID" },
          {
            label: "Job Title",
            name: "jobTitle",
            placeholder: "Enter Job Title",
          },
          {
            label: "Location",
            name: "jobLocation",
            placeholder: "Enter Location",
          },
          {
            label: "Key Skills (comma-separated)",
            name: "jobKeySkills",
            placeholder: "Enter Key Skills",
          },
          {
            label: "Salary",
            name: "jobSalary",
            placeholder: "e.g. 5k–6k/mo",
          },
        ].map(({ label, name, placeholder }) => (
          <div key={name} className="flex flex-col">
            <label className="text-medium font-medium text-gray-700 flex items-center gap-2">
              {label}
              {name === "jobKeySkills" && (
                <span className="relative" ref={infoRef}>
                  <button
                    type="button"
                    onClick={() => setShowInfo((s) => !s)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Key skills help"
                  >
                    <FaCircleInfo />
                  </button>
                  {showInfo && (
                    <div className="absolute z-10 mt-2 w-64 rounded-lg border bg-white p-3 text-xs text-gray-700 shadow-lg">
                      Add core skills separated by commas.
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
              className={`p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                errors[name] ? "border-red-500" : "border-gray-300"
              } bg-gray-100`}
            />
            {errors[name] && (
              <p className="mt-1 text-sm text-red-600 animate-pulse">
                {errors[name]}
              </p>
            )}
          </div>
        ))}

        {/* Dates */}
        <div className="flex flex-col">
          <label className="text-medium font-medium text-gray-700">
            Opening Date
          </label>
          <input
            type="date"
            name="jobOpeningDate"
            value={formData.jobOpeningDate}
            onChange={handleChange}
            className={`p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
              errors.jobOpeningDate ? "border-red-500" : "border-gray-300"
            } bg-gray-100`}
          />
          {errors.jobOpeningDate && (
            <p className="mt-1 text-sm text-red-600 animate-pulse">
              {errors.jobOpeningDate}
            </p>
          )}
        </div>
        <div className="flex flex-col">
          <label className="text-medium font-medium text-gray-700">
            Closing Date
          </label>
          <input
            type="date"
            name="jobClosingDate"
            value={formData.jobClosingDate}
            onChange={handleChange}
            min={formData.jobOpeningDate || undefined}
            className={`p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
              errors.jobClosingDate ? "border-red-500" : "border-gray-300"
            } bg-gray-100`}
          />
          {errors.jobClosingDate && (
            <p className="mt-1 text-sm text-red-600 animate-pulse">
              {errors.jobClosingDate}
            </p>
          )}
        </div>

        {/* Benefits */}
        <div className="flex flex-col md:col-span-2">
          <label className="text-medium font-medium text-gray-700 mb-2">
            Benefits (optional)
          </label>
          <textarea
            name="jobBenefits"
            value={formData.jobBenefits}
            onChange={handleChange}
            placeholder="Perks, insurance, bonus, WFH policy, etc."
            rows={3}
            className={`p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
              errors.jobBenefits ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.jobBenefits && (
            <p className="mt-1 text-sm text-red-600 animate-pulse">
              {errors.jobBenefits}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col md:col-span-2">
          <label className="text-medium font-medium text-gray-700 mb-2">
            Job Description (max 2000 words)
          </label>
          <textarea
            name="jobDescription"
            value={formData.jobDescription}
            onChange={handleChange}
            placeholder="Describe responsibilities, required skills, and nice-to-haves."
            rows={6}
            className={`p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
              errors.jobDescription ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.jobDescription && (
            <p className="mt-1 text-sm text-red-600 animate-pulse">
              {errors.jobDescription}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.jobDescription.trim().split(/\s+/).filter(Boolean).length}{" "}
            / 2000 words
          </p>
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-indigo-600 text-white py-2 px-8 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center ${
              isLoading ? "opacity-75" : ""
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
