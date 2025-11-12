"use client";

import React from "react";
import clsx from "clsx"; // optional, helps combine class names

const statusColors = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-blue-100 text-blue-700",
  "in-progress": "bg-yellow-100 text-orange-700",
  converted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  resolved: "bg-emerald-100 text-emerald-700",
  open: "bg-slate-100 text-yellow-700",
};

export default function StatusBadge({ status }) {
  const normalized = status?.toLowerCase() || "new";

  return (
    <span
      className={clsx(
        "px-2 py-1 rounded-full text-xs font-medium capitalize",
        statusColors[normalized] || "bg-gray-100 text-gray-700"
      )}
    >
      {normalized.replace("-", " ")}
    </span>
  );
}
