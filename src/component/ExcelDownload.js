"use client";

import { useState } from "react";
import { IoMdCloudDownload } from "react-icons/io";

export default function ExcelDownload() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/download`, {
        method: "GET",
        credentials: "include", // Include JWT in cookies
      });

      if (!response.ok) {
        throw new Error("Failed to download the file.");
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
    } catch (error) {
      console.error("Download failed:", error);
      alert("Error downloading the file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg text-center">
      <button
        onClick={handleDownload}
        disabled={loading}
        className={`flex items-center justify-center gap-2 px-5 py-2 text-white rounded ${
          loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        <IoMdCloudDownload className="text-xl" />
        {loading ? "Downloading..." : "Download Excel"}
      </button>
    </div>
  );
}
