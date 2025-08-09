"use client";

import { useState, useEffect } from "react";

export default function Clients() {
  const [month, setMonth] = useState(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [year, setYear] = useState(new Date().getFullYear());
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(
          "/api/accommodation_transport/at_client_numbers"
        );
        const { data } = await response.json();

        if (Array.isArray(data)) {
          const uniqueClients = [
            ...new Set(
              data.map(
                (client) => client.client_number?.trim().toUpperCase() // normalize spacing & case
              )
            ),
          ].filter(Boolean); // remove null/empty

          setClients(uniqueClients);
        } else {
          console.error("Expected 'data' to be an array, got:", data);
          setClients([]);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        setClients([]);
      }
    };

    fetchClients();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex space-x-4 p-4 bg-white rounded-lg shadow-lg">
        <button className="px-4 py-2 bg-gray-200 rounded">{month}</button>
        <button className="px-4 py-2 bg-gray-200 rounded">{year}</button>
        <select
          className="px-4 py-2 bg-gray-200 rounded"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
        >
          <option value="">Select Client</option>
          {clients.map((client) => (
            <option key={client} value={client}>
              {client}
            </option>
          ))}
        </select>
        <button className="px-4 py-2 bg-purple-600 text-white rounded">
          Generate
        </button>
      </div>
    </div>
  );
}
