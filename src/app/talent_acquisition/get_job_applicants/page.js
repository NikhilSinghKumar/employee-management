"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function JobApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/talent_acquisition/job_application");
      const data = await res.json();
      if (data.success) {
        setApplications(data.jobapplications);
      } else {
        toast.error(data.error || "Failed to fetch applications");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="animate-pulse text-gray-600">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 mt-16">
      <h1 className="text-xl font-semibold text-center">Job Applications</h1>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full text-sm border-collapse border border-gray-200">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 border border-gray-200 text-center">
                S. N.
              </th>
              <th className="px-3 py-2 border border-gray-200 text-center">
                Name
              </th>
              <th className="px-3 py-2 border border-gray-200 text-center">
                Job ID
              </th>
              <th className="px-3 py-2 border border-gray-200 text-center">
                Mobile
              </th>
              <th className="px-3 py-2 border border-gray-200 text-center">
                City
              </th>
              <th className="px-3 py-2 border border-gray-200 text-center">
                Exp
              </th>
              <th className="px-3 py-2 border border-gray-200 text-center">
                Salary
              </th>
              <th className="px-3 py-2 border border-gray-200 text-center">
                Status
              </th>
              <th className="px-3 py-2 border border-gray-200 text-center">
                Applied
              </th>
              <th className="px-3 py-2 border border-gray-200 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, idx) => (
              <tr
                key={app.id}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100`}
              >
                <td className="px-3 py-2 border border-gray-200 text-center">
                  {idx + 1}
                </td>
                <td className="px-3 py-2 border border-gray-200">
                  {app.applicant_name}
                </td>
                <td className="px-3 py-2 border border-gray-200 text-gray-600">
                  {app.job_id || "N/A"}
                </td>
                <td className="px-3 py-2 border border-gray-200 text-gray-600 text-center">
                  {app.applicant_mobile_no}
                </td>
                <td className="px-3 py-2 text-center border border-gray-200">
                  {app.applicant_city}
                </td>
                <td className="px-3 py-2 border text-center border-gray-200">
                  {app.applicant_experience_years}y
                </td>
                <td className="px-3 py-2 border text-center border-gray-200">
                  {app.applicant_current_salary || "-"} →{" "}
                  {app.applicant_expected_salary || "-"}
                </td>
                <td className="px-3 py-2 border border-gray-200 text-center">
                  {getStatusBadge(app.applicant_status)}
                </td>
                <td className="px-3 py-2 border border-gray-200 text-center text-gray-500">
                  {new Date(app.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 border border-gray-200 text-center space-x-2">
                  {app.applicant_cv_url && (
                    <Link
                      href={app.applicant_cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      CV
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      const newStatus = prompt(
                        "Enter new status: pending / shortlisted / rejected / hired",
                        app.applicant_status
                      );
                      if (newStatus) updateStatus(app.id, newStatus);
                    }}
                    className="text-gray-600 hover:underline"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => deleteApplicant(app.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && applications.length === 0 && (
              <tr>
                <td
                  colSpan="10"
                  className="text-center p-6 text-gray-500 border border-gray-200"
                >
                  No job applications found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
