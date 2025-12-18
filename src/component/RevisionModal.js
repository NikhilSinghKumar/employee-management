"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function RevisionModal({
  open,
  onClose,
  reason,
  setReason,
  onSubmit,
  submitting = false,
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Timesheet for Revision</DialogTitle>
        </DialogHeader>

        <Textarea
          placeholder="Enter revision reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>

          <Button
            onClick={onSubmit}
            disabled={submitting || !reason.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Send for Revision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
