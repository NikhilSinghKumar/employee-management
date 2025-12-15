"use client";

export default function DownloadTimesheet({ clientNumber, year, month }) {
  const handleDownload = async () => {
    const query = new URLSearchParams({
      clientNumber,
      year,
      month: month.toString().padStart(2, "0"),
    }).toString();

    const response = await fetch(`/api/download_timesheet?${query}`, {
      method: "GET",
    });

    if (!response.ok) {
      alert("Failed to download timesheet.");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Timesheet_${clientNumber}_${year}_${month}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <button
      onClick={handleDownload}
      className="px-4 py-2 bg-blue-600 text-white cursor-pointer rounded hover:bg-blue-700"
    >
      Download Timesheet
    </button>
  );
}
