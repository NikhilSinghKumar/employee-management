"use client";
import { useState, useContext } from "react";
import Link from "next/link";
import { UserContext } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { CgProfile } from "react-icons/cg";
import { LiaSignOutAltSolid } from "react-icons/lia";

export function Navbar() {
  const [isOperationsOpen, setIsOperationsOpen] = useState(false);
  const { user, fetchUser } = useContext(UserContext);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/");

      setTimeout(() => {
        fetchUser(); // Ensure latest session state
      }, 2000);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  console.log("user logged in: ", user);
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

      {user && (
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-1">
            <CgProfile className="w-6 h-6" />
            <p>Hi {user.first_name} </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <LiaSignOutAltSolid className="w-6 h-6 stroke-1" />
            <button onClick={handleLogout} className="cursor-pointer">
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
