"use client";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Ban,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  Search,
} from "lucide-react";

export default function AdminEmails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedInEmail, setLoggedInEmail] = useState(null);
  const [isRestrictLoading, setIsRestrictLoading] = useState(false);
  const [isEnableLoading, setIsEnableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllowedEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/allowed_emails", {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) setEmails(json.data || []);
      else toast.error(json.message || "Failed to fetch emails.");
    } catch {
      toast.error("Server error while fetching emails.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkToggle = async (newStatus, setLoading) => {
    if (
      !confirm(
        `Are you sure you want to ${
          newStatus ? "enable" : "restrict"
        } all users?`
      )
    )
      return;
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
        toast.success(json.message);
        await fetchAllowedEmails();
      } else toast.error(json.message || "Bulk update failed.");
    } catch {
      toast.error("Server error during bulk update.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.success) setLoggedInEmail(json.user.email);
      fetchAllowedEmails();
    })();
  }, []);

  const filteredEmails = emails.filter((item) =>
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = emails.filter((e) => e.is_active).length;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      {/* Header Card */}
      <div className="bg-white shadow-md rounded-2xl p-5 mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <ShieldCheck className="text-blue-600" />
          Manage Email Access
        </h1>
        <p className="text-gray-500 text-sm mb-4">
          Enable or restrict access for users in the system. Use bulk actions
          for quick control.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleBulkToggle(false, setIsRestrictLoading)}
            disabled={isRestrictLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 disabled:opacity-50 transition text-sm sm:text-base cursor-pointer"
          >
            {isRestrictLoading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Ban size={16} />
            )}
            {isRestrictLoading ? "Restricting..." : "Restrict All"}
          </button>
          <button
            onClick={() => handleBulkToggle(true, setIsEnableLoading)}
            disabled={isEnableLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 transition text-sm sm:text-base cursor-pointer"
          >
            {isEnableLoading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {isEnableLoading ? "Enabling..." : "Enable All"}
          </button>
          <div className="relative w-[85%] sm:w-72 md:w-96">
            <Search
              className="absolute left-3 top-2.5 text-gray-400 pointer-events-none z-10"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-full sm:w-64 shadow-sm md:shadow-md md:hover:shadow-lg pl-10 pr-4 py-2 rounded-lg bg-white/10 text-gray-800 placeholder-gray-400
            border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4A5A6A]/60
            focus:border-transparent transition-all duration-200 backdrop-blur-sm
            hover:bg-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <span className="ml-auto text-xs sm:text-sm text-gray-600">
            Active: <b>{activeCount}</b> / {emails.length}
          </span>
        </div>
      </div>

      {!loading && filteredEmails.length === 0 && emails.length > 0 && (
        <div className="text-center text-gray-500 text-base sm:text-lg py-10">
          No emails match “{searchTerm}”
        </div>
      )}

      {/* Loader / Empty State */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
          <span className="ml-3 text-gray-600">Loading emails...</span>
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center text-gray-500 text-lg py-16">
          No emails found.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-md">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Sections</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmails.map((email) => (
                  <tr
                    key={email.email}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-3 flex items-center gap-2 text-gray-900">
                      <Mail className="text-gray-400" size={16} />
                      {email.email}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {email.allowed_sections?.join(", ") || "-"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          email.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {email.is_active ? "Active" : "Restricted"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(
                              "/api/admin/restrict_email",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({
                                  email: email.email,
                                  is_active: !email.is_active,
                                }),
                              }
                            );
                            const json = await res.json();
                            if (res.ok) {
                              toast.success(json.message);
                              setEmails((prev) =>
                                prev.map((e) =>
                                  e.email === email.email
                                    ? { ...e, is_active: !e.is_active }
                                    : e
                                )
                              );
                            } else
                              toast.error(json.message || "Update failed.");
                          } catch {
                            toast.error("Server error during update.");
                          }
                        }}
                        disabled={
                          email.email === "nikhilsk369@gmail.com" &&
                          loggedInEmail !== "nikhilsk369@gmail.com"
                        }
                        className={`px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2 cursor-pointer ${
                          email.is_active
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        } disabled:opacity-50`}
                      >
                        {email.is_active ? (
                          <Ban size={16} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        {email.is_active ? "Restrict" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredEmails.map((email) => (
              <div
                key={email.email}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="text-gray-400" size={18} />
                    <span className="text-gray-900 font-medium text-sm break-all">
                      {email.email}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      email.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {email.is_active ? "Active" : "Restricted"}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Sections
                  </p>
                  <p className="text-sm text-gray-700">
                    {email.allowed_sections?.join(", ") || "-"}
                  </p>
                </div>

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
                        toast.success(json.message);
                        setEmails((prev) =>
                          prev.map((e) =>
                            e.email === email.email
                              ? { ...e, is_active: !e.is_active }
                              : e
                          )
                        );
                      } else toast.error(json.message || "Update failed.");
                    } catch {
                      toast.error("Server error during update.");
                    }
                  }}
                  disabled={
                    email.email === "nikhilsk369@gmail.com" &&
                    loggedInEmail !== "nikhilsk369@gmail.com"
                  }
                  className={`mt-1 px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 cursor-pointer ${
                    email.is_active
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } disabled:opacity-50`}
                >
                  {email.is_active ? (
                    <Ban size={14} />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  {email.is_active ? "Restrict" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
