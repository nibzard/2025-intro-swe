"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

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
      </nav>
    </div>
  );
}
