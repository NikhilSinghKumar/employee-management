"use client";
import { useState } from "react";
import { IoMdCloudDownload } from "react-icons/io";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ExcelDownload() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/download`);
      if (!response.ok) throw new Error("Failed to download");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "employees.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <button
        onClick={handleDownload}
        className={`flex items-center gap-2 px-4 py-2 rounded text-white ${
          loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
        }`}
        disabled={loading}
      >
        <IoMdCloudDownload className="text-xl" />
        {loading ? "Downloading..." : "Download"}
      </button>
    </div>
  );
}
