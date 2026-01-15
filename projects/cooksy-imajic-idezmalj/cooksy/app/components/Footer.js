import Link from "next/link";
import { CopyrightIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#D7C0A9] py-16 pb-2 px-8 mt-16 shadow-md border-t border-gray-300">
        <div className="grid grid-cols-1 max-w-6xl mx-auto md:grid-cols-4 gap-8 text-center md:text-left justify-items-center md:justify-items-start">
            <div>
                <div className="text-5xl mb-2 text-black">
                    <p className="text-black text-4xl text-bold">
                        <span className="text-[#5B3705]">C</span>
                        <span className="text-[#6E5430]">o</span>
                        <span className="text-[#6E5430]">o</span>
                        <span className="text-[#5B3705]">ksy</span>
                    </p>
                    <p className="text-sm text-[#5B3705]">Delicious ideas, simple steps and flavors that inspire every meal.</p>
                </div>
            </div>
            <div className="text-black lg:pl-10">
                <h3 className="text-lg font-semibold mb-1 text-[#5B3705]">Sitemap</h3>
                <ul className="text-sm space-y-1">
                    <li className="mb-3">Explore our site</li>
                    <li><Link href={"/"}>Home</Link></li>
                    <li><Link href={"/recipes"}>Recipes</Link></li>
                    <li><Link href={"/favorites"}>Favorites</Link></li>
                </ul>
            </div>
            <div className="text-black lg:pl-10">
                <h3 className="text-lg font-semibold mb-4 text-[#5B3705]">Info</h3>
                <ul className="text-sm space-y-1">
                    <li><Link href={"/"}>Terms of Use</Link></li>
                    <li><Link href={"/"}>Privacy Policy</Link></li>
                    <li><Link href={"/"}>Terms of Service</Link></li>
                    <li><Link href={"/"}>Cookies Settings</Link></li>
                </ul>
            </div>
            <div className="text-black lg:pl-10">
                <h3 className="text-lg font-semibold mb-4 text-[#5B3705]">Follow us</h3>
                <ul className="text-sm space-y-1">
                    <li><Link href={"/"}>Instagram</Link></li>
                    <li><Link href={"/"}>TikTok</Link></li>
                    <li><Link href={"/"}>YouTube</Link></li>
                </ul>
            </div>
        </div>
        <div className="pt-20">
            <hr className="w-[90%] mx-auto border-t border-gray-300"/>
            <p className="text-black text-center text-sm mt-1">
                <CopyrightIcon className="w-3 h-3 inline-block" /> 2026 Cooksy. All rights reserved.
            </p>
        </div>
    </footer>
  );
}