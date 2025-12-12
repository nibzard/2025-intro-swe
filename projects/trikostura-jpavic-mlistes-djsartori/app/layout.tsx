import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PerformanceMonitor } from "@/components/performance-monitor";
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PerformanceMonitor />
          {children}
          <Toaster position="top-right" richColors closeButton />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
