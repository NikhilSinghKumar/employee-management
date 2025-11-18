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

export default function PreviewQuotationModal({ open, setOpen, data }) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Quotation Preview
          </DialogTitle>
          <DialogDescription>
            Review all details before generating quotation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* COMPANY SECTION */}
          <div className="border p-4 rounded-lg space-y-2 bg-gray-50">
            <h2 className="font-semibold text-lg text-gray-700">
              Client Details
            </h2>
            <p>
              <strong>Company Name:</strong> {data.company_name}
            </p>
            <p>
              <strong>CR Number:</strong> {data.company_cr_number}
            </p>
            <p>
              <strong>Activity:</strong> {data.company_activity}
            </p>
            <p>
              <strong>Signatory:</strong> {data.signatory}
            </p>
            <p>
              <strong>Designation:</strong> {data.designation}
            </p>
            <p>
              <strong>Mobile:</strong> {data.mobile_no}
            </p>
            <p>
              <strong>Email:</strong> {data.email}
            </p>
            <p>
              <strong>Remarks:</strong> {data.remarks}
            </p>
          </div>

          {/* QUOTATION OPTIONS */}
          <div className="border p-4 rounded-lg space-y-2 bg-gray-50">
            <h2 className="font-semibold text-lg text-gray-700">
              Quotation Options
            </h2>
            <p>
              <strong>Quotation Type:</strong> {data.quotation_type}
            </p>
            <p>
              <strong>No. of Workers:</strong> {data.no_of_workers}
            </p>
            <p>
              <strong>Nationality:</strong> {data.nationality || "Any"}
            </p>
            <p>
              <strong>Professions:</strong> {data.professions}
            </p>
            <p>
              <strong>Contract Duration:</strong> {data.contract_duration}
            </p>
          </div>

          {/* SALARY */}
          <div className="border p-4 rounded-lg space-y-2 bg-gray-50">
            <h2 className="font-semibold text-lg text-gray-700">
              Salary / Cost Details
            </h2>
            <p>
              <strong>Basic Salary:</strong> {data.basic_salary}
            </p>
            <p>
              <strong>Food Allowance:</strong> {data.food_allowance}
            </p>
            <p>
              <strong>Accommodation:</strong> {data.accommodation_cost}
            </p>
            <p>
              <strong>Transportation:</strong> {data.transportation_cost}
            </p>
            <p>
              <strong>Other Costs:</strong> {data.other_costs}
            </p>
            <p>
              <strong>Monthly Cost / Worker:</strong>{" "}
              {data.monthly_cost_per_worker}
            </p>
          </div>

          {/* TERMS */}
          <div className="border p-4 rounded-lg space-y-2 bg-gray-50">
            <h2 className="font-semibold text-lg text-gray-700">
              Terms & Commitments
            </h2>
            <p>
              <strong>Etmam Commitments:</strong> {data.etmam_commitments}
            </p>
            <p>
              <strong>Client Commitments:</strong> {data.client_commitments}
            </p>
            <p>
              <strong>General Terms:</strong> {data.general_terms}
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
