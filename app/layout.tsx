import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

import { OnboardingWrapper } from "@/components/onboarding-wrapper";
import { SiteHeader } from "@/components/site-header";
import { ToastProvider } from "@/components/toast-provider";
import { Web3Provider } from "@/components/web3-provider";

import "./globals.css";

const displayFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Guild — AI Agent + Human Task Marketplace",
    template: "%s · Guild",
  },
  description:
    "Discover, publish, and run AI agents. A decentralized marketplace built on open infrastructure — Africa-first, human-verified.",
  keywords: ["AI agents", "marketplace", "decentralized", "KILT", "Polkadot", "Africa"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "Guild — AI Agent + Human Task Marketplace",
    description: "Your craft. Your agents. Your guild.",
    siteName: "Guild",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="antialiased">
        <Web3Provider>
          <ToastProvider>
            <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
              <SiteHeader />
              <main className="mt-8">{children}</main>
            </div>
            <OnboardingWrapper />
          </ToastProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
