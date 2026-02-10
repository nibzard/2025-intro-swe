"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/app/lib/supabaseClient";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex justify-between items-center relative bg-[#E6F0EC] p-7 shadow-md">
      <p className="text-black text-4xl font-bold">
        <span className="text-[#0F766E]">Rezerviraj.me</span>
      </p>

      <nav className="space-x-8 font-semibold flex items-center relative">
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
          <div className="relative ml-4" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-full bg-[#0F766E] flex items-center justify-center text-white text-lg font-bold hover:bg-[#115e59]"
            >
              {user.email.charAt(0).toUpperCase()}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg py-2 z-50">
                <p className="px-4 py-2 text-gray-700 text-sm truncate">{user.email}</p>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Odjava
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className={pathname === "/login" ? "text-[#0F766E]" : "text-black"}>
            Prijava
          </Link>
        )}
      </nav>
    </div>
  );
}
