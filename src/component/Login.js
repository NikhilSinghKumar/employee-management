"use client";

import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserContext } from "@/context/UserContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { fetchUser } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    document.title = "Welcome! Login";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setMessage({ text: "Please enter a valid email.", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ensures JWT cookie is stored
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setMessage({ text: "Wrong credentials", type: "error" });
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials.");
      }

      setMessage({
        text: "Login successful! Redirecting...",
        type: "success",
      });

      // Re-fetch user from Supabase through your context after login
      await fetchUser();

      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setMessage({
        text: error.message || "Server error. Please try again later.",
        type: "error",
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center h-screen">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md w-96"
        >
          <h2 className="text-xl font-semibold mb-4">Welcome</h2>

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
                setMessage({ text: "", type: "" });
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setMessage({ text: "", type: "" });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-600"
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
            <Link
              href="/register"
              className="text-blue-500 hover:text-blue-600"
            >
              Register
            </Link>
          </p>
          <p className="py-1">
            <Link
              href="/forgot_password"
              className="text-blue-500 hover:text-blue-600"
            >
              Forgot password?
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}
