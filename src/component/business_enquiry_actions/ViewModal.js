"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ViewModal({ open, onClose, enquiry }) {
  if (!enquiry) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">
            {enquiry.company_name || "Company Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <p className="text-sm font-bold text-gray-500">Request Type</p>
            <p className="text-base text-gray-800">{enquiry.request_type}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="text-base text-gray-800">
              {enquiry.description || "No description provided."}
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
