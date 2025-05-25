"use client";

import { useEffect, useState, useRef } from "react";
import { MdCloudUpload } from "react-icons/md";

export default function EtmamEmployeeUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.title = "Upload Employees";
  }, []);

  useEffect(() => {
    if (message && message.includes("successfully")) {
      const timer = setTimeout(() => setMessage(""), 3000); // Clear after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a file.");
      return;
    }

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
      const response = await fetch(`/api/etmam_employees_upload`, {
        method: "POST",
        credentials: "include", // Send JWT cookie
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("File uploaded successfully!");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setMessage(`Upload failed: ${data.error || "Unknown error."}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg mt-10">
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setFile(e.target.files[0])}
            className="border p-2 rounded w-[75%] sm:w-[60%]"
            disabled={loading}
            ref={fileInputRef}
          />
          <button
            type="submit"
            className={`flex items-center gap-2 px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            }`}
            disabled={loading}
          >
            <MdCloudUpload className="text-xl" />
            {loading ? "Uploading..." : "Upload Excel"}
          </button>
        </div>
        {/* Reserve space for the message to prevent layout shift */}
        <div className="h-6">
          {message && (
            <p
              className={`text-sm  ${
                message.includes("successfully")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
