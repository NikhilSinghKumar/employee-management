"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Search, Trash2 } from "lucide-react";
import Link from "next/link";

export default function JobApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/talent_acquisition/job_application?search=${encodeURIComponent(
          searchTerm
        )}`
      );
      const result = await res.json();
      if (result.success) {
        setApplications(result.applications || []);
        setError(null);
      } else {
        setError(result.error || "Failed to load jobs");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchApplications();
    }, 500);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/talent_acquisition/job_application/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Status updated");
        fetchApplications();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Error updating status");
    }
  };

  const deleteApplicant = async (id) => {
    if (!confirm("Are you sure you want to delete this applicant?")) return;
    try {
      const res = await fetch(`/api/talent_acquisition/job_application/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Applicant deleted");
        setApplications(applications.filter((a) => a.id !== id));
      } else {
        toast.error(data.error || "Failed to delete applicant");
      }
    } catch {
      toast.error("Error deleting applicant");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      shortlisted: "bg-blue-100 text-blue-700",
      rejected: "bg-red-100 text-red-700",
      hired: "bg-green-100 text-green-700",
    };
    return (
      <span
        className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
          colors[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-2">
      <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        📄 Job Applications
      </h1>
      <div className="flex flex-wrap justify-center items-center gap-4 mb-8 w-full">
        <div className="relative w-[85%] sm:w-72 md:w-96">
          <Search
            className="absolute left-3 top-2.5 text-gray-400 pointer-events-none z-10"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full shadow-sm md:shadow-md md:hover:shadow-lg pl-10 pr-4 py-2 rounded-lg bg-white/10 text-gray-800 placeholder-gray-400
                  border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4A5A6A]/60
                  focus:border-transparent transition-all duration-200 backdrop-blur-sm
                  hover:bg-white/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {error && (
        <div className="max-w-lg mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md text-center mb-4">
          {error}
        </div>
      )}
      {/* ⏳ Shimmer Loader*/}
      {/* ⏳ Shimmer Loader DESKTOP */}
      {loading && (
        <div className="space-y-4 my-10 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-6 border rounded-lg shadow bg-gray-100/60 backdrop-blur-sm"
            >
              <div className="h-5 w-2/3 bg-gray-300 rounded mb-3"></div>
              <div className="h-4 w-1/3 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-gray-300 rounded mb-4"></div>
              <div className="h-3 w-full bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      )}
      {/* ⏳ Shimmer Loader MOBILE */}
      {loading && (
        <div className="md:hidden space-y-3 my-10">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white border rounded-lg p-4 shadow-sm"
            >
              {/* Header shimmer */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="h-4 w-12 bg-gray-300 rounded mb-2"></div>
                  <div className="h-5 w-24 bg-gray-300 rounded"></div>
                </div>
                <div className="text-right">
                  <div className="h-3 w-16 bg-gray-300 rounded-full mx-auto mb-1"></div>
                </div>
              </div>

              {/* Grid shimmer */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j}>
                    <div className="h-3 w-12 bg-gray-300 rounded mb-1"></div>
                    <div className="h-4 w-16 bg-gray-300 rounded"></div>
                  </div>
                ))}
                <div className="col-span-2">
                  <div className="h-3 w-12 bg-gray-300 rounded mb-1"></div>
                  <div className="h-4 w-20 bg-gray-300 rounded"></div>
                </div>
              </div>

              {/* Actions shimmer */}
              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                {[...Array(3)].map((_, k) => (
                  <div key={k} className="flex-1">
                    <div className="h-10 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && (
        <>
          {applications.length === 0 ? (
            <p className="text-center text-gray-600 fade-in">
              {searchTerm
                ? `No results found for “${searchTerm}”.`
                : "No applications found."}
            </p>
          ) : (
            // ✅  DESKTOP: Full Table
            <div className="hidden md:block overflow-x-auto border rounded-lg shadow-sm">
              <table className="min-w-full text-sm border-collapse border border-gray-200">
                <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 border border-gray-200 text-left">
                      S.N.
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-left">
                      Name
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-left">
                      Job ID
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-left">
                      Mobile
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-left">
                      City
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-left">
                      Exp
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-left">
                      Salary
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-left">
                      Status
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-left">
                      Applied
                    </th>
                    <th className="px-4 py-3 border border-gray-200 text-left">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, idx) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 border border-gray-200 font-medium">
                        {app.applicant_name}
                      </td>
                      <td className="px-4 py-3 border border-gray-200 text-gray-600">
                        {app.job_id || "N/A"}
                      </td>
                      <td className="px-4 py-3 border border-gray-200 text-gray-600">
                        {app.applicant_mobile_no}
                      </td>
                      <td className="px-4 py-3 border border-gray-200">
                        {app.applicant_city}
                      </td>
                      <td className="px-4 py-3 border border-gray-200 text-center">
                        {app.applicant_experience_years}y
                      </td>
                      <td className="px-4 py-3 border border-gray-200 text-center">
                        {app.applicant_current_salary || "-"} →{" "}
                        {app.applicant_expected_salary || "-"}
                      </td>
                      <td className="px-4 py-3 border border-gray-200 text-center">
                        {getStatusBadge(app.applicant_status)}
                      </td>
                      <td className="px-4 py-3 border border-gray-200 text-gray-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 border border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {app.applicant_cv_url ? (
                            <Link
                              href={app.applicant_cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              CV
                            </Link>
                          ) : (
                            <span className="text-gray-400 text-sm">CV</span>
                          )}
                          <select
                            value={app.applicant_status}
                            onChange={(e) =>
                              updateStatus(app.id, e.target.value)
                            }
                            className="border rounded px-2 py-1 text-xs"
                          >
                            <option value="pending">Pending</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                            <option value="hired">Hired</option>
                          </select>
                          <button
                            title="Delete Appicant"
                            onClick={() => deleteApplicant(app.id)}
                            className="text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* Mobile Card*/}
      {!loading && (
        <div className="md:hidden space-y-3">
          {applications.map((app, idx) => (
            <div
              key={app.id}
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-500">SN: {idx + 1}</p>
                  <h3 className="font-semibold text-base">
                    {app.applicant_name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(app.created_at).toLocaleDateString()}
                  </div>
                  {getStatusBadge(app.applicant_status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Job ID:</span>
                  <p>{app.job_id || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Mobile:</span>
                  <p>{app.applicant_mobile_no}</p>
                </div>
                <div>
                  <span className="text-gray-500">City:</span>
                  <p>{app.applicant_city}</p>
                </div>
                <div>
                  <span className="text-gray-500">Exp:</span>
                  <p>{app.applicant_experience_years}y</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Salary:</span>
                  <p className="font-medium">
                    {app.applicant_current_salary || "-"} →{" "}
                    {app.applicant_expected_salary || "-"}
                  </p>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                {app.applicant_cv_url ? (
                  <Link
                    href={app.applicant_cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 px-3 bg-blue-50 text-blue-600 rounded border text-sm hover:bg-blue-100"
                  >
                    View CV
                  </Link>
                ) : (
                  <div className="flex-1 text-center py-2 px-3 bg-gray-50 text-gray-400 rounded border text-sm">
                    No CV
                  </div>
                )}
                <select
                  value={app.applicant_status}
                  onChange={(e) => updateStatus(app.id, e.target.value)}
                  className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#4A5A6A]/60"
                >
                  <option value="pending">Pending</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="hired">Hired</option>
                </select>
                <button
                  onClick={() => deleteApplicant(app.id)}
                  className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded border text-sm hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
