"use client";
import { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CgProfile } from "react-icons/cg";
import { IoPower } from "react-icons/io5";
import { UserContext } from "@/context/UserContext";
import Dropdown from "@/component/Dropdown";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Navbar() {
  const { user, fetchUser } = useContext(UserContext);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      // Refresh the user context to clear user state after logout
      fetchUser();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white text-black px-14 font-medium py-2 flex justify-between items-center text-base h-16 shadow">
      <div className="flex items-center gap-6">
        <Link href="/services">
          <Image
            src="/logo.png"
            alt="Company Logo"
            width={60}
            height={60}
            className="cursor-pointer"
            priority
          />
        </Link>
        <Dropdown
          label="Sales"
          items={[
            { label: "Opportunities", href: "/opportunities" },
            { label: "Quotation", href: "/quotation" },
            { label: "Contracts", href: "/contracts" },
          ]}
        />
        <Dropdown
          label="Finance"
          items={[{ label: "Invoices", href: "/invoices" }]}
        />
        <Dropdown
          label="Human Resource"
          items={[
            { label: "New Employee Form", href: "/etmam_employee_form" },
            { label: "Etmam Employees", href: "/etmam_employees" },
            { label: "Etmam Timesheet", href: "/etmam_timesheet" },
          ]}
        />
        <Dropdown
          label="Operations"
          items={[
            { label: "Add Employee", href: "/add_employee" },
            { label: "Onboarding", href: "/onboarding" },
            { label: "All Employees", href: "/employee_list" },
            { label: "All Clients", href: "/all_clients" },
            { label: "Timesheet/ Payroll", href: "/all_timesheet" },
          ]}
        />
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
