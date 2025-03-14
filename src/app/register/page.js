"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterForm() {
  // const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // const [mobile, setMobile] = useState("");
  // const [organization, setOrganization] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // if (!/^[a-zA-Z\s]+$/.test(name)) {
    //   alert("Please enter a valid name");
    //   return;
    // }
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      alert("Please enter a valid email");
      return;
    }
    // if (!/^\d{10}$/.test(mobile)) {
    //   alert("Please enter a valid 10-digit mobile number");
    //   return;
    // }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // console.log("Name:", name);
    console.log("Email:", email);
    console.log("Password:", password);
    // console.log("Mobile:", mobile);
    // console.log("Organization:", organization);
    // Handle registration logic here
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-96"
      >
        <h2 className="text-xl font-semibold mb-4">Register</h2>
        {/* <div className="mb-4">
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div> */}
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Set Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>
        {/* <div className="mb-4">
          <label className="block text-gray-700">Mobile Number</label>
          <input
            type="text"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Organization</label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div> */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        >
          Submit
        </button>
        <p className="py-2">
          Already have account? Please{" "}
          <Link href="/" className="text-blue-500 hover:text-blue-600">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
