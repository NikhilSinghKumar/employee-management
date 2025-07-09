"use client";

import { useState } from "react";

export default function UploadTimesheet({ clientNumber, year, month, params }) {
  const client_number = clientNumber || params?.client_number;
  const year_value = year || params?.year;
  const month_value = month || params?.month;

  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const maxSize = 5 * 1024 * 1024;
    const validExtensions = [".xlsx", ".xls"];
    const extension = selectedFile.name.split(".").pop().toLowerCase();

    if (selectedFile.size > maxSize) {
      setUploadStatus("File size exceeds 5MB limit.");
      setFile(null);
    } else if (!validExtensions.includes(`.${extension}`)) {
      setUploadStatus(
        "Invalid file type. Please upload an .xlsx or .xls file."
      );
      setFile(null);
    } else {
      setFile(selectedFile);
      setUploadStatus("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("Please select a file.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Processing...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_number", client_number);
      formData.append("year", year_value);
      formData.append("month", month_value);

      const response = await fetch("/api/upload_timesheet", {
        method: "POST",
        body: formData,
        credentials: "include", // sends cookies with the request
      });

      const result = await response.json();

      if (!response.ok) {
        const message = Array.isArray(result.errors)
          ? result.errors.map((e) => e.error).join("\n")
          : result.error || "Upload failed";
        setUploadStatus(message);
      } else {
        setUploadStatus(result.message || "Timesheet uploaded successfully!");
      }
    } catch (err) {
      setUploadStatus(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 w-[500px]">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          disabled={isUploading}
          className="flex-grow block text-sm text-gray-900 border border-gray-300 rounded cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 file:bg-blue-500 file:text-white file:rounded-l-md file:border-none file:px-4 file:py-2 hover:file:bg-blue-600"
          aria-label="Upload Excel timesheet"
          aria-describedby="upload-status"
        />
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-44 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Upload Timesheet
        </button>
      </div>
      <p
        id="upload-status"
        className="text-center text-gray-700 whitespace-pre-line"
      >
        {uploadStatus}
      </p>
    </div>
  );
}
