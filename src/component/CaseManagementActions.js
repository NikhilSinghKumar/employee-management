"use client";

import { useState } from "react";
import { MoreVertical, Eye, UserCheck, Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function CaseManagementActions({ enquiry, onAction }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await onAction(action, enquiry);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-gray-100 rounded-full"
          disabled={loading}
        >
          <MoreVertical className="h-5 w-5 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-44">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleAction("view")}>
          <Eye className="w-4 h-4 mr-2 text-blue-500" /> View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("assign")}>
          <UserCheck className="w-4 h-4 mr-2 text-amber-500" /> Assign
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("status")}>
          <Edit2 className="w-4 h-4 mr-2 text-green-600" /> Update Status
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("delete")}>
          <Trash2 className="w-4 h-4 mr-2 text-red-500" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
