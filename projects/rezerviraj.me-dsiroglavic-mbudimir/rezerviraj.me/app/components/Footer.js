import Link from "next/link";
import { CopyrightIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#E6F0EC] py-16 pb-2 px-8 mt-16 shadow-md border-t border-gray-300">
      <div className="grid grid-cols-1 max-w-6xl mx-auto md:grid-cols-4 gap-8 text-center md:text-left justify-items-center md:justify-items-start">

        <div>
          <p className="text-black text-4xl font-bold">
            <span className="text-[#0F766E]">Rezerviraj.me</span>
          </p>
          <p className="text-sm text-[#0F766E] mt-2">
            Jednostavne rezervacije stolova, bilo kada i bilo gdje.
          </p>
        </div>

        <div className="text-black lg:pl-10">
          <h3 className="text-lg font-semibold mb-1 text-[#0F766E]">Stranice</h3>
          <ul className="text-sm space-y-1">
            <li><Link href="/">Početna</Link></li>
            <li><Link href="/restaurants">Restorani</Link></li>
            <li><Link href="/reservations">Rezervacije</Link></li>
          </ul>
        </div>

        <div className="text-black lg:pl-10">
          <h3 className="text-lg font-semibold mb-4 text-[#0F766E]">Informacije</h3>
          <ul className="text-sm space-y-1">
            <li><Link href="/">Uvjeti korištenja</Link></li>
            <li><Link href="/">Politika privatnosti</Link></li>
            <li><Link href="/">Postavke kolačića</Link></li>
          </ul>
        </div>

        <div className="text-black lg:pl-10">
          <h3 className="text-lg font-semibold mb-4 text-[#0F766E]">Pratite nas</h3>
          <ul className="text-sm space-y-1">
            <li><Link href="/">Instagram</Link></li>
            <li><Link href="/">Facebook</Link></li>
          </ul>
        </div>

      </div>

      <div className="pt-20">
        <hr className="w-[90%] mx-auto border-t border-gray-300" />
        <p className="text-black text-center text-sm mt-1">
          <CopyrightIcon className="w-3 h-3 inline-block" /> 2026 Rezerviraj.me. Sva prava pridržana.
        </p>
      </div>
    </footer>
  );
}
