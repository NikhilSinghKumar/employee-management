"use client";

import { useRouter } from "next/navigation";
import { MoreVertical, Eye, Pencil, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function TimesheetActions({
  clientNumber,
  year,
  month,
  status,
  onSubmit,
  submitting = false,
}) {
  const router = useRouter();

  const canEdit = ["draft", "revision_required"].includes(status);
  const canSubmit =
    ["draft", "revision_required"].includes(status) && !submitting;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          aria-label="Actions"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        {/* View */}
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() =>
            router.push(
              `/dashboard/operations/timesheet/${clientNumber}/${year}/${month}`
            )
          }
        >
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>

        {/* Edit */}
        <DropdownMenuItem
          disabled={!canEdit}
          className={
            !canEdit ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }
          onClick={() => {
            if (!canEdit) return;
            router.push(
              `/dashboard/operations/edit_timesheet/${clientNumber}/${year}/${month}`
            );
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>

        {/* Submit (Send to Finance) */}
        <DropdownMenuItem
          disabled={!canSubmit}
          className={
            !canSubmit
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer text-green-600 focus:text-green-600"
          }
          onClick={() => {
            if (!canSubmit) return;
            onSubmit?.();
          }}
        >
          <Send className="mr-2 h-4 w-4" />
          {submitting ? "Submitting..." : "Send to Finance"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
