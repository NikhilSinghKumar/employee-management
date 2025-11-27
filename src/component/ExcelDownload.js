"use client";

import { useState } from "react";
import { IoMdCloudDownload } from "react-icons/io";
import { toast } from "react-hot-toast";

export default function ExcelDownload({ data, searchQuery }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);

    // 🚫 If searching and no filtered result
    if (searchQuery && (!data || data.length === 0)) {
      toast.error("No matching records found to download.", {
        position: "top-center",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/download?searchQuery=${encodeURIComponent(searchQuery)}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: searchQuery ? JSON.stringify(data) : undefined,
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to download file.";

        try {
          const err = await response.json();
          if (err?.error) errorMessage = err.error;
        } catch {}

        toast.error(errorMessage, { position: "top-center" });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "employees.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);

      toast.success("Excel downloaded successfully!", {
        position: "top-center",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Unexpected error. Please try again.", {
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-5 py-2 text-white rounded cursor-pointer ${
        loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
      }`}
    >
      <IoMdCloudDownload className="text-xl" />
      {loading ? "Downloading..." : "Download Excel"}
    </button>
  );
}
