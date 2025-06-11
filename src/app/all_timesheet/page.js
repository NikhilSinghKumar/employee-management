// all_timesheet/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TimesheetPage() {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [clientNumber, setClientNumber] = useState("");
  const [clientNumbers, setClientNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Fetch client numbers
  useEffect(() => {
    async function fetchClientNumbers() {
      const res = await fetch("/api/client_numbers", {
        credentials: "include", // Include cookies in the request
      });
      const data = await res.json();
      if (res.ok) {
        setClientNumbers(data);
      } else {
        setError(data.error);
      }
    }
    fetchClientNumbers();
  }, []);

  // Handle form submission
  const handleGenerateTimesheet = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate_timesheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ month, year, clientNumber }),
        credentials: "include", // Include cookies in the request
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to generate timesheet");
      }

      alert("Timesheet generated successfully!");
      router.push("/timesheet/history");
    } catch (err) {
      setError(err.message || "Unexpected error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generate Timesheet</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleGenerateTimesheet} className="space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="month">
            Month
          </label>
          <select
            id="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="">Select Month</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="year">
            Year
          </label>
          <input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            min="2000"
            max="2100"
            className="mt-1 block w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="clientNumber">
            Client Number
          </label>
          <select
            id="clientNumber"
            value={clientNumber}
            onChange={(e) => setClientNumber(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="">Select Client Number</option>
            {clientNumbers.map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? "Generating..." : "Generate Timesheet"}
        </button>
      </form>
    </div>
  );
}
