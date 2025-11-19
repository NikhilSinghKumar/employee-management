import { Suspense } from "react";
import QuotationComponent from "./QuotationComponent";

export const metadata = {
  title: "Generate Quotation",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <QuotationComponent />
    </Suspense>
  );
}
