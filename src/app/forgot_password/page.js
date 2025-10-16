"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.title = "Etmam | Forgot Password";
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
      const { data: user, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (error || !user) {
        throw new Error("Email not found in our records.");
      }

      const res = await fetch(`/api/auth/forgot_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset link.");
      }

      setMessage({
        text: "Password reset link sent! Check your email.",
        type: "success",
      });
      setTimeout(() => router.push("/"), 2000);
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage({
        text: error.message || "Server error. Please try again later.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e9eef3] via-[#f7f9fb] to-[#e3e7eb] md:pt-10 md:pb-10">
      <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 w-[90%] sm:w-full max-w-md border border-[#cfd8df] mx-auto">
        <div className="flex items-center mb-4">
          <div className="relative w-12 h-12 mr-4 sm:w-16 sm:h-16">
            <Image
              src="/ETMAM_Logo-no_bg.png"
              alt="Etmam Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-[#4A5A6A] fade-in">
            Etmam Business Solutions
          </h1>
        </div>

        {/* Fixed message container - always reserves space */}
        <div className="flex justify-center items-center h-4 mb-2">
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

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 rounded-lg text-white font-medium transition ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#4A5A6A] hover:bg-[#3b4b59]"
            }`}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
