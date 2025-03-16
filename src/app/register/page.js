// Register/page.js

"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setMessage({ text: "", type: "" });

    // Email Validation
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setMessage({ text: "Please enter a valid email.", type: "error" });
      return;
    }

    // Password Match Validation
    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    // API Call for Registration
    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          text: "Registration successful! Please log in.",
          type: "success",
        });
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        setMessage({
          text: data.message || "Registration failed.",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "Server error. Please try again later.",
        type: "error",
      });
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-96"
      >
        <h2 className="text-xl font-semibold mb-4">Register</h2>

        {/* Display Message */}
        {message.text && (
          <div
            className={`p-2 mb-4 rounded-lg text-white ${
              message.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Email Field */}
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage({ text: "", type: "" }); // Clear message on change
            }}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>

        {/* Password Field */}
        <div className="mb-4">
          <label className="block text-gray-700">Set Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setMessage({ text: "", type: "" }); // Clear message on change
            }}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>

        {/* Confirm Password Field */}
        <div className="mb-4">
          <label className="block text-gray-700">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setMessage({ text: "", type: "" }); // Clear message on change
            }}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-40 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 cursor-pointer"
        >
          Submit
        </button>

        {/* Login Link */}
        <p className="py-2">
          Already have an account? Please{" "}
          <Link href="/" className="text-blue-500 hover:text-blue-600">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
