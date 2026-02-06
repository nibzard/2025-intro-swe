"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  return (
    <div className="flex justify-between items-center relative bg-[#E6F0EC] p-7 shadow-md">
      <p className="text-black text-4xl font-bold">
        <span className="text-[#0F766E]">Rezerviraj.me</span>
      </p>

      <nav className="space-x-8 font-semibold">
        <Link
          href="/"
          className={pathname === "/" ? "text-[#0F766E]" : "text-black"}
        >
          Početna
        </Link>
        <Link
          href="/restaurants"
          className={pathname === "/restaurants" ? "text-[#0F766E]" : "text-black"}
        >
          Restorani
        </Link>
        <Link
          href="/reservations"
          className={pathname === "/reservations" ? "text-[#0F766E]" : "text-black"}
        >
          Rezervacije
        </Link>
        {user ? (
          <button
            onClick={() => supabase.auth.signOut()}
            className="cursor-pointer text-black hover:text-[#0F766E]"
          >
            Odjava
          </button>
        ) : (
          <Link href="/login" className={pathname === "/login" ? "text-[#0F766E]" : "text-black"}>
            Prijava
          </Link>
        )}
      </nav>
    </div>
  );
}
