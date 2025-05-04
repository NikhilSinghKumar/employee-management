"use client";
import { useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useClickOutside } from "@/hooks/useClickOutside";
import Link from "next/link";

export default function Dropdown({ label, items = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-1 cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {label}
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 bg-white text-black shadow-md w-48 rounded-md overflow-hidden z-50">
          {items.map(({ label, href }, idx) => (
            <Link
              key={idx}
              href={href}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 hover:bg-gray-200"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
