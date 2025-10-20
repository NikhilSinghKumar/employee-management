"use client";

import { useState, useEffect } from "react";

const defaultFormData = {
  checkinId: "",
  checkinName: "",
  nationality: "",
  passportNumber: "",
  iqamaNumber: "",
  clientName: "",
  clientNumber: "",
  location: "",
  contractType: "",
  checkinDate: "",
  checkoutDate: "",
  checkinStatus: "",
};

export default function AccommodationTransportForm() {
  const [formData, setFormData] = useState(defaultFormData);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const clearMessage = () => setMessage({ text: "", type: "" });

  const validateForm = () => {
    const newErrors = {};
    if (!formData.checkinId.trim())
      newErrors.checkinId = "Check-in ID is required";
    if (!formData.checkinName.trim())
      newErrors.checkinName = "Name is required";
    if (!formData.nationality.trim())
      newErrors.nationality = "Nationality is required";
    if (!formData.passportNumber.trim())
      newErrors.passportNumber = "Passport Number is required";
    if (!formData.clientName.trim())
      newErrors.clientName = "Client Name is required";
    if (!formData.clientNumber.trim())
      newErrors.clientNumber = "Client Number is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.checkinDate)
      newErrors.checkinDate = "Check-in Date is required";
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    clearMessage();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessage();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // ✅ FIXED: Scroll to message on VALIDATION ERROR
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

    const payload = { ...formData };

    try {
      const res = await fetch("/api/accommodation_transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        setMessage({
          text: "Check-in data inserted successfully.",
          type: "success",
        });
        setFormData(defaultFormData);
        setErrors({});
      } else {
        setMessage({
          text: result.result || result.error || "Submission failed!",
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
    document.title = "Workers Check-in Form";
  }, []);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => clearMessage(), 3000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  // ✅ FIXED: Scroll to message for BOTH success AND error
  useEffect(() => {
    if (message.text) {
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
            Workers Check-in Form
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
                ID No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="checkinId"
                value={formData.checkinId}
                onChange={handleChange}
                placeholder="Enter ID No."
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.checkinId ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.checkinId && (
                <p className="mt-1 text-xs text-red-500">{errors.checkinId}</p>
              )}
            </div>

            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="checkinName"
                value={formData.checkinName}
                onChange={handleChange}
                placeholder="Enter Name"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.checkinName ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.checkinName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.checkinName}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Nationality <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
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

            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Passport Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleChange}
                placeholder="Enter Passport Number"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.passportNumber ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.passportNumber && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.passportNumber}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Iqama Number
                {/* ✅ FIXED: No red * - clearly optional */}
              </label>
              <input
                type="text"
                name="iqamaNumber"
                value={formData.iqamaNumber}
                onChange={handleChange}
                placeholder="Enter Iqama Number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
              />
            </div>

            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="Enter Client Name"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.clientName ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.clientName && (
                <p className="mt-1 text-xs text-red-500">{errors.clientName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Client Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="clientNumber"
                value={formData.clientNumber}
                onChange={handleChange}
                placeholder="Enter Client Number"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.clientNumber ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.clientNumber && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.clientNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter Location"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.location ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.location && (
                <p className="mt-1 text-xs text-red-500">{errors.location}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Contract Type <span className="text-red-500">*</span>
              </label>
              <select
                name="contractType"
                value={formData.contractType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                required
              >
                <option value="">Select Contract Type</option>
                <option>Accommodation</option>
                <option>Transport</option>
                <option>Acc & Trans</option>
              </select>
            </div>

            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="checkinStatus"
                value={formData.checkinStatus}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
                required
              >
                <option value="">Select Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Check-in Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="checkinDate"
                value={formData.checkinDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white ${
                  errors.checkinDate ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.checkinDate && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.checkinDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                Check-out Date
              </label>
              <input
                type="date"
                name="checkoutDate"
                value={formData.checkoutDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition bg-white"
              />
            </div>
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isLoading ? "Submitting..." : "Submit Check-in"}
          </button>
        </form>
      </div>
    </div>
  );
}
