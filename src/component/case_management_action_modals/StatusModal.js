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

export default function StatusModal({
  isOpen,
  onClose,
  caseData,
  onStatusUpdated,
}) {
  const [status, setStatus] = useState(caseData?.cm_status || "");
  const [remarks, setRemarks] = useState(caseData?.remarks || "");

  useEffect(() => {
    setStatus(caseData?.cm_status || "");
    setRemarks(caseData?.remarks || "");
  }, [caseData]);

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/case_management/case_handler`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: caseData.id,
          cm_status: status,
          remarks: remarks,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");
      toast.success("Status updated successfully");
      onStatusUpdated();
      onClose();
    } catch {
      toast.error("Error updating status");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Update Case Status
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
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  New
                </span>
              </SelectItem>

              <SelectItem value="open">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-yellow-700">
                  Open
                </span>
              </SelectItem>

              <SelectItem value="in-progress">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-orange-700">
                  In Progress
                </span>
              </SelectItem>

              <SelectItem value="resolved">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Resolved
                </span>
              </SelectItem>

              <SelectItem value="rejected">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Rejected
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          {/* ✅ Remarks input */}
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
          >
            Cancel
          </Button>
          <Button className="cursor-pointer" onClick={handleUpdate}>
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
