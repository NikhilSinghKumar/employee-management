"use client";

import { useState, useEffect } from "react";
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
import StatusBadge from "@/components/StatusBadge"; // ✅ your badge component

export default function BusinessStatusModal({
  open,
  onClose,
  enquiry,
  onUpdated,
}) {
  const [status, setStatus] = useState(enquiry?.status || "");
  const [remarks, setRemarks] = useState(enquiry?.remarks || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatus(enquiry?.status || "");
    setRemarks(enquiry?.remarks || "");
  }, [enquiry]);

  const handleUpdate = async () => {
    if (!enquiry?.id) return toast.error("Invalid enquiry selected");

    try {
      setLoading(true);
      const res = await fetch(
        `/api/sales/business_enquiry_private/${enquiry.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, remarks }),
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
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Update Enquiry Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Select new status
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">
                <StatusBadge status="new" />
              </SelectItem>
              <SelectItem value="contacted">
                <StatusBadge status="contacted" />
              </SelectItem>
              <SelectItem value="in_progress">
                <StatusBadge status="in progress" />
              </SelectItem>
              <SelectItem value="converted">
                <StatusBadge status="converted" />
              </SelectItem>
              <SelectItem value="rejected">
                <StatusBadge status="rejected" />
              </SelectItem>
            </SelectContent>
          </Select>

          <label className="text-sm font-medium text-gray-700 mt-3">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add remarks..."
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="cursor-pointer"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
