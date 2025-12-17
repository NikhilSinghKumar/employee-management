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
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-pointer">
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
          className="cursor-pointer"
          disabled={status === "closed"}
          onClick={() =>
            router.push(
              `/dashboard/operations/edit_timesheet/${clientNumber}/${year}/${month}`
            )
          }
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>

        {/* Submit */}
        <DropdownMenuItem
          disabled={status === "submitted" || status === "closed"}
          onClick={() => onSubmit?.()}
          className="text-green-600 focus:text-green-600 cursor-pointer"
        >
          <Send className="mr-2 h-4 w-4" />
          Submit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
