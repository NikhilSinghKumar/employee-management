"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, CheckCircle, RotateCcw, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FinanceTimesheetActions({
  clientNumber,
  month,
  year,
  status,
  onApprove,
  onRevision,
  submitting = false,
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-pointer">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() =>
            router.push(
              `/finance/timesheet/view/${clientNumber}/${year}/${month}`
            )
          }
        >
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>

        {status === "pending" && (
          <>
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={submitting}
              onClick={onApprove}
            >
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Approve
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              disabled={submitting}
              onClick={onRevision}
            >
              <RotateCcw className="mr-2 h-4 w-4 text-orange-600" />
              Send for Revision
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
