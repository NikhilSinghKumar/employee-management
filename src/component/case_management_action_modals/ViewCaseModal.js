"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ViewCaseModal({ isOpen, onClose, caseData }) {
  if (!caseData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complaint Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-gray-700">
          <p>
            <strong>Name:</strong> {caseData.cm_name}
          </p>
          <p>
            <strong>Mobile:</strong> {caseData.cm_mobile_no}
          </p>
          <p>
            <strong>Email:</strong> {caseData.cm_email}
          </p>
          <p>
            <strong>Complaint:</strong>
          </p>
          <p className="bg-gray-50 p-2 rounded-md whitespace-pre-wrap">
            {caseData.cm_complaint_description || "No description provided"}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
