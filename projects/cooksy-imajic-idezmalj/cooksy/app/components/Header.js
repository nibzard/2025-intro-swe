"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex justify-between items-center relative bg-[#D7C0A9] p-7 shadow-md">
      <p className="text-black text-4xl font-bold">
        <span className="text-[#5B3705]">C</span>
        <span className="text-[#6E5430]">o</span>
        <span className="text-[#6E5430]">o</span>
        <span className="text-[#5B3705]">ksy</span>
      </p>

      <nav className="space-x-8 flex items-center">
        <Link
          href="/"
          className={pathname === "/" ? "text-[#5B3705]" : "text-black"}
        >
          HOME
        </Link>

        <Link
          href="/recipes"
          className={pathname === "/recipes" ? "text-[#5B3705]" : "text-black"}
        >
          RECIPES
        </Link>

        <Link
          href="/favorites"
          className={pathname === "/favorites" ? "text-[#5B3705]" : "text-black"}
        >
          FAVORITES
        </Link>
        {!user ? (
          <Link
            href="/login"
            className={pathname === "/login" ? "text-[#5B3705]" : "text-black"}
          >
            SIGN IN
          </Link>
        ) : (
          <button
            onClick={handleSignOut}
            className="text-black hover:text-[#5B3705]"
          >
            SIGN OUT
          </button>
        )}
      </nav>
    </div>
  );
}
