"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

export function Navbar() {
  const [isOperationsOpen, setIsOperationsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <div className="flex gap-6">
        <Link href="" className="hover:underline">
          Sales
        </Link>
        <Link href="" className="hover:underline">
          Finance
        </Link>
        <Link href="" className="hover:underline">
          HR
        </Link>
        <div className="relative">
          <button
            className="flex items-center gap-1 hover:underline"
            onClick={() => setIsOperationsOpen(!isOperationsOpen)}
          >
            Operations
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          {isOperationsOpen && (
            <div className="absolute left-0 top-full mt-2 bg-white text-black shadow-md w-48 rounded-md overflow-hidden">
              <Link
                href="/add_employee"
                className="block px-4 py-2 hover:bg-gray-200"
              >
                Add Employee
              </Link>
              <Link
                href="/employee_list"
                className="block px-4 py-2 hover:bg-gray-200"
              >
                All Employees
              </Link>
              <Link
                href="/all_clients"
                className="block px-4 py-2 hover:bg-gray-200"
              >
                All Clients
              </Link>
              <Link
                href="/timesheet_payroll"
                className="block px-4 py-2 hover:bg-gray-200"
              >
                Timesheet/Payroll
              </Link>
              <Link
                href="/invoices"
                className="block px-4 py-2 hover:bg-gray-200"
              >
                Invoices
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        <Link href="" className="hover:underline">
          Profile
        </Link>
        <button onClick={handleLogout} className="hover:underline">
          Logout
        </button>
      </div>
    </nav>
  );
}
