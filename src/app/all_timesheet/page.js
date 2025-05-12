"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

const ClientTimesheetPage = () => {
  const [clientNumbers, setClientNumbers] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchClientNumbers = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("client_number")
        .neq("client_number", null)
        .order("client_number", { ascending: true });

      if (error) {
        console.error("Error fetching client numbers:", error.message);
        return;
      }

      const uniqueClients = [...new Set(data.map((emp) => emp.client_number))];
      setClientNumbers(uniqueClients);
    };

    fetchClientNumbers();
  }, []);

  const handleSubmit = () => {
    if (selectedClient && month && year) {
      router.push(
        `/timesheet?client=${selectedClient}&month=${month}&year=${year}`
      );
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg mt-20">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        All Clients Timesheet
      </h1>

      <div className="flex justify-center flex-wrap p-8">
        {/* Month */}
        <div>
          <select
            className="border rounded px-3 py-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <select
            className="border rounded px-3 py-2"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">Year</option>
            {[2023, 2024, 2025].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Client Number */}
        <div className="ml-4">
          <select
            className="border rounded px-3 py-2 min-w-[150px]"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="">Select Client</option>
            {clientNumbers.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="ml-4">
          <button
            onClick={handleSubmit}
            disabled={!selectedClient || !month || !year}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            Generate Timesheet
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientTimesheetPage;
