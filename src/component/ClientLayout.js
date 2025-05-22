"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  const allowedRoutes = [
    /^\/services/,
    /^\/employee_list/,
    /^\/onboarding/,
    /^\/add_employee/,
    /^\/edit_employee(\/|$)/,
    /^\/all_timesheet(\/|$)/,
    /^\/timesheet(\/|$)/,
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
