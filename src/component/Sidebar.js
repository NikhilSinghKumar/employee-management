"use client";
import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  Users,
  BadgeDollarSign,
  Cog,
  BriefcaseBusiness,
  Building2,
  ContactRound,
  ToolCase,
  Settings,
  LayoutDashboard,
  X,
} from "lucide-react";
import Link from "next/link";

export default function Sidebar({ isOpen, onClose }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [activeMenu, setActiveMenu] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const [indicatorPos, setIndicatorPos] = useState({ top: 0, height: 0 });

  const menus = [
    {
      title: "HR",
      icon: <Users className="w-5 h-5" />,
      key: "hr",
      items: [
        {
          name: "Staff Form",
          href: "/dashboard/human_resource/etmam_employee_form",
        },
        {
          name: "Etmam Staffs",
          href: "/dashboard/human_resource/etmam_employees",
        },
        {
          name: "Etmam Timesheet",
          href: "/dashboard/human_resource/etmam_timesheet",
        },
      ],
    },
    {
      title: "Finance",
      icon: <BadgeDollarSign className="w-5 h-5" />,
      key: "finance",
      items: [{ name: "Invoices", href: "/dashboard/invoices" }],
    },
    {
      title: "Operations",
      icon: <Cog className="w-5 h-5" />,
      key: "operations",
      items: [
        { name: "Add Employee", href: "/dashboard/operations/add_employee" },
        { name: "Onboarding", href: "/dashboard/operations/onboarding" },
        { name: "All Employees", href: "/dashboard/operations/employee_list" },
        { name: "All Clients", href: "/dashboard/operations/all_clients" },
        {
          name: "Timesheet / Payroll",
          href: "/dashboard/operations/all_timesheet",
        },
      ],
    },
    {
      title: "Sales",
      icon: <BriefcaseBusiness className="w-5 h-5" />,
      key: "sales",
      items: [
        { name: "Opportunities", href: "/opportunities" },
        { name: "Contracts", href: "/contracts" },
        { name: "Quotation", href: "/quotation" },
      ],
    },
    {
      title: "A&T",
      icon: <Building2 className="w-5 h-5" />,
      key: "at",
      items: [
        {
          name: "A&T Form",
          href: "/dashboard/accommodation_transport/at_form",
        },
        {
          name: "A&T List",
          href: "/dashboard/accommodation_transport/at_list",
        },
        {
          name: "A&T Timesheet",
          href: "/dashboard/accommodation_transport/at_generate_timesheet",
        },
      ],
    },
    {
      title: "T&A",
      icon: <ContactRound className="w-5 h-5" />,
      key: "ta",
      items: [
        { name: "Post Job", href: "/dashboard/talent_acquisition/post_job" },
        { name: "Job List", href: "/dashboard/talent_acquisition/job_list" },
        {
          name: "Application Form",
          href: "/talent_acquisition/application_form",
        },
        {
          name: "Applicant List",
          href: "/dashboard/talent_acquisition/get_job_applicants",
        },
      ],
    },
    {
      title: "CM",
      icon: <ToolCase className="w-5 h-5" />,
      key: "cm",
      items: [{ name: "Cases", href: "/dashboard/case_management" }],
    },
  ];

  const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);

  return (
    <div
      ref={sidebarRef}
      className={`fixed md:static inset-y-0 left-0 transform transition-all duration-300 ease-in-out z-40
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${collapsed ? "w-14" : "w-52"}
        flex flex-col h-full bg-slate-900/70 backdrop-blur-lg text-white shadow-lg border-r border-slate-700/30 overflow-hidden`}
    >
      {/* Mobile Close Button */}
      <div className="flex justify-between items-center md:hidden p-3 border-b border-slate-700/40">
        <h1
          className={`text-2xl font-extrabold text-indigo-400 tracking-tight transition-all duration-300 ${
            collapsed ? "opacity-0 scale-0" : "opacity-100 scale-100"
          }`}
        >
          ETMAM
        </h1>
        <h1
          className={`text-2xl font-extrabold text-indigo-400 tracking-tight transition-all duration-300 absolute ${
            collapsed ? "opacity-100 scale-100" : "opacity-0 scale-0"
          }`}
        >
          E
        </h1>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-md">
          <X size={20} />
        </button>
      </div>

      {/* Company Title - Desktop */}
      <div className="hidden md:block p-4 text-center border-b border-slate-700/40 relative">
        <h1
          className={`text-2xl font-extrabold text-indigo-400 tracking-wide drop-shadow-md transition-all duration-300 ${
            collapsed ? "opacity-0 scale-0" : "opacity-100 scale-100"
          }`}
        >
          ETMAM
        </h1>
        <h1
          className={`text-2xl font-extrabold text-indigo-400 tracking-tight transition-all duration-300 absolute top-4 left-4 ${
            collapsed ? "opacity-100 scale-100" : "opacity-0 scale-0"
          }`}
        >
          E
        </h1>
      </div>

      {/* Dashboard Section */}
      <div
        className={`flex items-center border-b border-slate-700/30 transition-all duration-300 
  ${collapsed ? "justify-start px-2" : "justify-between px-3"} py-2 sm:py-3`}
      >
        {/* Collapse/Expand Button (left-aligned when collapsed) */}
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="p-1.5 ml-1 rounded-md hover:bg-slate-700/50 transition-all duration-300 sm:p-2"
          >
            <span className="text-lg sm:text-base">→</span>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
              {/* Dashboard icon */}
              <LayoutDashboard
                className={`w-5 h-5 text-indigo-400 transition-all duration-300 ${
                  collapsed ? "opacity-0 scale-0" : "opacity-100 scale-100"
                }`}
              />
              <span className="text-slate-100 text-base font-medium whitespace-nowrap">
                Dashboard
              </span>
            </div>

            {/* Collapse Button (right side when expanded) */}
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-md hover:bg-slate-700/50 transition-all duration-300 sm:p-2"
            >
              <span className="text-lg sm:text-base">←</span>
            </button>
          </>
        )}
      </div>

      {/* Menus */}
      <div className="flex-1 mt-4 overflow-y-visible relative z-10">
        {menus.map((menu) => (
          <div key={menu.key} className="mb-4 relative group">
            <button
              onClick={() => !collapsed && toggleMenu(menu.key)}
              data-menu={menu.key}
              className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:bg-slate-700/40 hover:shadow-md relative"
            >
              <span className="flex items-center gap-2 relative">
                <span className="text-indigo-400">{menu.icon}</span>
                <span
                  className={`text-slate-100 font-medium transition-all duration-300 ${
                    collapsed
                      ? "opacity-0 scale-0 w-0"
                      : "opacity-100 scale-100 w-auto"
                  }`}
                >
                  {menu.title}
                </span>
                {collapsed && (
                  <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-slate-800/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg z-50">
                    {menu.title}
                  </span>
                )}
              </span>
              <ChevronRight
                className={`text-slate-300 transition-all duration-400 ease-in-out ${
                  collapsed
                    ? "opacity-0 scale-0"
                    : openMenu === menu.key
                    ? "rotate-90 opacity-100"
                    : "rotate-0 opacity-100"
                }`}
              />
            </button>

            {/* Expanded submenu */}
            <div
              className={`overflow-hidden transition-all duration-400 ease-in-out ${
                collapsed
                  ? "max-h-0 opacity-0"
                  : openMenu === menu.key
                  ? "max-h-50 opacity-100 mt-2"
                  : "max-h-0 opacity-0"
              }`}
            >
              <ul className="pl-8 flex flex-col gap-1 text-md text-slate-300">
                {menu.items.map((item) => (
                  <li
                    key={item.href}
                    className="relative"
                    data-menu={item.href}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setActiveMenu(item.href)}
                      className={`block px-2 py-1.5 rounded-md transition-all duration-200 flex items-center gap-2 ${
                        activeMenu === item.href
                          ? "text-indigo-400"
                          : "text-slate-200 hover:text-indigo-300"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Collapsed submenu */}
            {collapsed && (
              <div className="absolute top-0 left-full opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 z-50">
                <ul className="flex flex-col gap-1 bg-slate-900/90 p-2 rounded-md shadow-lg min-w-[140px]">
                  {menu.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setActiveMenu(item.href)}
                        className={`block px-2 py-1.5 rounded-md transition-all duration-200 ${
                          activeMenu === item.href
                            ? "text-white"
                            : "text-slate-200 hover:bg-slate-700/50 hover:text-white"
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {/* Settings */}
        <div className="mt-auto relative group ">
          <Link
            href="/settings"
            onClick={() => setActiveMenu("/settings")}
            data-menu="/settings"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 hover:text-white transition-all duration-200 relative"
            title={collapsed ? "Settings" : ""}
          >
            <Settings className="w-5 h-5 text-indigo-400" />
            <span
              className={`transition-all duration-300 ${
                collapsed
                  ? "opacity-0 scale-0 w-0"
                  : "opacity-100 scale-100 w-auto"
              }`}
            >
              Settings
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
