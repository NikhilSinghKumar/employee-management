import { Suspense } from "react";
import EtmamTimesheetPage from "../../component/EtmamTimesheetPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading timesheet...</div>}>
      <EtmamTimesheetPage />
    </Suspense>
  );
}
