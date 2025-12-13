"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathname = usePathname();
  return (
    <div className="flex justify-between items-center relative bg-[#D7C0A9] p-7 shadow-md">
      <p className="text-black text-4xl text-bold">
        <span className="text-[#5B3705]">C</span>
        <span className="text-[#6E5430]">o</span>
        <span className="text-[#6E5430]">o</span>
        <span className="text-[#5B3705]">ksy</span>
      </p>
      <nav className="space-x-8">
        <Link href={"/"} className={pathname === "/" ? "text-[#5B3705]" : "text-black"}>HOME</Link>
        <Link href={"/recipes"} className={pathname === "/recipes" ? "text-[#5B3705]" : "text-black"}>RECIPES</Link>
        <Link href={"/favorites"} className={pathname === "/favorites" ? "text-[#5B3705]" : "text-black"}>FAVORITES</Link>
      </nav>
    </div>
  );
}