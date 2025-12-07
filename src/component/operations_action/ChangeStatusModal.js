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
import { Input } from "@/components/ui/input";

export default function ChangeStatusModal({
  open,
  onClose,
  employee,
  onSuccess, // refetchEmployees passed from parent
}) {
  const [status, setStatus] = useState(employee?.employee_status || "Active");
  const [inactiveDate, setInactiveDate] = useState(
    employee?.inactive_date || ""
  );
  const [remarks, setRemarks] = useState(employee?.remarks || "");

  const updateStatus = async () => {
    try {
      const response = await fetch(
        `/api/employees/change_status/${employee.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_status: status,
            inactive_date: inactiveDate,
            remarks: remarks,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      onSuccess(); // refetchEmployees
      onClose(); // close modal
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Change Employee Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Status */}
          <div>
            <label className="block mb-1 text-sm font-medium">
              Employee Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inactive Date */}
          <div>
            <label className="block mb-1 text-sm font-medium">
              Inactive Date
            </label>
            <Input
              type="date"
              value={inactiveDate}
              onChange={(e) => setInactiveDate(e.target.value)}
              disabled={status === "Active"}
              className={
                status === "Active" ? "opacity-50 cursor-not-allowed" : ""
              }
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block mb-1 text-sm font-medium">Remarks</label>
            <Select value={remarks} onValueChange={setRemarks}>
              <SelectTrigger>
                <SelectValue placeholder="Select remark" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="End of contract">End of contract</SelectItem>
                <SelectItem value="Reject to work">Reject to work</SelectItem>
                <SelectItem value="Runaway">Runaway</SelectItem>
                <SelectItem value="Terminated by ETMAM">
                  Terminated by ETMAM
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={updateStatus}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
