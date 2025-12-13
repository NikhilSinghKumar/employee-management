"use client";

import React, { useEffect, useState, useCallback } from "react";

export default function QuotationList() {
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    client_number: "",
    nationality: "",
    profession: "",
    search: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState(""); // ⬅ Debounced search value
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFilters = async () => {
    const params = new URLSearchParams({
      client_number: filters.client_number,
      nationality: filters.nationality,
      profession: filters.profession,
    });

    const res = await fetch(`/api/sales/quotation_list/filters?${params}`);
    const data = await res.json();

    setClients(data.clients || []);
    setNationalities(data.nationalities || []);
    setProfessions(data.professions || []);
  };

  useEffect(() => {
    fetchFilters();
  }, [filters.client_number, filters.nationality, filters.profession]);

  // -----------------------------
  // Debounce Search (300ms delay)
  // -----------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(1); // Reset page when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // -----------------------------
  // Fetch Quotations with Filters
  // -----------------------------
  const fetchQuotations = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      limit,
      client_number: filters.client_number,
      nationality: filters.nationality,
      profession: filters.profession,
      search: debouncedSearch, // ⬅ use debounced value
    });

    const res = await fetch(`/api/sales/quotation_list?${params.toString()}`);
    const data = await res.json();

    setQuotations(data.data || []);
    setTotalPages(data.total_pages || 1);

    setLoading(false);
  };

  useEffect(() => {
    fetchQuotations();
  }, [
    page,
    limit,
    filters.client_number,
    filters.nationality,
    filters.profession,
    debouncedSearch,
  ]);

  // -----------------------------
  // Handle filter changes
  // -----------------------------
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => {
      let updated = { ...prev, [name]: value };

      // Reset logically inconsistent filters
      if (name === "client_number") {
        updated.nationality = "";
        updated.profession = "";
        updated.search = "";
      }

      if (name === "nationality") {
        updated.profession = "";
      }

      return updated;
    });

    setPage(1);
  };

  return (
    <>
      <style jsx>{`
        .dot {
          animation: blink 1.4s infinite both;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0% {
            opacity: 0.2;
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0.2;
          }
        }
      `}</style>

      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Quotation List</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Client Dropdown */}
          <select
            name="client_number"
            value={filters.client_number}
            onChange={handleFilterChange}
            className="border p-2 rounded"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.client_number} value={c.client_number}>
                {c.client_number} ({c.client_name})
              </option>
            ))}
          </select>

          {/* Nationality */}
          <select
            name="nationality"
            value={filters.nationality}
            onChange={handleFilterChange}
            className="border p-2 rounded"
          >
            <option value="">All Nationalities</option>
            {nationalities.map((n, index) => (
              <option key={`${n.nationality}-${index}`} value={n.nationality}>
                {n.nationality}
              </option>
            ))}
          </select>

          {/* Profession */}
          <select
            name="profession"
            value={filters.profession}
            onChange={handleFilterChange}
            className="border p-2 rounded"
          >
            <option value="">All Professions</option>
            {professions.map((p, index) => (
              <option key={`${p.profession} -${index}`} value={p.profession}>
                {p.profession}
              </option>
            ))}
          </select>

          {/* Debounced Search */}
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search..."
            className="border p-2 rounded flex-1 min-w-[200px]"
          />
        </div>

        {loading && (
          <div className="flex justify-center items-center py-10 text-xl font-semibold">
            Loading
            <span className="dot mx-1">.</span>
            <span className="dot mx-1">.</span>
            <span className="dot mx-1">.</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Table */}
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">S.N.</th>
                  <th className="border p-2">Client Number</th>
                  <th className="border p-2">Client Name</th>
                  <th className="border p-2">Nationality</th>
                  <th className="border p-2">Profession</th>
                  <th className="border p-2">ETMAM Cost</th>
                </tr>
              </thead>
              <tbody>
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4">
                      No records found
                    </td>
                  </tr>
                ) : (
                  quotations.map((q, index) => (
                    <tr
                      key={`${q.id}-${q.client_number}-${q.profession}-${q.nationality}`}
                    >
                      <td className="border p-2">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="border p-2">{q.client_number}</td>
                      <td className="border p-2">{q.client_name}</td>
                      <td className="border p-2">{q.nationality}</td>
                      <td className="border p-2">{q.profession}</td>
                      <td className="border p-2">{q.etmam_cost}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="border px-3 py-1 rounded disabled:opacity-50"
              >
                Prev
              </button>

              <span className="px-2 py-1">
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="border px-3 py-1 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
