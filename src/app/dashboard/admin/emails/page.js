"use client";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import AddEmailModal from "@/component/AddEmailModal";
import EditEmailModal from "@/component/EditEmailModal";
import {
  Ban,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  Search,
  Plus,
  SquarePen,
  Trash2,
  ShieldBan,
} from "lucide-react";

export default function AdminEmails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedInEmail, setLoggedInEmail] = useState(null);
  const [isRestrictLoading, setIsRestrictLoading] = useState(false);
  const [isEnableLoading, setIsEnableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);

  const ROLE_LABELS = {
    admin: "Admin",
    hr: "HR",
    operations: "Operations",
    "a&t": "A&T",
    "t&a": "T&A",
    sales: "Sales",
    finance: "Finance",
    user: "User",
  };

  const getRoleLabel = (role) => ROLE_LABELS[role] || role;

  const fetchEmails = async () => {
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

  const deleteEmail = async (email) => {
    if (!confirm("Are you sure you want to delete this email?")) return;

    const res = await fetch("/api/admin/allowed_emails", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });

    const json = await res.json();
    if (res.ok) {
      toast.success("Email deleted!");
      fetchEmails();
    } else {
      toast.error(json.message || "Failed to delete.");
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
        await fetchEmails();
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
      fetchEmails();
    })();
  }, []);

  const filteredEmails = emails.filter((item) =>
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = emails.filter((e) => e.is_active).length;

  const toggleStatus = async (email) => {
    try {
      const res = await fetch(`/api/admin/restrict_email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.email,
          is_active: !email.is_active,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Status updated");
        fetchEmails(); // refresh the table immediately
      } else {
        toast.error(data.message || "Update failed.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    }
  };

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
            border border-slate-170 focus:outline-none focus:ring-2 focus:ring-[#4A5A6A]/60
            focus:border-transparent transition-all duration-170 backdrop-blur-sm
            hover:bg-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm hover:shadow-md transition text-sm sm:text-base cursor-pointer"
          >
            <Plus size={16} /> Add Email
          </button>
          <span className="ml-auto text-xs sm:text-sm text-gray-600">
            Active: <b>{activeCount}</b> / {emails.length}
          </span>
        </div>
      </div>

      {/* Loader / Empty State */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
          <span className="ml-3 text-gray-600 animate-pulse">
            Loading emails...
          </span>
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
                  <th className="px-6 py-3 text-left">Permission</th>
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
                    <td className="px-6 py-3 text-gray-600 capitalize">
                      <span className="font-medium">
                        {getRoleLabel(email.role)}
                      </span>
                      <br />
                      <span className="text-sm text-gray-500">
                        {email.allowed_sections?.length
                          ? email.allowed_sections.join(", ")
                          : "-"}
                      </span>
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
                      <div className="flex items-center gap-2 border border-red-300/40 rounded-md px-2 py-1 bg-white shadow-sm">
                        {/* Toggle Status */}
                        {email.email !== loggedInEmail && (
                          <button
                            onClick={() => toggleStatus(email)}
                            className="p-1.5 rounded-md hover:bg-gray-100 hover:scale-110 transition-transform duration-170 cursor-pointer"
                            title={
                              email.is_active
                                ? "Disable Access"
                                : "Enable Access"
                            }
                          >
                            {email.is_active ? (
                              <ShieldBan
                                className="text-orange-600"
                                size={18}
                              />
                            ) : (
                              <ShieldCheck
                                className="text-green-600"
                                size={18}
                              />
                            )}
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => setEditModal(email)}
                          className="p-1.5 rounded-md hover:bg-gray-100 hover:scale-110 transition-transform duration-170 cursor-pointer"
                          title="Edit Role & Permissions"
                        >
                          <SquarePen size={18} className="text-blue-600" />
                        </button>

                        {/* Delete */}
                        {email.email !== loggedInEmail && (
                          <button
                            onClick={() => deleteEmail(email.email)}
                            className="p-1.5 rounded-md hover:bg-gray-100 hover:scale-110 transition-transform duration-200 cursor-pointer"
                            title="Delete Email"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        )}
                      </div>
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

                {/* Role */}
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Role</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {getRoleLabel(email.role) || "-"}
                  </p>
                </div>

                {/* Allowed Sections */}
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Sections
                  </p>
                  <p className="text-sm text-gray-700 break-words">
                    {email.allowed_sections?.length
                      ? email.allowed_sections.join(", ")
                      : "-"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    {/* Toggle Status */}
                    {email.email !== loggedInEmail && (
                      <button
                        onClick={() => toggleStatus(email)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-transform hover:scale-105 active:scale-95"
                      >
                        {email.is_active ? (
                          <>
                            <ShieldBan size={14} className="text-red-500" />
                            <span>Disable</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={14} className="text-green-600" />
                            <span>Enable</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => setEditModal(email)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg text-xs font-medium text-blue-700 transition-transform hover:scale-105 active:scale-95"
                    >
                      <SquarePen size={14} />
                      <span>Edit</span>
                    </button>

                    {/* Delete */}
                    {email.email !== loggedInEmail && (
                      <button
                        onClick={() => deleteEmail(email.email)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-medium text-red-600 transition-transform hover:scale-105 active:scale-95"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {!loading && filteredEmails.length === 0 && emails.length > 0 && (
        <div className="text-center text-gray-500 text-base sm:text-lg py-10">
          No emails match “{searchTerm}”
        </div>
      )}
      {showAddModal && (
        <AddEmailModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchEmails}
        />
      )}
      {editModal && (
        <EditEmailModal
          emailData={editModal}
          onClose={() => setEditModal(null)}
          onSuccess={fetchEmails}
        />
      )}
    </div>
  );
}
