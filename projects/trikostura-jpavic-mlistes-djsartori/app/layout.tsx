import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Skripta - Hrvatski Studentski Forum",
  description: "Tvoja digitalna skripta - forum za studente svih sveučilišta u Hrvatskoj. Dijeli znanje, postavljaj pitanja, pronađi odgovore.",
  keywords: ["skripta", "forum", "studenti", "hrvatska", "sveučilište", "obrazovanje", "kolega", "faks", "predavanja", "ispiti"],
  authors: [{ name: "Skripta Tim" }],
  applicationName: "Skripta",
  openGraph: {
    title: "Skripta - Hrvatski Studentski Forum",
    description: "Tvoja digitalna skripta - forum za studente svih sveučilišta u Hrvatskoj",
    type: "website",
    locale: "hr_HR",
    siteName: "Skripta",
  },
  twitter: {
    card: "summary",
    title: "Skripta - Hrvatski Studentski Forum",
    description: "Tvoja digitalna skripta - forum za studente svih sveučilišta u Hrvatskoj",
  },
  appleWebApp: {
    capable: true,
    title: "Skripta",
    statusBarStyle: "default",
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
