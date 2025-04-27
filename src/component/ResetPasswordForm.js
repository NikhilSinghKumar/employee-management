"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function ResetPasswordForm({ token }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      setMessage({ text: "Invalid or missing token.", type: "error" });
      setTimeout(() => router.push("/forgot_password"), 2000);
    } else {
      // TODO: You can optionally validate token here via Supabase if stored
      setIsTokenValid(true);
    }
  }, [token, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!password || password.length < 8) {
      setMessage({
        text: "Password must be at least 8 characters long.",
        type: "error",
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      // Get user associated with token
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("reset_token", token)
        .single();

      if (userError || !userData) {
        throw new Error("Invalid or expired reset token.");
      }

      const userId = userData.id;

      const res = await fetch(`/api/auth/reset_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setMessage({
        text: "Password reset successfully! Redirecting to login...",
        type: "success",
      });

      setTimeout(() => router.push("/"), 2000);
    } catch (error) {
      console.error("Reset error:", error);
      setMessage({
        text: error.message || "Server error. Please try again later.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-white p-6 rounded-lg shadow-md w-96">
          <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
          {message.text && (
            <div
              className={`p-2 mb-4 rounded-lg text-white ${
                message.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-96"
      >
        <h2 className="text-xl font-semibold mb-4">Reset Password</h2>

        {message.text && (
          <div
            className={`p-2 mb-4 rounded-lg text-white ${
              message.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setMessage({ text: "", type: "" });
            }}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setMessage({ text: "", type: "" });
            }}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>

        <button
          type="submit"
          className={`w-full py-2 rounded-lg text-white cursor-pointer ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
