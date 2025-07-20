"use client";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";

export default function AdminEmails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedInEmail, setLoggedInEmail] = useState(null);
  const [isRestrictLoading, setIsRestrictLoading] = useState(false);
  const [isEnableLoading, setIsEnableLoading] = useState(false);

  const fetchAllowedEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/allowed_emails", {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) {
        setEmails(json.data || []);
      } else {
        toast.error(json.message || "Failed to fetch emails.", {
          position: "top-right",
        });
      }
    } catch (error) {
      toast.error("Server error while fetching emails.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkToggle = async (newStatus, setLoading, resetLoading) => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/restrict_all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: newStatus }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message, { position: "top-right" });
        await fetchAllowedEmails();
      } else {
        toast.error(json.message || "Bulk update failed.", {
          position: "top-right",
        });
      }
    } catch (error) {
      toast.error("Server error during bulk update.", { position: "top-right" });
    } finally {
      resetLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setLoggedInEmail(json.user.email);
      }
    };
    fetchUser();
    fetchAllowedEmails();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Manage Allowed Emails</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => handleBulkToggle(false, setIsRestrictLoading, setIsRestrictLoading)}
          disabled={isRestrictLoading}
          className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRestrictLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Restricting...
            </span>
          ) : (
            "Restrict All"
          )}
        </button>
        <button
          onClick={() => handleBulkToggle(true, setIsEnableLoading, setIsEnableLoading)}
          disabled={isEnableLoading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEnableLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Enabling...
            </span>
          ) : (
            "Enable All"
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="ml-3 text-gray-600 text-lg">Loading emails...</span>
        </div>
      ) : emails.length === 0 ? (
        <p className="text-gray-500 text-center text-lg py-10">No emails found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 uppercase tracking-wider">
                  Sections
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {emails.map((email, index) => (
                <tr
                  key={email.id || index}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">{email.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {email.allowed_sections?.join(", ") || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {email.is_active ? "✅" : "❌"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/admin/restrict_email", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              email: email.email,
                              is_active: !email.is_active,
                            }),
                          });
                          const json = await res.json();
                          if (res.ok) {
                            toast.success(json.message, {
                              position: "top-right",
                            });
                            setEmails((prevEmails) =>
                              prevEmails.map((e) =>
                                e.email === email.email
                                  ? { ...e, is_active: !e.is_active }
                                  : e
                              )
                            );
                          } else {
                            toast.error(json.message || "Update failed.", {
                              position: "top-right",
                            });
                          }
                        } catch (error) {
                          toast.error("Server error during update.", {
                            position: "top-right",
                          });
                        }
                      }}
                      disabled={
                        email.email === "nikhilsk369@gmail.com" &&
                        loggedInEmail !== "nikhilsk369@gmail.com"
                      }
                      className={`px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 ${
                        email.is_active
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {email.is_active ? "Restrict" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}