"use client";
import { useState, useRef } from "react";

export default function ExcelUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null); // <-- Add ref for file input

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowedTypes.includes(file.type)) {
      setMessage(
        "Invalid file type. Please upload an Excel file (.xlsx or .xls)."
      );
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setMessage("File size exceeds 5MB. Please upload a smaller file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setMessage("File uploaded successfully!");
        setFile(null); // Reset state
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // <-- Manually reset the file input field
        }
      } else {
        setMessage(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Upload Employee Data</h2>

      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(e) => setFile(e.target.files[0])}
          className="border p-2 rounded w-full"
          disabled={loading}
          ref={fileInputRef} // <-- Attach ref to file input
        />

        <button
          type="submit"
          className={`px-4 py-2 rounded text-white ${
            loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {message && <p className="mt-3 text-gray-700">{message}</p>}
    </div>
  );
}
