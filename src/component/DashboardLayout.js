"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    // 🔸 FIX 1: Prevent layout from expanding horizontally
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 relative z-0 min-w-0">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        {/* 🔸 FIX 2: Allow only inner div to scroll horizontally */}
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
          <div className="w-full h-full overflow-x-auto">{children}</div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
