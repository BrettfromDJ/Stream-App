import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Shelf", template: "%s · Shelf" },
  description: "Everything you're watching, reading and playing — in one place.",
  applicationName: "Shelf",
  appleWebApp: { capable: true, title: "Shelf", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#090909",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Inter for reading, Inter Tight for the big editorial headlines and numerals.
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", weight: ["500", "600", "700", "800"], display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark h-full ${sans.variable} ${display.variable}`}>
      <body className="min-h-full">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
