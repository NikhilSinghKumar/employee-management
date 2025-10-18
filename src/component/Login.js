"use client";

import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserContext } from "@/context/UserContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { fetchUser } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    document.title = "Etmam | Login";
  }, []);

  const clearMessage = () => setMessage({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessage();

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setMessage({ text: "Please enter a valid email.", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setMessage({ text: "Wrong credentials", type: "error" });
        setIsLoading(false);
        return;
      }

      if (!res.ok) throw new Error(data.message || "Invalid credentials.");

      setMessage({ text: "Login successful! Redirecting...", type: "success" });
      await fetchUser();
      router.push("/dashboard");
    } catch (error) {
      setMessage({
        text: error.message || "Server error. Please try again later.",
        type: "error",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e9eef3] via-[#f7f9fb] to-[#e3e7eb]">
      <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 w-[90%] sm:w-full max-w-md border border-[#cfd8df] mx-auto">
        <div className="flex flex-col items-center mb-3">
          <div className="relative w-20 h-20 mb-3 fade-in">
            <Image
              src="/ETMAM_Logo-no_bg.png"
              alt="Etmam Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1
            className="text-xl sm:text-2xl font-semibold text-[#4A5A6A] fade-in"
            style={{ animationDelay: "0.2s" }}
          >
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearMessage();
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5A6A] focus:outline-none transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {showPassword ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 rounded-lg text-white font-medium transition cursor-pointer ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#4A5A6A] hover:bg-[#3b4b59]"
            }`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-center text-sm mt-6 text-gray-500">
          <p>
            New User?{" "}
            <Link
              href="/register"
              className="text-[#4A5A6A] hover:underline font-medium"
            >
              Register
            </Link>
          </p>
          <p className="mt-1">
            <Link
              href="/forgot_password"
              className="text-[#4A5A6A] hover:underline"
            >
              Forgot Password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
