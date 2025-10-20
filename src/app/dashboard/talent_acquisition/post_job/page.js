"use client";

import { useState, useEffect, useRef } from "react";
import { FaCircleInfo } from "react-icons/fa6";

const defaultFormData = {
  jobId: "",
  jobTitle: "",
  jobLocation: "",
  jobOpeningDate: "",
  jobClosingDate: "",
  jobDescription: "",
  jobKeySkills: "",
  jobSalary: "",
  jobBenefits: "",
};

export default function JobCreatePost() {
  const [formData, setFormData] = useState(defaultFormData);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeInfo, setActiveInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const infoRef = useRef(null);

  const clearMessage = () => setMessage({ text: "", type: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    clearMessage();
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessage();

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
        setMessage({
          text: "Job posted successfully.",
          type: "success",
        });
        setFormData(defaultFormData);
        setErrors({});
      } else {
        setMessage({
          text: result.error || "Submission failed!",
          type: "error",
        });
      }
    } catch (error) {
      console.error(error);
      setMessage({
        text: "Server error. Please try again later.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Create Job Post";
  }, []);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => clearMessage(), 3000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  // shows success message on submission
  useEffect(() => {
    if (message.text && message.type === "success") {
      const messageElement = document.querySelector(".animate-fade-in");
      if (messageElement) {
        messageElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [message.text]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 w-[95%] sm:w-full max-w-3xl border border-[#cfd8df] mx-auto">
        <div className="flex flex-col items-center mb-2">
          <h1 className="text-2xl font-semibold text-[#4A5A6A] text-center">
            Create Job Post
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Job ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="jobId"
                value={formData.jobId}
                onChange={handleChange}
                placeholder="e.g. J123"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.jobId ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.jobId && (
                <p className="mt-1 text-xs text-red-500">{errors.jobId}</p>
              )}
            </div>

            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="Software Engineer"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.jobTitle ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.jobTitle && (
                <p className="mt-1 text-xs text-red-500">{errors.jobTitle}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="jobLocation"
                value={formData.jobLocation}
                onChange={handleChange}
                placeholder="Bangalore"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.jobLocation ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.jobLocation && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.jobLocation}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Salary
              </label>
              <input
                type="text"
                name="jobSalary"
                value={formData.jobSalary}
                onChange={handleChange}
                placeholder="₹5L–₹6L / annum"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Opening Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="jobOpeningDate"
                value={formData.jobOpeningDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.jobOpeningDate ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.jobOpeningDate && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.jobOpeningDate}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Closing Date
              </label>
              <input
                type="date"
                name="jobClosingDate"
                value={formData.jobClosingDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.jobClosingDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.jobClosingDate && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.jobClosingDate}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
              Key Skills
              <span className="ml-1 relative" ref={infoRef}>
                <button
                  type="button"
                  onClick={() =>
                    setActiveInfo(
                      activeInfo === "jobKeySkills" ? null : "jobKeySkills"
                    )
                  }
                  className="text-gray-400 hover:text-[#4A5A6A] ml-1"
                >
                  <FaCircleInfo className="inline text-xs" />
                </button>
                {activeInfo === "jobKeySkills" && (
                  <div className="absolute z-10 mt-2 w-56 rounded-lg border bg-white p-2 text-xs text-gray-600 shadow-lg">
                    Add core skills separated by commas
                  </div>
                )}
              </span>
            </label>
            <input
              type="text"
              name="jobKeySkills"
              value={formData.jobKeySkills}
              onChange={handleChange}
              placeholder="React, Node.js"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
            />
          </div>

          <div>
            <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
              Benefits
            </label>
            <textarea
              name="jobBenefits"
              value={formData.jobBenefits}
              onChange={handleChange}
              rows={2}
              placeholder="Perks, insurance, WFH policy..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition resize-none bg-white"
            />
          </div>

          <div>
            <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
              Job Description
            </label>
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              rows={5}
              placeholder="Responsibilities, required skills, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition resize-none bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              {
                formData.jobDescription.trim().split(/\s+/).filter(Boolean)
                  .length
              }{" "}
              / 2000 words
            </p>
            {errors.jobDescription && (
              <p className="mt-1 text-xs text-red-500">
                {errors.jobDescription}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`max-w-xs w-full md:max-w-sm py-2.5 rounded-lg text-white font-medium transition-all duration-200 ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#4A5A6A] hover:bg-[#3b4b59] hover:shadow-md"
            } flex items-center justify-center gap-2 mx-auto`}
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
            {isLoading ? "Submitting..." : "Create Job Post"}
          </button>
        </form>
      </div>
    </div>
  );
}
