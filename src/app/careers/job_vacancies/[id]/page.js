"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function JobDetailsPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/talent_acquisition/public_job_list/${id}`);
        const result = await res.json();
        if (result.success) setJob(result.job);
      } catch (error) {
        console.error("Failed to fetch job:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!job) return <p className="text-center mt-10 text-red-600">Job not found</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold">{job.job_title}</h1>
      <p className="text-gray-600">{job.job_location}</p>
      <p className="text-gray-800 mt-2">Salary: {job.job_salary}</p>
      <p className="text-sm text-gray-500 mt-1">
        Opening: {job.job_opening_date} | Closing: {job.job_closing_date || "N/A"}
      </p>
      <h2 className="mt-6 text-xl font-semibold">Description</h2>
      <p className="mt-2 text-gray-700 whitespace-pre-line">
        {job.job_description}
      </p>
      {job.job_benefits && (
        <>
          <h2 className="mt-6 text-xl font-semibold">Benefits</h2>
          <p className="mt-2 text-gray-700">{job.job_benefits}</p>
        </>
      )}
    </div>
  );
}
