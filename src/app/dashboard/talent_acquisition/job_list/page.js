"use client";

import { useEffect, useState } from "react";
import { IoLockClosed, IoLockOpen } from "react-icons/io5";
import Link from "next/link";
import JobActions from "../JobActions";
import { Search } from "lucide-react";

export default function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null); // job being edited
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true; // prevent state updates if component unmounted

    async function fetchJobs() {
      try {
        if (isMounted) setLoading(true);
        const res = await fetch(
          `/api/talent_acquisition/job_management?search=${encodeURIComponent(
            searchTerm
          )}`
        );
        const result = await res.json();

        if (!isMounted) return;

        if (result.success) {
          setJobs(result.jobs);
          setError(null);
        } else {
          setError(result.error || "Failed to load jobs");
        }
      } catch (err) {
        if (isMounted) setError("Something went wrong");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    // ✅ Debounce search
    const delay = setTimeout(() => {
      fetchJobs();
    }, 500); // 400–500ms feels smoother

    return () => {
      clearTimeout(delay);
      isMounted = false;
    };
  }, [searchTerm]);

  // DELETE job
  async function handleDelete(jobId) {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const res = await fetch(
        `/api/talent_acquisition/job_management/${jobId}`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();

      if (result.success) {
        setJobs((prev) => prev.filter((job) => job.job_id !== jobId));
      } else {
        alert(result.error || "Failed to delete job");
      }
    } catch (err) {
      alert("Something went wrong");
    }
  }

  // SAVE edited job
  async function handleSave(e) {
    e.preventDefault();
    if (!selectedJob) return;

    setIsSaving(true);

    try {
      const res = await fetch(
        `/api/talent_acquisition/job_management/${selectedJob.job_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: selectedJob.job_title,
            jobLocation: selectedJob.job_location,
            jobSalary: selectedJob.job_salary,
            jobStatus: selectedJob.job_status,
            jobDescription: selectedJob.job_description,
            jobOpeningDate: selectedJob.job_opening_date,
            jobClosingDate: selectedJob.job_closing_date,
            jobKeySkills: selectedJob.job_key_skills,
            jobBenefits: selectedJob.job_benefits,
          }),
        }
      );

      const result = await res.json();

      if (result.success) {
        setJobs((prev) =>
          prev.map((job) =>
            job.job_id === selectedJob.job_id ? selectedJob : job
          )
        );
        setSelectedJob(null); // close modal
      } else {
        alert(result.error || "Failed to update job");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-2">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        📑 All Jobs List
      </h1>

      {/* 🔍 Search Bar */}
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
      {/* ⏳ Loading shimmer */}
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

      {/* 📋 Jobs List or Empty State */}
      {!loading && (
        <>
          {jobs.length === 0 ? (
            <p className="text-center text-gray-600 fade-in">
              {searchTerm
                ? `No results found for “${searchTerm}”.`
                : "No jobs available at the moment."}
            </p>
          ) : (
            <ul className="space-y-6 fade-in transition-opacity duration-500">
              {jobs.map((job) => (
                <li
                  key={job.job_id}
                  className="p-6 border rounded-lg shadow hover:shadow-md transition bg-white/70 backdrop-blur-sm"
                >
                  <h2 className="text-xl font-semibold">
                    [{job.job_id}] {job.job_title}
                  </h2>
                  <p className="text-gray-600">{job.job_location}</p>
                  <p className="text-gray-800 mt-1">
                    Salary: {job.job_salary || "Not specified"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Opening Date: {job.job_opening_date} | Closing Date:{" "}
                    {job.job_closing_date || "N/A"}
                  </p>
                  <p className="mt-2 text-gray-700 line-clamp-2">
                    {job.job_description}
                  </p>
                  <Link
                    href={`/dashboard/talent_acquisition/job_list/${job.job_id}`}
                    /* target="_blank"
                    rel="noopener noreferrer" */
                    className="text-indigo-600 text-sm font-medium hover:underline"
                  >
                    View Details →
                  </Link>
                  <div className="flex items-center gap-4 mt-3">
                    {job.job_status === "closed" ? (
                      <IoLockClosed
                        className="text-red-800 text-xl hover:scale-120 transition-transform duration-200"
                        title="Closed"
                      />
                    ) : (
                      <IoLockOpen
                        className="text-green-600 text-xl hover:scale-120 transition-transform duration-200"
                        title="Open"
                      />
                    )}
                    <JobActions
                      jobId={job.job_id}
                      onEdit={() => setSelectedJob(job)}
                      onDelete={() => handleDelete(job.job_id)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* ✏️ Edit Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 bg-gray-200/40 backdrop-blur-md flex justify-center items-center z-50"
          data-testid="modal-backdrop"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-3 right-50 cursor-pointer text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-6">
              Edit Job [{selectedJob.job_id}] {selectedJob.job_title}
            </h2>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
              {/* Job Title - full width */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={selectedJob.job_title}
                  onChange={(e) =>
                    setSelectedJob({
                      ...selectedJob,
                      job_title: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={selectedJob.job_location}
                  onChange={(e) =>
                    setSelectedJob({
                      ...selectedJob,
                      job_location: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium mb-1">Salary</label>
                <input
                  type="text"
                  value={selectedJob.job_salary || ""}
                  onChange={(e) =>
                    setSelectedJob({
                      ...selectedJob,
                      job_salary: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Opening Date */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Opening Date
                </label>
                <input
                  type="date"
                  value={selectedJob.job_opening_date || ""}
                  onChange={(e) =>
                    setSelectedJob({
                      ...selectedJob,
                      job_opening_date: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Closing Date */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Closing Date
                </label>
                <input
                  type="date"
                  value={selectedJob.job_closing_date || ""}
                  onChange={(e) =>
                    setSelectedJob({
                      ...selectedJob,
                      job_closing_date: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Key Skills */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Key Skills
                </label>
                <input
                  type="text"
                  value={selectedJob.job_key_skills || ""}
                  onChange={(e) =>
                    setSelectedJob({
                      ...selectedJob,
                      job_key_skills: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={selectedJob.job_status}
                  onChange={(e) =>
                    setSelectedJob({
                      ...selectedJob,
                      job_status: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Description - full width */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={selectedJob.job_description || ""}
                  onChange={(e) =>
                    setSelectedJob({
                      ...selectedJob,
                      job_description: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                  rows="3"
                />
              </div>

              {/* Benefits - full width */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Benefits
                </label>
                <textarea
                  value={selectedJob.job_benefits || ""}
                  onChange={(e) =>
                    setSelectedJob({
                      ...selectedJob,
                      job_benefits: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                  rows="2"
                />
              </div>

              {/* Buttons - full width */}
              <div className="col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
