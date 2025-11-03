import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function EditEmailModal({ onClose, emailData, onSuccess }) {
  const [email, setEmail] = useState(emailData?.email || "");
  const [role, setRole] = useState(emailData?.role || "");
  const [allowedSections, setAllowedSections] = useState(
    emailData?.allowed_sections || []
  );
  const [loading, setLoading] = useState(false);

  const roles = [
    "Admin",
    "HR",
    "Operations",
    "A&T",
    "T&A",
    "Sales",
    "Finance",
    "User",
  ];
  const sectionOptions = [
    "Dashboard",
    "AT",
    "HR",
    "Finance",
    "Operations",
    "Sales",
    "TA",
    "CM",
  ];

  const handleCheck = (section) => {
    setAllowedSections((prev) =>
      prev.includes(section)
        ? prev.filter((item) => item !== section)
        : [...prev, section]
    );
  };

  const handleSubmit = async () => {
    if (!role) {
      return toast.error("Role is required!");
    }

    try {
      setLoading(true);
      const res = await fetch("/api/admin/allowed_emails", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          role,
          allowed_sections: allowedSections,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.message || "Error updating email!");
        return;
      }

      toast.success("Updated successfully!");
      onSuccess && onSuccess(); // Refresh table
      onClose();
    } catch (error) {
      toast.error("Server error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-[90%] sm:w-[400px] p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Edit Email Access</h2>

        {/* Email (Read-only) */}
        <label className="block mb-1 text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full border px-3 py-2 rounded-lg mb-4 bg-gray-100"
        />

        {/* Role Dropdown */}
        <label className="block mb-1 text-sm font-medium">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border px-3 py-2 rounded-lg mb-4 focus:outline-none focus:ring focus:ring-blue-300"
        >
          <option value="">-- Select Role --</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Checkbox Sections */}
        <label className="block mb-2 text-sm font-medium">
          Allowed Sections
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {sectionOptions.map((section) => (
            <label key={section} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={allowedSections.includes(section)}
                onChange={() => handleCheck(section)}
              />
              <span className="text-sm">{section}</span>
            </label>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
