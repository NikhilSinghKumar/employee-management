"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import PreviewQuotationModal from "@/component/quotations/PreviewQuotationModal";
import { Button } from "@/components/ui/button";

const defaultForm = {
  date: "",
  quotation_no: "",
  company_name: "",
  company_cr_number: "",
  company_activity: "",
  signatory: "",
  designation: "",
  mobile_no: "",
  email: "",
  remarks: "",
  person_name: "",
  etmam_commitments: "",
  client_commitments: "",
  general_terms: "",
  quotation_type: "",
  workers_mode: "number",
  no_of_workers: "",
  nationality_mode: "any",
  nationality: "",
  professions: "",
  contract_duration: "",

  // Salary breakdown
  basic_salary: "",
  food_allowance: "",
  accommodation_cost: "",
  transportation_cost: "",
  other_costs: "",
  monthly_cost_per_worker: "0.00",
};

export default function GenerateQuotationPage() {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    document.title = "Generate Quotation";
  }, []);

  // compute monthly cost per worker whenever components change
  useEffect(() => {
    const basic = parseFloat(form.basic_salary) || 0;
    const food = parseFloat(form.food_allowance) || 0;
    const accom = parseFloat(form.accommodation_cost) || 0;
    const trans = parseFloat(form.transportation_cost) || 0;
    const other = parseFloat(form.other_costs) || 0;

    const monthly = basic + food + accom + trans + other;
    setForm((prev) => ({
      ...prev,
      monthly_cost_per_worker: monthly.toFixed(2),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.basic_salary,
    form.food_allowance,
    form.accommodation_cost,
    form.transportation_cost,
    form.other_costs,
  ]);

  const quotationTypeOptions = [
    "Total Package",
    "Cost +",
    "Accommodation & Transportation",
    "Accommodation",
    "Transportation",
    "Talent Acquisition",
    "IT Services",
  ];

  const contractDurations = ["12 months", "24 months"];

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // for radio/select special handling (workers_mode, nationality_mode)
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    // required fields from image and logical required fields
    const required = [
      "date",
      "quotation_no",
      "company_name",
      "company_activity",
      "signatory",
      "designation",
      "mobile_no",
      "email",
      "quotation_type",
      "professions",
      "contract_duration",
    ];

    required.forEach((f) => {
      if (!String(form[f] || "").trim())
        newErrors[f] = `${labelize(f)} is required`;
    });

    // if workers_mode is number, no_of_workers must be numeric
    if (form.workers_mode === "number") {
      if (!String(form.no_of_workers).trim()) {
        newErrors.no_of_workers = "Number of workers is required";
      } else if (!/^\d+$/.test(String(form.no_of_workers).trim())) {
        newErrors.no_of_workers = "Enter a valid integer";
      }
    }

    // nationality specific
    if (
      form.nationality_mode === "specific" &&
      !String(form.nationality).trim()
    ) {
      newErrors.nationality = "Please specify nationality";
    }

    // email format
    if (
      form.email &&
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email)
    ) {
      newErrors.email = "Invalid email format";
    }

    // numeric checks for salary items (if provided)
    [
      "basic_salary",
      "food_allowance",
      "accommodation_cost",
      "transportation_cost",
      "other_costs",
    ].forEach((k) => {
      if (form[k] && isNaN(Number(form[k])))
        newErrors[k] = "Enter a numeric value";
    });

    setErrors(newErrors);
    return newErrors;
  };

  const labelize = (key) =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace("No Of", "No of");

  const handleReset = () => {
    setForm(defaultForm);
    setErrors({});
    toast.success("Form reset successfully");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length) {
      // scroll to first error
      const firstErr = Object.keys(errs)[0];
      const el = document.querySelector(`[name="${firstErr}"]`);
      if (el && el.scrollIntoView)
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/business_quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("API error:", data || res.statusText);
        toast.error(data?.error || `Failed: ${res.status}`);
        return;
      }

      toast.success("Quotation saved/generated successfully");
      setForm(defaultForm);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Server error. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center py-8 px-3">
        <div className="w-full max-w-4xl bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-[#cfd8df] p-10">
          <div className="flex items-center justify-center mt-4 mb-6">
            <h1 className="text-2xl font-semibold text-[#4A5A6A]">
              Generate Quotation
            </h1>
          </div>

          {/* FORM START */}
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* 2️⃣ CLIENT / ENQUIRY DETAILS BELOW */}

            <div className="space-y-4">
              <SectionTitle title="CLIENT / ENQUIRY" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  error={errors.date}
                />
                <InputField
                  label="Quotation No."
                  name="quotation_no"
                  value={form.quotation_no}
                  onChange={handleChange}
                  error={errors.quotation_no}
                />
                <InputField
                  label="Company Name"
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  error={errors.company_name}
                />
                <InputField
                  label="Company CR No."
                  name="company_cr_number"
                  value={form.company_cr_number}
                  onChange={handleChange}
                  error={errors.company_name}
                />
                <InputField
                  label="Company Activity"
                  name="company_activity"
                  value={form.company_activity}
                  onChange={handleChange}
                  error={errors.company_activity}
                />
                <InputField
                  label="Person Name"
                  name="person_name"
                  value={form.person_name}
                  onChange={handleChange}
                />
                <InputField
                  label="Designation"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  error={errors.designation}
                />
                <InputField
                  label="Signatory"
                  name="signatory"
                  value={form.signatory}
                  onChange={handleChange}
                  error={errors.signatory}
                />
                <InputField
                  label="Mobile No"
                  name="mobile_no"
                  value={form.mobile_no}
                  onChange={handleChange}
                  error={errors.mobile_no}
                />
                <InputField
                  label="Email ID"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                />
                <div className="md:col-span-2">
                  <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                    Remarks / Description
                  </label>
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#4A5A6A]"
                    placeholder="Short remarks or description"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                    ETMAM Commitments
                  </label>
                  <textarea
                    name="etmam_commitments"
                    value={form.etmam_commitments}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#4A5A6A]"
                    placeholder="What ETMAM will provide / commit"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                    Client&apos;s Commitments
                  </label>
                  <textarea
                    name="client_commitments"
                    value={form.client_commitments}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#4A5A6A]"
                    placeholder="What client has to provide / commit"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                    General Terms
                  </label>
                  <textarea
                    name="general_terms"
                    value={form.general_terms}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#4A5A6A]"
                    placeholder="Any general terms"
                  />
                </div>
              </div>
            </div>

            {/* 1️⃣ QUOTATION OPTIONS & COST FIRST */}
            <div className="space-y-4">
              <SectionTitle title="QUOTATION OPTIONS & COST" />
              {/* Row 1 → Quotation Type + Contract Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quotation Type */}
                <div>
                  <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                    Quotation Type
                  </label>
                  <select
                    name="quotation_type"
                    value={form.quotation_type}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] ${
                      errors.quotation_type
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select</option>
                    {quotationTypeOptions.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                  {errors.quotation_type && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.quotation_type}
                    </p>
                  )}
                </div>

                {/* Contract Duration */}
                <div>
                  <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                    Contract Duration
                  </label>
                  <select
                    name="contract_duration"
                    value={form.contract_duration}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] ${
                      errors.contract_duration
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select</option>
                    {contractDurations.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {errors.contract_duration && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.contract_duration}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2 → No of Workers + Nationality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* No of Workers */}
                <div>
                  <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                    No of Workers
                  </label>

                  <div className="flex gap-3 items-center mb-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="workers_mode"
                        value="number"
                        checked={form.workers_mode === "number"}
                        onChange={handleChange}
                      />
                      Number
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="workers_mode"
                        value="open"
                        checked={form.workers_mode === "open"}
                        onChange={handleChange}
                      />
                      Open
                    </label>
                  </div>

                  {form.workers_mode === "number" ? (
                    <input
                      name="no_of_workers"
                      value={form.no_of_workers}
                      onChange={handleChange}
                      type="number"
                      min="1"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] ${
                        errors.no_of_workers
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter number of workers"
                    />
                  ) : (
                    <input
                      name="no_of_workers"
                      value="Open"
                      readOnly
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
                    />
                  )}

                  {errors.no_of_workers && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.no_of_workers}
                    </p>
                  )}
                </div>

                {/* Nationality */}
                <div>
                  <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                    Nationality
                  </label>

                  <div className="flex gap-3 items-center mb-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="nationality_mode"
                        value="any"
                        checked={form.nationality_mode === "any"}
                        onChange={handleChange}
                      />
                      Any
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="nationality_mode"
                        value="specific"
                        checked={form.nationality_mode === "specific"}
                        onChange={handleChange}
                      />
                      Specific
                    </label>
                  </div>

                  {form.nationality_mode === "specific" ? (
                    <input
                      name="nationality"
                      value={form.nationality}
                      onChange={handleChange}
                      placeholder="Enter nationality (e.g. Nepalese)"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] ${
                        errors.nationality
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  ) : (
                    <input
                      readOnly
                      value="Any nationality allowed"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
                    />
                  )}

                  {errors.nationality && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.nationality}
                    </p>
                  )}
                </div>
              </div>

              {/* Professions */}
              <div>
                <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                  Professions
                </label>
                <textarea
                  name="professions"
                  value={form.professions}
                  onChange={handleChange}
                  rows="3"
                  placeholder="List professions / job titles (comma separated or newline)"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5A6A] ${
                    errors.professions ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.professions && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.professions}
                  </p>
                )}
              </div>

              {/* Salary breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputField
                  label="Basic Salary"
                  name="basic_salary"
                  type="number"
                  value={form.basic_salary}
                  onChange={handleChange}
                  error={errors.basic_salary}
                />
                <InputField
                  label="Food Allowance"
                  name="food_allowance"
                  type="number"
                  value={form.food_allowance}
                  onChange={handleChange}
                  error={errors.food_allowance}
                />
                <InputField
                  label="Accommodation"
                  name="accommodation_cost"
                  type="number"
                  value={form.accommodation_cost}
                  onChange={handleChange}
                  error={errors.accommodation_cost}
                />
                <InputField
                  label="Transportation"
                  name="transportation_cost"
                  type="number"
                  value={form.transportation_cost}
                  onChange={handleChange}
                  error={errors.transportation_cost}
                />
                <InputField
                  label="Other Costs"
                  name="other_costs"
                  type="number"
                  value={form.other_costs}
                  onChange={handleChange}
                  error={errors.other_costs}
                />

                <div>
                  <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
                    Monthly Cost Per Worker
                  </label>
                  <input
                    name="monthly_cost_per_worker"
                    value={form.monthly_cost_per_worker}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* 3️⃣ FOOTER BUTTONS */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Reset
              </button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewOpen(true)}
                >
                  Preview
                </Button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 rounded-lg bg-[#4A5A6A] text-white hover:bg-[#3b4b59]"
                >
                  {isLoading ? "Processing..." : "Generate Quotation"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <PreviewQuotationModal
        open={previewOpen}
        setOpen={setPreviewOpen}
        data={form}
      />
    </>
  );
}

/* ---------- small helpers / components ---------- */

function SectionTitle({ title }) {
  return <h3 className="text-md font-medium text-[#4A5A6A]">{title}</h3>;
}

function InputField({ label, name, type = "text", value, onChange, error }) {
  return (
    <div>
      <label className="block text-[#4A5A6A] text-sm mb-1 font-medium">
        {label} {error && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#4A5A6A] ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
