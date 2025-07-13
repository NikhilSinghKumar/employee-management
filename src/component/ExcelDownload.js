"use client";

import { useState } from "react";
import { IoMdCloudDownload } from "react-icons/io";

export default function ExcelDownload({ data, searchQuery }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // If searchQuery exists, send the filtered data; otherwise, fetch all data
      const response = await fetch(
        `/api/download?searchQuery=${encodeURIComponent(searchQuery)}`,
        {
          method: "POST", // Changed to POST to send data
          credentials: "include", // Include JWT in cookies
          headers: {
            "Content-Type": "application/json",
          },
          body: searchQuery ? JSON.stringify(data) : undefined, // Send data only if searchQuery exists
        }
      );

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
