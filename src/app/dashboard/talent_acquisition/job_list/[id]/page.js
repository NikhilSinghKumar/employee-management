"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  DollarSign,
  Briefcase,
  ArrowLeft,
} from "lucide-react";

export default function JobDetailsPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/talent_acquisition/job_management/${id}`);
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

  if (loading)
    return (
      <p className="text-center mt-10 text-lg font-medium text-gray-500">
        Loading...
      </p>
    );
  if (!job)
    return (
      <p className="text-center mt-10 text-lg font-semibold text-red-600">
        Job not found
      </p>
    );

  return (
    <div className="max-w-4xl mx-auto p-2">
      {/* Back to Listings */}
      <div className="m-2">
        <Link
          href="/dashboard/talent_acquisition/job_list"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Job List
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
        {/* Job Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            [{job.job_id} ] {job.job_title}
          </h1>
          <p className="flex items-center text-gray-600 mt-2">
            <MapPin className="w-4 h-4 mr-2" /> {job.job_location}
          </p>
        </div>

        {/* Job Meta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center text-gray-700">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            <span className="font-medium">
              {job.job_salary || "Not disclosed"}
            </span>
          </div>
          <div className="flex items-center text-gray-700">
            <CalendarDays className="w-5 h-5 mr-2 text-indigo-600" />
            <span className="text-sm">
              Opening:{" "}
              <span className="font-medium">{job.job_opening_date}</span>
            </span>
          </div>
          <div className="flex items-center text-gray-700">
            <CalendarDays className="w-5 h-5 mr-2 text-red-600" />
            <span className="text-sm">
              Closing:{" "}
              <span className="font-medium">
                {job.job_closing_date || "N/A"}
              </span>
            </span>
          </div>
        </div>

        {/* Description */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-2">
            <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
            Job Description
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {job.job_description}
          </p>
        </section>

        {/* Benefits */}
        {job.job_benefits && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Benefits
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {job.job_benefits.split(",").map((benefit, idx) => (
                <li key={idx}>{benefit.trim()}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
