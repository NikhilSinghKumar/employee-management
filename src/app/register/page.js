"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Etmam | Register";
  }, []);

  const clearMessage = () => setMessage({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessage();

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setMessage({ text: "Please enter a valid email.", type: "error" });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          text: "Registration successful! Please log in.",
          type: "success",
        });
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setIsLoading(false);
      } else {
        setMessage({
          text: data.message || "Registration failed.",
          type: "error",
        });
        setIsLoading(false);
      }
    } catch (error) {
      setMessage({
        text: "Server error. Please try again later.",
        type: "error",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e9eef3] via-[#f7f9fb] to-[#e3e7eb] md:pt-10 md:pb-10">
      <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 w-[90%] sm:w-full max-w-md border border-[#cfd8df] mx-auto">
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-20 h-20 mb-3 fade-in">
            <Image
              src="/ETMAM_Logo-no_bg.png"
              alt="Etmam Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#4A5A6A] fade-in">
            Etmam Business Solutions
          </h1>
        </div>

        {/* Fixed message container - always reserves space */}
        <div className="flex justify-center items-center h-4 mb-3">
          {message.text && (
            <div
              className={`animate-fade-in text-sm ${
                message.type === "success"
                  ? "text-green-600"
                  : "text-red-600 bg-red-100 p-3 rounded-lg"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearMessage();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearMessage();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearMessage();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearMessage();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearMessage();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 rounded-lg text-white font-medium transition ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#4A5A6A] hover:bg-[#3b4b59]"
            }`}
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="text-center text-sm mt-6 text-gray-500">
          <p>
            Already have an account?{" "}
            <Link
              href="/"
              className="text-[#4A5A6A] hover:underline font-medium"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
