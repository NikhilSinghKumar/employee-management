"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    // Optional email format check for faster client-side feedback
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setMessage({ text: "Please enter a valid email.", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Allows cookies to be sent with the request
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials.");
      }

      setMessage({
        text: "Login successful! Redirecting...",
        type: "success",
      });

      setTimeout(() => {
        router.push("/services");
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      setMessage({
        text: error.message || "Server error. Please try again later.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-96"
      >
        <h2 className="text-xl font-semibold mb-4">Login</h2>

        {/* Feedback Message */}
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

        <div className="mb-4">
          <label className="block text-gray-700">Password</label>
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

        <button
          type="submit"
          className={`w-full py-2 rounded-lg text-white cursor-pointer ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <p className="py-2">
          New User? Please{" "}
          <Link href="/register" className="text-blue-500 hover:text-blue-600">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
