"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   Guided Tour — spotlight overlay that highlights UI elements step-by-step
   localStorage key: guild-tour-completed
   Target elements via data-tour="step-name" attributes
───────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = "guild-tour-completed";

// ── Tour step definitions ─────────────────────────────────────────────────────

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  body: string;
  position: "bottom" | "top" | "left" | "right" | "center";
}

const STEPS: TourStep[] = [
  {
    target: "nav-agents",
    title: "Agent Marketplace",
    body: "Browse the AI Agent Marketplace. Find agents for coding, marketing, research, and more.",
    position: "bottom",
  },
  {
    target: "nav-humans",
    title: "Human Tasks",
    body: "The Human Task Marketplace. Post tasks or claim them to earn credits.",
    position: "bottom",
  },
  {
    target: "nav-credits",
    title: "Credits",
    body: "Top up your balance here. Credits are used for running agents and posting tasks.",
    position: "bottom",
  },
  {
    target: "nav-profile",
    title: "Your Profile",
    body: "Your dashboard \u2014 agents, reputation, badges, and account settings.",
    position: "bottom",
  },
  {
    target: "connect-wallet",
    title: "Connect Wallet",
    body: "Connect your wallet to unlock all features. Your wallet is your identity.",
    position: "bottom",
  },
  {
    target: "first-agent-card",
    title: "Agents & Actions",
    body: "Click \u2018Run Agent\u2019 to chat with an AI agent, or create your own.",
    position: "bottom",
  },
  {
    target: "__center__",
    title: "Tour Complete!",
    body: "That\u2019s the tour! You can replay it anytime from your Profile page.",
    position: "center",
  },
];

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTour() {
  const [showTour, setShowTour] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    setHasCompleted(!!completed);
  }, []);

  const startTour = useCallback(() => {
    setShowTour(true);
  }, []);

  const closeTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHasCompleted(true);
    setShowTour(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasCompleted(false);
    setShowTour(true);
  }, []);

  return { showTour, startTour, closeTour, hasCompleted, resetTour };
}

// ── Helper: compute tooltip position ──────────────────────────────────────────

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

const PADDING = 8; // spotlight padding around target
const TOOLTIP_GAP = 12; // gap between spotlight and tooltip

