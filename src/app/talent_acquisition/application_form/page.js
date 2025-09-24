"use client";

import { useState, useEffect, useRef } from "react";
import { FaCircleInfo } from "react-icons/fa6";

export default function AccommodationTransportForm() {
  const [formData, setFormData] = useState({
    applicantName: "",
    applicantMobileNo: "",
    applicantNationality: "",
    applicantPassportIqama: "",
    applicantCity: "",
    applicantProfession: "",
    applicantIsNoticePeriod: "No",
    applicantNoticePeriodDays: "0",
    applicantCurrentSalary: "",
    applicantExpectedSalary: "",
    applicantCV: null,
    applicantDescription: "",
  });

  const [message, setMessage] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const infoRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.applicantName.trim())
      newErrors.applicantName = "Name is required";
    if (!formData.applicantMobileNo.trim())
      newErrors.applicantMobileNo = "Mobile No. is required";
    if (!formData.applicantNationality.trim())
      newErrors.applicantNationality = "Nationality is required";
    if (!formData.applicantPassportIqama.trim())
      newErrors.applicantPassportIqama = "Passport/ Iqama is required";
    if (!formData.applicantCity.trim())
      newErrors.applicantCity = "City is required";
    if (!formData.applicantProfession.trim())
      newErrors.applicantProfession = "Profession is required";
    if (!formData.applicantIsNoticePeriod.trim())
      newErrors.applicantIsNoticePeriod = "Notice period is required";
    if (
      formData.applicantIsNoticePeriod === "Yes" &&
      !formData.applicantNoticePeriodDays.trim()
    ) {
      newErrors.applicantNoticePeriodDays = "Notice period days is required";
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

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "applicantCV") {
      const file = files[0];
      if (file) {
        // validate file size (max 500KB)
        if (file.size > 500 * 1024) {
          setErrors({
            ...errors,
            applicantCV: "File size must be less than 500KB",
          });
          return;
        }

        // validate file type
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(file.type)) {
          setErrors({
            ...errors,
            applicantCV: "Only PDF or Word documents are allowed",
          });
          return;
        }

        // set file if valid
        setFormData({
          ...formData,
          [name]: file,
        });

        // clear error if any
        if (errors[name]) {
          setErrors({ ...errors, [name]: "" });
        }
      }
    }

    // Special logic for Notice Period radio
    if (name === "applicantIsNoticePeriod") {
      if (value === "No") {
        setFormData({
          ...formData,
          [name]: value,
          applicantNoticePeriodDays: "0", // reset to 0
        });
      } else {
        setFormData({
          ...formData,
          [name]: value,
          applicantNoticePeriodDays: formData.applicantNoticePeriodDays || "0", // keep existing or 0
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ validate form before sending
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Build FormData (handles text + file)
      const formPayload = new FormData();

      // Append all text fields except file
      Object.keys(formData).forEach((key) => {
        if (key !== "applicantCV") {
          formPayload.append(key, formData[key]);
        }
      });

      // Append file (if uploaded)
      if (formData.applicantCV) {
        formPayload.append("applicantCV", formData.applicantCV);
      }

      // ✅ Send request (NO headers for Content-Type, browser sets it)
      const res = await fetch("/api/*", {
        method: "POST",
        body: formPayload,
        credentials: "include",
      });

      const result = await res.json();

      if (result.success) {
        setMessage({
          text: "Form submitted successfully.",
          type: "success",
        });

        // ✅ reset form state (keep applicantCV null after upload)
        setFormData({
          applicantName: "",
          applicantMobileNo: "",
          applicantNationality: "",
          applicantPassportIqama: "",
          applicantCity: "",
          applicantProfession: "",
          applicantIsNoticePeriod: "",
          applicantNoticePeriodDays: "",
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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    }

    if (showInfo) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showInfo]);

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-gradient-to-br from-gray-30 to-gray-60 rounded-2xl shadow-xl mt-20">
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
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {[
          { label: "Name", name: "applicantName", placeholder: "Enter Name" },
          {
            label: "Mobile No.",
            name: "applicantMobileNo",
            placeholder: "Enter Mobile No.",
          },
          {
            label: "Nationality",
            name: "applicantNationality",
            placeholder: "Enter Nationality",
          },
          {
            label: "Passport/ Iqama",
            name: "applicantPassportIqama",
            placeholder: "Enter Passport or Iqama Number",
          },
          {
            label: "City",
            name: "applicantCity",
            placeholder: "Enter City Name",
          },
          {
            label: "Profession",
            name: "applicantProfession",
            placeholder: "Enter Your Profession",
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
        ].map(({ label, name, placeholder }) => (
          <div key={name} className="flex items-center">
            <label className="text-medium font-medium text-gray-700 w-1/3">
              {label}
            </label>
            <input
              type="text"
              name={name}
              value={formData[name]}
              onChange={handleChange}
              placeholder={placeholder || ""} // Default to empty string if placeholder is undefined
              className={`w-2/3 p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                errors[name] ? "border-red-500" : "border-gray-300"
              } bg-gray-100`}
              required={name !== "applicantPassportIqama"}
            />
            {errors[name] && (
              <p className="mt-1 text-sm text-red-600 animate-pulse">
                {errors[name]}
              </p>
            )}
          </div>
        ))}
        <div className="flex items-center">
          <label className="text-medium font-medium text-gray-700 w-1/3">
            Notice Period
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="applicantIsNoticePeriod"
                value="Yes"
                checked={formData.applicantIsNoticePeriod === "Yes"}
                onChange={handleChange}
                required
              />
              <span>Yes</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="applicantIsNoticePeriod"
                value="No"
                checked={formData.applicantIsNoticePeriod === "No"}
                onChange={handleChange}
              />
              <span>No</span>
            </label>
          </div>
        </div>
        <div className="flex items-center">
          <label className="text-medium font-medium text-gray-700 w-1/3">
            Notice Period Days
          </label>
          <input
            type="number"
            name="applicantNoticePeriodDays"
            step={1}
            min={0}
            value={formData.applicantNoticePeriodDays}
            onChange={handleChange}
            placeholder="Notice Period Days"
            className={`w-2/3 p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
              errors.applicantNoticePeriodDays
                ? "border-red-500"
                : "border-gray-300"
            } bg-gray-100`}
            required={formData.applicantIsNoticePeriod === "Yes"}
            disabled={formData.applicantIsNoticePeriod === "No"}
          />

          {errors.checkinDate && (
            <p className="mt-1 text-sm text-red-600 animate-pulse">
              {errors.applicantNoticePeriodDays}
            </p>
          )}
        </div>
        <div className="flex flex-col md:col-span-2">
          <div className="flex items-center gap-2">
            <label className="text-medium font-medium text-gray-700 whitespace-nowrap">
              Upload CV
            </label>
            <div className="flex items-center gap-2 relative">
              <input
                type="file"
                name="applicantCV"
                accept=".pdf,.doc,.docx"
                onChange={handleChange}
                className={`flex-1 p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                  errors.applicantCV ? "border-red-500" : "border-gray-300"
                }`}
              />

              <div className="relative" ref={infoRef}>
                <FaCircleInfo
                  className="text-gray-500 cursor-pointer hover:text-indigo-500"
                  onClick={() => setShowInfo(!showInfo)}
                  title="Only PDF or Word documents are allowed. Max size 500KB."
                />

                {showInfo && (
                  <div className="absolute top-full mt-1 w-max bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                    Only PDF or Word documents are allowed. Max size 500KB.
                  </div>
                )}
              </div>
            </div>
          </div>
          {errors.applicantCV && (
            <p className="mt-1 text-sm text-red-600 animate-pulse">
              {errors.applicantCV}
            </p>
          )}
        </div>
        <div className="flex flex-col md:col-span-2">
          <label className="text-medium font-medium text-gray-700 mb-2">
            Additional Information (max 500 words)
          </label>
          <textarea
            name="applicantDescription"
            value={formData.applicantDescription}
            onChange={handleChange}
            placeholder="Write something about yourself..."
            rows={6}
            className={`p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
              errors.applicantDescription ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.applicantDescription && (
            <p className="mt-1 text-sm text-red-600 animate-pulse">
              {errors.applicantDescription}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {
              formData.applicantDescription.trim().split(/\s+/).filter(Boolean)
                .length
            }{" "}
            / 500 words
          </p>
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
