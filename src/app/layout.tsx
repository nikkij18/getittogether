import type { Metadata } from "next";
import { Nunito, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Do The Thing — Stop Avoiding Your Tasks",
  description:
    "Enter the task you keep avoiding and get a funny, personalized roast that motivates you to actually do it. Plus a step-by-step breakdown so it feels less scary.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${cormorant.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
