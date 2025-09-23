"use client";

import { MdDelete } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function JobActions({ jobId, onEdit, onDelete }) {
  // Copy sharable link to clipboard
  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/careers/job_vacancies/${jobId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Sharable link copied!", {
        duration: 2000,
        position: "top-center",
      });
    } catch (err) {
      toast.error("Failed to copy link", {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  return (
    <div className="flex items-center gap-4 text-xl">
      {/* Edit */}
      <button
        onClick={() => onEdit(jobId)}
        className="text-blue-600 hover:text-blue-800 transition-transform hover:scale-110"
        title="Edit"
      >
        <FaRegEdit />
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(jobId)}
        className="text-rose-600 hover:text-rose-800 transition-transform hover:scale-110"
        title="Delete"
      >
        <MdDelete />
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className="text-indigo-500 text-xl cursor-pointer hover:text-indigo-700 hover:scale-110 transition-transform duration-200"
        title="Share"
      >
        <FiShare2 />
      </button>
    </div>
  );
}
