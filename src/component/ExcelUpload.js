"use client";
import { useState, useRef } from "react";
import { MdCloudUpload } from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ExcelUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage("File size exceeds 5MB. Please upload a smaller file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setMessage("File uploaded successfully!");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
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
    <div className="p-6 bg-white rounded-lg">
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
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>

      {message && <p className="mt-3 text-gray-700">{message}</p>}
    </div>
  );
}
