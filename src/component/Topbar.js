"use client";
import { useState, useRef, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "@/context/UserContext";
import {
  ChevronDown,
  LogOut,
  Search,
  Bell,
  Menu,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function Topbar({ onMenuClick }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isUserVisible, setIsUserVisible] = useState(false);
  const [isNotifVisible, setIsNotifVisible] = useState(false);
  const { user, fetchUser } = useContext(UserContext);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const userRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    console.log("Hydration Debug - user:", user);
  }, [user]);

  // ✅ Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userRef.current && !userRef.current.contains(event.target)) {
        setIsUserVisible(false);
        setTimeout(() => setShowUserDropdown(false), 150);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifVisible(false);
        setTimeout(() => setShowNotifDropdown(false), 150);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Toggle user dropdown
  const toggleUserDropdown = () => {
    if (showUserDropdown) {
      setIsUserVisible(false);
      setTimeout(() => setShowUserDropdown(false), 150);
    } else {
      setShowUserDropdown(true);
      setTimeout(() => setIsUserVisible(true), 10);
      // close notif dropdown if open
      setIsNotifVisible(false);
      setTimeout(() => setShowNotifDropdown(false), 150);
    }
  };

  // ✅ Toggle notification dropdown
  const toggleNotifDropdown = () => {
    if (showNotifDropdown) {
      setIsNotifVisible(false);
      setTimeout(() => setShowNotifDropdown(false), 150);
    } else {
      setShowNotifDropdown(true);
      setTimeout(() => setIsNotifVisible(true), 10);
      // close user dropdown if open
      setIsUserVisible(false);
      setTimeout(() => setShowUserDropdown(false), 150);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        router.push("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 border-b border-slate-200 shadow-sm flex justify-between items-center px-4 sm:px-6 py-2.5 sticky top-0 z-40">
      {/* Left: Hamburger + Search Box */}
      <div className="flex items-center gap-3 w-full sm:w-1/3">
        {/* ☰ Hamburger - visible on mobile */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md hover:bg-gray-100 active:scale-95 transition sm:hidden"
        >
          <Menu className="text-gray-700" size={22} />
        </button>

        {/* Search Box */}
        {/* <div className="relative flex-1 hidden sm:block">
          <Search
            className="absolute left-3 top-2.5 text-gray-400 pointer-events-none z-10"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 text-gray-800 placeholder-gray-400 border border-slate-200 
                 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent 
                 transition-all duration-200 backdrop-blur-sm hover:bg-white/20"
          />
        </div> */}
      </div>

      {/* Right Section: Notifications */}
      <div className="flex items-center gap-4">
        {/* 🔔 Notification Button */}
        <div className="relative flex-shrink-0" ref={notifRef}>
          <button
            onClick={toggleNotifDropdown}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
          >
            <Bell className="text-gray-600" size={20} />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Notification Dropdown */}
          {showNotifDropdown && (
            <div
              className={`absolute mt-2 bg-white/95 backdrop-blur-sm border border-gray-100 rounded-xl shadow-lg w-72 overflow-hidden transform transition-all duration-200 ease-out 
        ${
          isNotifVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-1"
        } 
        right-1/2 translate-x-1/2 sm:right-0 sm:translate-x-0 origin-top`}
            >
              <div className="p-3 border-b border-gray-100 font-semibold text-gray-700">
                Notifications
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-all">
                  <AlertCircle className="text-orange-500 mt-0.5" size={18} />
                  <div className="text-sm text-gray-700">
                    Server load is higher than usual. Please check your
                    dashboard.
                    <p className="text-xs text-gray-400 mt-1">2m ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-all">
                  <CheckCircle2 className="text-green-500 mt-0.5" size={18} />
                  <div className="text-sm text-gray-700">
                    Backup completed successfully.
                    <p className="text-xs text-gray-400 mt-1">1h ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-all">
                  <AlertCircle className="text-blue-500 mt-0.5" size={18} />
                  <div className="text-sm text-gray-700">
                    New user registered:{" "}
                    <span className="font-medium">John Doe</span>.
                    <p className="text-xs text-gray-400 mt-1">3h ago</p>
                  </div>
                </div>
              </div>
              <div className="p-2 border-t border-gray-100 text-center">
                <button className="text-sm text-indigo-600 hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 👤 User info */}
        {mounted && user && (
          <div className="relative" ref={userRef}>
            <button
              onClick={toggleUserDropdown}
              className="flex items-center gap-1.5 bg-white/60 hover:bg-white rounded-md 
                px-2 py-1.5 transition-all duration-200 border border-slate-200 shadow-sm"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-300 flex-shrink-0">
                <img
                  src="/person_icon.png"
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="hidden sm:block text-sm font-medium text-gray-700">
                {user.first_name} {user.last_name}
              </p>
              <ChevronDown
                size={14}
                className={`text-gray-500 transition-transform duration-200 ${
                  showUserDropdown ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div
                className={`absolute right-0 mt-1 bg-white/90 backdrop-blur-md border border-slate-200/70 rounded-lg shadow-md w-32
      transform transition-all duration-200 ease-out origin-top-right
      ${
        isUserVisible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 -translate-y-1"
      }`}
              >
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 
      text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 text-sm 
      transition-all duration-150 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>{loggingOut ? "..." : "Logout"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
