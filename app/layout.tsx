import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google"; // Import standard Google Fonts
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SmoothScroll from "@/components/SmoothScroll";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Link from "next/link"; // Ensure Link is imported if needed, or just MobileNav
import SupportChat from "@/components/SupportChat";
import MobileNav from "@/components/MobileNav";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "11 Code Store | Premium Jerseys",
  description: "The official store for premium football jerseys.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          oswald.variable,
          "antialiased bg-background text-foreground font-sans"
        )}
      >
        <SmoothScroll>
          <Header />
          <CartDrawer />
          <main className="min-h-screen pb-20 md:pb-0">
            {children}
            <SupportChat />
          </main>
          <MobileNav />
          <Footer />
          <Analytics />
          <SpeedInsights />
        </SmoothScroll>
      </body>
    </html>
  );
}
