import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const nunito = localFont({
  src: "./fonts/nunito-latin-wght-normal.woff2",
  variable: "--font-sans",
  weight: "200 1000",
});

const cormorant = localFont({
  src: "./fonts/cormorant-garamond-latin-wght-normal.woff2",
  variable: "--font-display",
  weight: "300 700",
});

export const metadata: Metadata = {
  title: "Get It Together",
  description:
    "A to-do list that tells you what to do first. Rank tasks by urgency and expected time, then work through one clear next action.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${cormorant.variable} h-full antialiased overscroll-y-none`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
