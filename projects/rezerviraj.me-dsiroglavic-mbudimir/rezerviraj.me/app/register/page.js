"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert("Greška kod registracije. Provjeri podatke.");
    } else {
      alert("Registracija uspješna! Provjeri email za potvrdu.");
      router.push("/login"); 
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Registracija</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="password"
          required
          placeholder="Lozinka"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button className="w-full bg-[#0F766E] text-white py-2 rounded">
          Registriraj se
        </button>
      </form>

      <p className="mt-4 text-sm">
        Već imaš račun?{" "}
        <a href="/login" className="text-[#0F766E] font-semibold">
          Prijava
        </a>
      </p>
    </div>
  );
}
