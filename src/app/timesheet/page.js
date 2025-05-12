import { Suspense } from "react";
import TimesheetPage from "../../component/TimesheetPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading timesheet...</div>}>
      <TimesheetPage />
    </Suspense>
  );
}
