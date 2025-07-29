"use client";

import { useState, useEffect } from "react";

export default function AccomodationTransportForm() {
  const [formData, setFormData] = useState({
    checkinId: "",
    checkinName: "",
    nationality: "",
    passportNumber: "",
    iqamaNumber: "",
    clientName: "",
    clientNumber: "",
    location: "",
    contractType: "Accomodation",
    checkinDate: "",
    checkoutDate: "",
    checkinStatus: "Active",
  });

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.checkinId.trim()) newErrors.checkinId = "Check-in ID is required";
    if (!formData.checkinName.trim()) newErrors.checkinName = "Name is required";
    if (!formData.nationality.trim()) newErrors.nationality = "Nationality is required";
    if (!formData.passportNumber.trim()) newErrors.passportNumber = "Passport Number is required";
    if (!formData.clientName.trim()) newErrors.clientName = "Client Name is required";
    if (!formData.clientNumber.trim()) newErrors.clientNumber = "Client Number is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.checkinDate) newErrors.checkinDate = "Check-in Date is required";
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    const payload = { ...formData };

    try {
      const res = await fetch("/api/accomodation_transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        setMessage({ text: "Check-in data inserted successfully.", type: "success" });
        setFormData({
          checkinId: "",
          checkinName: "",
          nationality: "",
          passportNumber: "",
          iqamaNumber: "",
          clientName: "",
          clientNumber: "",
          location: "",
          contractType: "Accomodation",
          checkinDate: "",
          checkoutDate: "",
          checkinStatus: "Active",
        });
        setErrors({});
      } else {
        setMessage({ text: `Error: ${result.result || result.error}`, type: "error" });
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: "Failed to submit data.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
  if (message) {
    const timer = setTimeout(() => setMessage(null), 2000);
    return () => clearTimeout(timer);
  }
}, [message]);

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-gradient-to-br from-gray-30 to-gray-60 rounded-2xl shadow-xl mt-40">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Workers/ Check-in Form</h2>

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

<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {[
    { label: "ID No.", name: "checkinId" },
    { label: "Name", name: "checkinName" },
    { label: "Nationality", name: "nationality" },
    { label: "Passport Number", name: "passportNumber" },
    { label: "Iqama Number", name: "iqamaNumber" },
    { label: "Client Name", name: "clientName" },
    { label: "Client Number", name: "clientNumber" },
    { label: "Location", name: "location" },
  ].map(({ label, name }) => (
    <div key={name} className="flex items-center">
      <label className="text-sm font-medium text-gray-700 w-1/3">{label}</label>
      <input
        type="text"
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className={`w-2/3 p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
          errors[name] ? "border-red-500" : "border-gray-300"
        }`}
        required={name !== "iqamaNumber"}
      />
      {errors[name] && (
        <p className="mt-1 text-sm text-red-600 animate-pulse">{errors[name]}</p>
      )}
    </div>
  ))}

  <div className="flex items-center">
    <label className="text-sm font-medium text-gray-700 w-1/3">Contract Type</label>
    <select
      name="contractType"
      value={formData.contractType}
      onChange={handleChange}
      className="w-2/3 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
      required
    >
      <option>Accomodation</option>
      <option>Transport</option>
      <option>Acc & Trans</option>
    </select>
  </div>

  <div className="flex items-center">
    <label className="text-sm font-medium text-gray-700 w-1/3">Check-in Date</label>
    <input
      type="date"
      name="checkinDate"
      value={formData.checkinDate}
      onChange={handleChange}
      className={`w-2/3 p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
        errors.checkinDate ? "border-red-500" : "border-gray-300"
      }`}
      required
    />
    {errors.checkinDate && (
      <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.checkinDate}</p>
    )}
  </div>

  <div className="flex items-center">
    <label className="text-sm font-medium text-gray-700 w-1/3">Check-out Date</label>
    <input
      type="date"
      name="checkoutDate"
      value={formData.checkoutDate}
      onChange={handleChange}
      className="w-2/3 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
    />
  </div>

  <div className="flex items-center">
    <label className="text-sm font-medium text-gray-700 w-1/3">Status</label>
    <select
      name="checkinStatus"
      value={formData.checkinStatus}
      onChange={handleChange}
      className="w-2/3 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
      required
    >
      <option>Active</option>
      <option>Inactive</option>
    </select>
  </div>

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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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