"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  const allowedRoutes = [
    /^\/dashboard/,
    /^\/operations(\/|$)/,
    /^\/human_resource(\/|$)/,
    /^\/admin(\/|$)/,
  ];
  const showNavbar = allowedRoutes.some((pattern) => pattern.test(pathname));

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
}
