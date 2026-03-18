"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   Onboarding Modal — full-screen step-through for first-time users
   localStorage key: guild-onboarding-completed
───────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = "guild-onboarding-completed";

// ── Slide data ────────────────────────────────────────────────────────────────

interface Slide {
  title: string;
  subtitle: string;
  body: string;
  icon: React.ReactNode;
  gradient: string;
}

const ShieldIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-16 w-16" aria-hidden="true">
    <path
      d="M24 3 L42 10 L42 26 C42 36 24 45 24 45 C24 45 6 36 6 26 L6 10 Z"
      fill="currentColor"
      opacity="0.15"
    />
    <path
      d="M24 3 L42 10 L42 26 C42 36 24 45 24 45 C24 45 6 36 6 26 L6 10 Z"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
    />
    <path
      d="M29 18 C27 16 23 16 20 18.5 C17 21 17 26 20 29 C22.5 31.5 27 31.5 29.5 29 L29.5 24 L25 24"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AgentIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-16 w-16" aria-hidden="true">
    <rect x="8" y="8" width="32" height="32" rx="8" stroke="currentColor" strokeWidth="2.5" opacity="0.15" fill="currentColor" />
    <rect x="8" y="8" width="32" height="32" rx="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <circle cx="18" cy="22" r="2.5" fill="currentColor" />
    <circle cx="30" cy="22" r="2.5" fill="currentColor" />
    <path d="M18 31 C20 34 28 34 30 31" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
  </svg>
);

const HumansIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-16 w-16" aria-hidden="true">
    <circle cx="24" cy="16" r="7" stroke="currentColor" strokeWidth="2.5" opacity="0.15" fill="currentColor" />
    <circle cx="24" cy="16" r="7" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <path d="M10 42 C10 34 16 28 24 28 C32 28 38 34 38 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M32 12 L38 12 M35 9 L35 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const WalletIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-16 w-16" aria-hidden="true">
    <rect x="6" y="12" width="36" height="26" rx="4" stroke="currentColor" strokeWidth="2.5" opacity="0.15" fill="currentColor" />
    <rect x="6" y="12" width="36" height="26" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <rect x="30" y="21" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="35" cy="25" r="1.5" fill="currentColor" />
    <path d="M12 12 L24 6 L36 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const RocketIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-16 w-16" aria-hidden="true">
    <path
      d="M24 6 C24 6 14 16 14 30 L20 34 L24 30 L28 34 L34 30 C34 16 24 6 24 6Z"
      stroke="currentColor"
      strokeWidth="2.5"
      opacity="0.15"
      fill="currentColor"
    />
    <path
      d="M24 6 C24 6 14 16 14 30 L20 34 L24 30 L28 34 L34 30 C34 16 24 6 24 6Z"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
    />
    <circle cx="24" cy="20" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M14 30 L8 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M34 30 L40 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 38 L24 42 L28 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const SLIDES: Slide[] = [
  {
    title: "Welcome to Guild",
    subtitle: "Your craft. Your agents. Your guild.",
    body: "Guild is a marketplace where AI agents and human talent come together. Browse intelligent agents, post tasks for real people, and earn credits — all powered by Polkadot and decentralized infrastructure.",
    icon: <ShieldIcon />,
    gradient: "from-ink to-mint",
  },
  {
    title: "AI Agents",
    subtitle: "Intelligent helpers at your command",
    body: "Browse, create, and chat with AI agents. Each agent has a specialty — coding, research, marketing, writing, and more. Pay with credits per run and get instant results.",
    icon: <AgentIcon />,
    gradient: "from-teal to-mint",
  },
  {
    title: "Human Tasks",
    subtitle: "Real work, real people, real rewards",
    body: "Post tasks for real humans or claim tasks to earn credits. Proof of Personhood via KILT Protocol ensures only verified people participate. Quality work, fairly compensated.",
    icon: <HumansIcon />,
    gradient: "from-mint to-teal",
  },
  {
    title: "Credits & Wallet",
    subtitle: "Your fuel for everything Guild",
    body: "Connect your wallet to get started. Credits fuel everything — running agents, posting tasks, and earning rewards. Top up with crypto on Moonbeam, Ethereum, Polygon, Arbitrum, Optimism, and Base.",
    icon: <WalletIcon />,
    gradient: "from-ink to-teal",
  },
  {
    title: "You're Ready!",
    subtitle: "The guild awaits",
    body: "Start exploring the marketplace. Create your first AI agent, browse available agents, or claim a task to start earning credits. Welcome to the guild.",
    icon: <RocketIcon />,
    gradient: "from-flare via-teal to-mint",
  },
];

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setShowOnboarding(true);
      setHasCompleted(false);
    } else {
      setHasCompleted(true);
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasCompleted(false);
    setShowOnboarding(true);
  }, []);

  return { showOnboarding, setShowOnboarding, hasCompleted, resetOnboarding };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [animating, setAnimating] = useState(false);

  const total = SLIDES.length;
  const slide = SLIDES[step];
  const isLast = step === total - 1;
  const isFirst = step === 0;

  // Reset step when modal opens
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  function complete() {
    localStorage.setItem(STORAGE_KEY, "true");
    onClose();
  }

  function goNext() {
    if (animating) return;
    if (isLast) {
      complete();
      return;
    }
    setDirection("next");
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => Math.min(s + 1, total - 1));
      setAnimating(false);
    }, 200);
  }

  function goBack() {
    if (animating || isFirst) return;
    setDirection("back");
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => Math.max(s - 1, 0));
      setAnimating(false);
    }, 200);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-[fadeIn_300ms_ease-out_both]"
        onClick={complete}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-lg animate-[fadeUp_400ms_ease-out_both]">
        {/* Gradient header */}
        <div
          className={cn(
            "relative flex flex-col items-center gap-4 px-8 pb-6 pt-10 text-white transition-all duration-500",
            `bg-gradient-to-br ${slide.gradient}`
          )}
        >
          {/* Skip button */}
          {!isLast && (
            <button
              onClick={complete}
              className="absolute right-4 top-4 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Skip
            </button>
          )}

          {/* Icon */}
          <div
            className={cn(
              "transition-all duration-300",
              animating
                ? direction === "next"
                  ? "translate-x-4 opacity-0"
                  : "-translate-x-4 opacity-0"
                : "translate-x-0 opacity-100"
            )}
          >
            {slide.icon}
          </div>

          {/* Title */}
          <h2
            className={cn(
              "font-display text-2xl font-bold tracking-tight transition-all duration-300",
              animating ? "opacity-0" : "opacity-100"
            )}
          >
            {slide.title}
          </h2>
          <p
            className={cn(
              "text-sm font-medium text-white/80 transition-all duration-300",
              animating ? "opacity-0" : "opacity-100"
            )}
          >
            {slide.subtitle}
          </p>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col px-8 pb-6 pt-6">
          <p
            className={cn(
              "text-sm leading-relaxed text-ink/80 transition-all duration-300",
              animating
                ? direction === "next"
                  ? "translate-x-4 opacity-0"
                  : "-translate-x-4 opacity-0"
                : "translate-x-0 opacity-100"
            )}
          >
            {slide.body}
          </p>

          {/* Step dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (animating) return;
                  setDirection(i > step ? "next" : "back");
                  setAnimating(true);
                  setTimeout(() => {
                    setStep(i);
                    setAnimating(false);
                  }, 200);
                }}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === step
                    ? "w-6 bg-mint"
                    : "w-2 bg-stone hover:bg-mint/40"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={goBack}
              disabled={isFirst}
              className={cn(
                "rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                isFirst
                  ? "cursor-not-allowed text-stone"
                  : "text-ink/60 hover:bg-stone/40 hover:text-ink"
              )}
            >
              Back
            </button>

            <button
              onClick={goNext}
              className={cn(
                "rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-all duration-200",
                isLast
                  ? "bg-flare shadow-md hover:shadow-lg hover:brightness-110"
                  : "bg-ink shadow-md hover:bg-teal hover:shadow-lg"
              )}
            >
              {isLast ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>

      {/* Keyframes (scoped) */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