function getTooltipStyle(
  rect: Rect | null,
  position: TourStep["position"],
  tooltipWidth: number
): React.CSSProperties {
  if (!rect || position === "center") {
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const vw = window.innerWidth;

  const centerX = rect.left + rect.width / 2;

  // Clamp horizontally so tooltip doesn't overflow viewport
  let leftVal = centerX - tooltipWidth / 2;
  leftVal = Math.max(12, Math.min(leftVal, vw - tooltipWidth - 12));

  switch (position) {
    case "bottom":
      return {
        position: "fixed",
        top: rect.bottom + PADDING + TOOLTIP_GAP + scrollY,
        left: leftVal + scrollX,
      };
    case "top":
      return {
        position: "fixed",
        bottom: window.innerHeight - rect.top + PADDING + TOOLTIP_GAP,
        left: leftVal + scrollX,
      };
    case "left":
      return {
        position: "fixed",
        top: rect.top + rect.height / 2 + scrollY,
        right: window.innerWidth - rect.left + PADDING + TOOLTIP_GAP,
        transform: "translateY(-50%)",
      };
    case "right":
      return {
        position: "fixed",
        top: rect.top + rect.height / 2 + scrollY,
        left: rect.right + PADDING + TOOLTIP_GAP + scrollX,
        transform: "translateY(-50%)",
      };
    default:
      return {};
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GuidedTour({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipWidth] = useState(320);

  const total = STEPS.length;
  const current = STEPS[step];
  const isLast = step === total - 1;
  const isFirst = step === 0;
  const isCenter = current.target === "__center__";

  // ── Find & measure target element ────────────────────────────────────────
  const measureTarget = useCallback(() => {
    if (!open) return;
    const s = STEPS[step];
    if (!s || s.target === "__center__") {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${s.target}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setTargetRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        bottom: r.bottom,
        right: r.right,
      });
      // Scroll element into view if needed
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      setTargetRect(null);
    }
  }, [open, step]);

  useEffect(() => {
    measureTarget();
    // Re-measure on scroll / resize
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => {
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [measureTarget]);

  // Reset step when opened
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  function complete() {
    localStorage.setItem(STORAGE_KEY, "true");
    onClose();
  }

  function goNext() {
    if (isLast) {
      complete();
      return;
    }
    setStep((s) => Math.min(s + 1, total - 1));
  }

  function goBack() {
    if (isFirst) return;
    setStep((s) => Math.max(s - 1, 0));
  }

  if (!open) return null;

  // ── Spotlight cutout styles ─────────────────────────────────────────────
  const spotlightStyle: React.CSSProperties =
    targetRect && !isCenter
      ? {
          position: "fixed",
          top: targetRect.top - PADDING,
          left: targetRect.left - PADDING,
          width: targetRect.width + PADDING * 2,
          height: targetRect.height + PADDING * 2,
          borderRadius: "12px",
          boxShadow: "0 0 0 9999px rgba(14, 41, 49, 0.65)",
          pointerEvents: "none" as const,
          zIndex: 90,
          transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }
      : {};

  const tooltipStyle = getTooltipStyle(targetRect, current.position, tooltipWidth);

  return (
    <div className="fixed inset-0 z-[90]" aria-modal="true" role="dialog">
      {/* Overlay — only used for center steps (spotlight handles dimming for targeted steps) */}
      {isCenter && (
        <div className="absolute inset-0 bg-ink/65 backdrop-blur-sm" />
      )}

      {/* Spotlight cutout */}
      {targetRect && !isCenter && <div style={spotlightStyle} />}

      {/* Click-catcher overlay behind tooltip (prevents interacting with page) */}
      {!isCenter && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 89, pointerEvents: "auto" }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          ...tooltipStyle,
          width: tooltipWidth,
          zIndex: 91,
        }}
        className="animate-[tooltipIn_250ms_ease-out_both]"
      >
        <div className="rounded-xl border border-stone/30 bg-white p-5 shadow-lg">
          {/* Step indicator */}
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-white">
              {step + 1}
            </span>
            <span className="text-xs font-semibold text-ink/40">
              of {total}
            </span>
            {/* Skip */}
            {!isLast && (
              <button
                onClick={complete}
                className="ml-auto text-xs font-semibold text-ink/40 transition-colors hover:text-ink/70"
              >
                Skip tour
              </button>
            )}
          </div>

          {/* Content */}
          <h3 className="font-display text-base font-bold tracking-tight text-ink">
            {current.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
            {current.body}
          </p>

          {/* Step dots */}
          <div className="mt-4 flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step
                    ? "w-4 bg-mint"
                    : i < step
                      ? "w-1.5 bg-mint/40"
                      : "w-1.5 bg-stone"
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={goBack}
              disabled={isFirst}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                isFirst
                  ? "cursor-not-allowed text-stone"
                  : "text-ink/50 hover:bg-stone/40 hover:text-ink"
              )}
            >
              Back
            </button>

            <button
              onClick={goNext}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-bold text-white transition-all duration-200",
                isLast
                  ? "bg-flare shadow-md hover:shadow-lg hover:brightness-110"
                  : "bg-ink shadow-sm hover:bg-teal hover:shadow-md"
              )}
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>

        {/* Arrow pointer (only for non-center, bottom-positioned tooltips) */}
        {!isCenter && current.position === "bottom" && targetRect && (
          <div
            className="absolute -top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-white"
            style={{
              left: Math.min(
                Math.max(
                  targetRect.left + targetRect.width / 2 - (parseFloat(String(tooltipStyle.left)) || 0),
                  20
                ),
                tooltipWidth - 20
              ),
            }}
          />
        )}
        {!isCenter && current.position === "top" && targetRect && (
          <div
            className="absolute -bottom-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-white"
          />
        )}
      </div>

      {/* Keyframes (scoped) */}
      <style jsx>{`
        @keyframes tooltipIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
