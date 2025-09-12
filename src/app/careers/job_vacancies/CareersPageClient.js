"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/talent_acquisition/public_job_list");
        const result = await res.json();

        if (result.success) {
          setJobs(result.jobs);
        } else {
          setError(result.error || "Failed to load jobs");
        }
      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading jobs...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-8">Open Positions</h1>

        {jobs.length === 0 ? (
          <p className="text-center text-gray-600">
            No jobs available at the moment.
          </p>
        ) : (
          <ul className="space-y-6">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="p-6 border rounded-lg shadow hover:shadow-md transition"
              >
                <h2 className="text-xl font-semibold">{job.job_title}</h2>
                <p className="text-gray-600">{job.job_location}</p>
                <p className="text-gray-800 mt-1">
                  Salary: {job.job_salary || "Not specified"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Opening Date: {job.job_opening_date} | Closing Date:{" "}
                  {job.job_closing_date || "N/A"}
                </p>
                {/* <p className="mt-2 text-gray-700">{job.job_description}</p> */}
                <p className="mt-2 text-gray-700 line-clamp-2">
                  {job.job_description}
                </p>
                <Link
                  href={`/careers/job_vacancies/${job.job_id}`}
                  className="text-indigo-600 text-sm font-medium hover:underline"
                >
                  View Details →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
