"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function UploadTimesheet({
  clientNumber,
  year,
  month,
  params,
  onUploadSuccess,
}) {
  const client_number = clientNumber || params?.client_number;
  const year_value = year || params?.year;
  const month_value = month || params?.month;

  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const validateExcelFile = async (selectedFile) => {
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", raw: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
      });

      if (!jsonData || jsonData.length < 1) {
        return { valid: false, error: "Excel file is empty or invalid." };
      }

      const rawHeaders = jsonData[0];
      const normalizeHeader = (header) =>
        header
          ?.toString()
          .toLowerCase()
          .replace(/[\s\xA0]+/g, "")
          .replace(/[^\x20-\x7E]/g, "")
          .trim();

      const headerMap = {
        iqamanumber: "iqama_number",
        iqamano: "iqama_number",
        iqamanum: "iqama_number",
        idnumber: "iqama_number",
        iqama: "iqama_number",
        employeeid: "iqama_number",
      };

      const normalizedHeaders = rawHeaders.map((h) => {
        const normalized = normalizeHeader(h);
        return headerMap[normalized] || normalized;
      });

      if (!normalizedHeaders.includes("iqama_number")) {
        return {
          valid: false,
          error: "Excel file must contain an 'Iqama Number' column.",
        };
      }

      const iqamaIndex = normalizedHeaders.indexOf("iqama_number");
      const dataRows = jsonData.slice(1); // Skip header row
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        // Check if the row is effectively blank (all values are undefined, null, or empty strings)
        const isRowBlank = row.every(
          (cell) => !cell || cell.toString().trim() === ""
        );
        if (isRowBlank) continue; // Skip blank rows

        const iqamaValue = row[iqamaIndex];
        if (
          !iqamaValue ||
          iqamaValue.toString().trim() === "" ||
          typeof iqamaValue === "undefined"
        ) {
          return {
            valid: false,
            error: `Missing or empty Iqama Number in row ${i + 2}.`,
          };
        }
      }

      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: `Error reading Excel file: ${err.message}`,
      };
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setUploadStatus("No file selected.");
      setFile(null);
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const validExtensions = [".xlsx", ".xls"];
    const extension = selectedFile.name.split(".").pop().toLowerCase();

    if (selectedFile.size > maxSize) {
      setUploadStatus("File size exceeds 5MB limit.");
      setFile(null);
      return;
    }

    if (!validExtensions.includes(`.${extension}`)) {
      setUploadStatus(
        "Invalid file type. Please upload an .xlsx or .xls file."
      );
      setFile(null);
      return;
    }

    // Validate Excel content
    const validation = await validateExcelFile(selectedFile);
    if (!validation.valid) {
      setUploadStatus(validation.error);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setUploadStatus("");
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("Please select a valid file.");
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
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        const message = Array.isArray(result.errors)
          ? result.errors.map((e) => `Row ${e.row}: ${e.error}`).join("\n")
          : result.error || "Upload failed";
        setUploadStatus(message);
      } else {
        setUploadStatus(result.message || "Timesheet uploaded successfully!");
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        setFile(null);
        document.querySelector('input[type="file"]').value = ""; // Clear file input
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
