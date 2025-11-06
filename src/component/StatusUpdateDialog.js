"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";

export default function StatusUpdateDialog({
  enquiry,
  open,
  onClose,
  onUpdated,
}) {
  const [status, setStatus] = useState(enquiry?.status || "");
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { label: "New", value: "new", color: "bg-blue-100 text-blue-800" },
    {
      label: "Contacted",
      value: "contacted",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      label: "In Progress",
      value: "in_progress",
      color: "bg-purple-100 text-purple-800",
    },
    {
      label: "Converted",
      value: "converted",
      color: "bg-green-100 text-green-800",
    },
    { label: "Rejected", value: "rejected", color: "bg-red-100 text-red-800" },
  ];

  const handleSave = async () => {
    if (!status) {
      toast.error("Please select a status");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/api/sales/business_enquiry_private/${enquiry.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Status updated successfully");
        onUpdated();
        onClose();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${s.color}`}
                  >
                    {s.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
