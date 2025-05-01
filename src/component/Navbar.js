"use client";
import { useState, useContext, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { CgProfile } from "react-icons/cg";
import { IoPower } from "react-icons/io5";
import { UserContext } from "@/context/UserContext";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Navbar() {
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isOperationsOpen, setIsOperationsOpen] = useState(false);
  const { user, fetchUser } = useContext(UserContext);
  const router = useRouter();
  const operationsRef = useRef(null);
  const financeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        operationsRef.current &&
        !operationsRef.current.contains(event.target)
      ) {
        setIsOperationsOpen(false);
      }
      if (financeRef.current && !financeRef.current.contains(event.target)) {
        setIsFinanceOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include", // ensures cookies are sent
      });

      // Refresh the user context to clear user state after logout
      fetchUser();

      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-white text-black px-14 font-medium py-2 flex justify-between items-center text-base">
      <div className="flex gap-6">
        <Link href="">Sales</Link>
        <div className="relative" ref={financeRef}>
          <button
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => setIsFinanceOpen(!isFinanceOpen)}
          >
            Finance
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          {isFinanceOpen && (
            <div className="absolute left-0 top-full mt-2 bg-white text-black shadow-md w-48 rounded-md overflow-hidden z-50">
              <Link
                href="/invoices"
                className="block px-4 py-2 hover:bg-gray-200"
              >
                Invoices
              </Link>
            </div>
          )}
        </div>
        <Link href="">HR</Link>
        <div className="relative" ref={operationsRef}>
          <button
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => setIsOperationsOpen(!isOperationsOpen)}
          >
            Operations
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          {isOperationsOpen && (
            <div className="absolute left-0 top-full mt-2 bg-white text-black shadow-md w-48 rounded-md overflow-hidden z-50">
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
                Timesheet/ Payroll
              </Link>
            </div>
          )}
        </div>
      </div>

      {user && (
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-1">
            <CgProfile className="w-5 h-5" />
            <p>Hi {user.first_name}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <IoPower className="w-5 h-5 stroke-1" />
            <button onClick={handleLogout} className="cursor-pointer">
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
