"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const NAV_LINKS = [
  { href: "/",        label: "Agents"  },
  { href: "/humans",  label: "Humans"  },
  { href: "/credits", label: "Credits" },
  { href: "/profile", label: "Profile" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-40 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 rounded-2xl border border-stone/30 bg-white/90 px-5 py-3 shadow-sm backdrop-blur-md">

        {/* Brand mark + wordmark */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white transition-colors group-hover:bg-teal">
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M10 1.5 L17 4.5 L17 11 C17 15 10 18.5 10 18.5 C10 18.5 3 15 3 11 L3 4.5 Z"
                fill="currentColor" opacity="0.18"/>
              <path d="M10 1.5 L17 4.5 L17 11 C17 15 10 18.5 10 18.5 C10 18.5 3 15 3 11 L3 4.5 Z"
                stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M11.8 7.5 C10.9 6.8 9 6.8 7.8 8 C6.5 9.2 6.5 11.5 7.8 12.8 C9 14 11.5 14 12.8 12.8 L12.8 10.8 L10.5 10.8"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-ink">Guild</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : !!pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-150",
                  active
                    ? "bg-ink/[0.08] text-ink"
                    : "text-ink/55 hover:bg-ink/5 hover:text-ink",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet connect */}
        <div className="ml-auto shrink-0">
          <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} />
        </div>
      </div>
    </header>
  );
}
