import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../src/globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Get It Together - Task Roaster & Breakdown",
  description: "Get roasted into productivity with AI-powered task breakdowns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable}`}>
        {children}
        <script src="/script.js" />
      </body>
    </html>
  );
}
