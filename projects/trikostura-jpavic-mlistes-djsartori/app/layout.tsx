import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Studentski Forum - Hrvatski Online Forum za Studente",
  description: "Online forum za studente svih sveučilišta u Hrvatskoj",
  keywords: ["forum", "studenti", "hrvatska", "sveučilište", "obrazovanje"],
  authors: [{ name: "Studentski Forum Tim" }],
  openGraph: {
    title: "Studentski Forum",
    description: "Online forum za studente svih sveučilišta u Hrvatskoj",
    type: "website",
    locale: "hr_HR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
