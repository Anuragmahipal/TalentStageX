"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("freelancer");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) throw new Error("Signup failed");
      const data = await res.json();
      // set user in context and redirect to login
      setUser({ id: data.id, name: data.name, email: data.email, role: data.role });
      router.push("/auth/login");
    } catch (err) {
      alert("Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="w-full max-w-md p-6 bg-white rounded shadow" onSubmit={submit}>
        <h2 className="text-xl font-semibold mb-4">Create account</h2>

        <label className="block text-sm mb-1">Full name</label>
        <input className="w-full border rounded px-3 py-2 mb-3" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="block text-sm mb-1">Email</label>
        <input className="w-full border rounded px-3 py-2 mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="block text-sm mb-1">Password</label>
        <input type="password" className="w-full border rounded px-3 py-2 mb-3" value={password} onChange={(e) => setPassword(e.target.value)} />

        <label className="block text-sm mb-1">Role</label>
        <select className="w-full border rounded px-3 py-2 mb-4" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
        </select>

        <button className="w-full bg-primary text-white px-3 py-2 rounded" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
      </form>
    </div>
  );
}
