"use client";

import { useState } from "react";
import { Loader2, Send, Building2, Mail, Phone, FileText } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function BusinessEnquiryForm() {
  const [formData, setFormData] = useState({
    company_name: "",
    contact_person_name: "",
    company_cr_number: "",
    mobile_no: "",
    email_id: "",
    request_type: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/sales/business_enquiry_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Business enquiry submitted successfully!");
        setFormData({
          company_name: "",
          contact_person_name: "",
          company_cr_number: "",
          mobile_no: "",
          email_id: "",
          request_type: "",
          description: "",
        });
      } else {
        toast.error(result.message || "Failed to submit enquiry.");
      }
    } catch (err) {
      toast.error("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Left */}
      <div className="absolute inset-0 bg-indigo-900 -z-20" />

      {/* Background Right with diagonal cut */}
      <div className="absolute inset-0 bg-blue-600 clip-diagonal -z-10" />

      {/* Toast Container */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          success: { style: { background: "#4ade80", color: "#fff" } },
          error: { style: { background: "#f87171", color: "#fff" } },
        }}
      />

      {/* Foreground Form */}
      <div className="relative z-10 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white shadow-md border border-gray-100 rounded-2xl p-6 sm:p-8 w-full">
          <div className="flex flex-col items-center">
            <img
              src="/logo.png"
              alt="Company Logo"
              className="h-25 w-auto mb-2"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 mr-2" />
              Business Enquiry Form
            </h1>
            <p className="text-gray-600 mb-8">
              Fill in the details below and our team will get back to you
              shortly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                placeholder="Enter company name"
                required
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contact_person_name"
                value={formData.contact_person_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                placeholder="Enter contact person name"
                required
              />
            </div>

            {/* Company CR Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company CR Number<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_cr_number"
                value={formData.company_cr_number}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                placeholder="Enter company registration number"
                required
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500">
                <Phone className="w-5 h-5 text-gray-500 ml-3" />
                <input
                  type="tel"
                  name="mobile_no"
                  value={formData.mobile_no}
                  onChange={handleChange}
                  className="w-full px-3 py-2 focus:outline-none rounded-r-xl"
                  placeholder="Enter mobile number"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email ID<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500">
                <Mail className="w-5 h-5 text-gray-500 ml-3" />
                <input
                  type="email"
                  name="email_id"
                  value={formData.email_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 focus:outline-none rounded-r-xl"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            {/* Request Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request Type<span className="text-red-500">*</span>
              </label>
              <select
                name="request_type"
                value={formData.request_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                required
              >
                <option value="">Select request type</option>
                <option value="Manpower Request (Business Solution)">
                  Manpower Request (Business Solution)
                </option>
                <option value="Accommodation Service Request">
                  Accommodation Service Request
                </option>
                <option value="Talent Acquisition Request">
                  Talent Acquisition Request
                </option>
                <option value="IT Services Request">IT Services Request</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description / Additional Details
              </label>
              <div className="flex items-start border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500">
                <FileText className="w-5 h-5 text-gray-500 ml-2 mt-3 flex-shrink-0" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="flex-1 px-4 py-3 focus:outline-none rounded-r-xl text-base"
                  placeholder="Enter any additional details..."
                ></textarea>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 text-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl shadow-md transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Enquiry
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
