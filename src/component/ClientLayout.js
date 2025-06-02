"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  const allowedRoutes = [
    /^\/services/,
    /^\/employee_list/,
    /^\/onboarding/,
    /^\/etmam_employee_form/,
    /^\/add_employee/,
    /^\/edit_employee(\/|$)/,
    /^\/all_timesheet(\/|$)/,
    /^\/timesheet(\/|$)/,
    /^\/etmam_employees(\/|$)/,
  ];
  const showNavbar = allowedRoutes.some((pattern) => pattern.test(pathname));
  console.log("Current pathname:", pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
}
