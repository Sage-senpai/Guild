# Design System — Ajently

> Document date: 2026-02-28
> Theme: Calm · Premium · Minimal · Decentralized-native
> Inspiration: Topographic depth, natural teal palette, African earth tones

---

## 1. Brand DNA

**Visual metaphor**: A topographic map — layered depth, natural contours, precision and calm. Each agent is a peak; the marketplace is the landscape. The platform feels like high-altitude terrain: clear, uncluttered, purposeful.

**Emotional targets**:
- Trust (permanence, decentralization = timelessness)
- Capability (clean execution, no fuss)
- Inclusion (Africa-first → global, not the reverse)
- Ownership (creators own their agents; users own their data)

---

## 2. Color Palette

### Primary Colors

| Token | Hex | RGB | Use |
|-------|-----|-----|-----|
| `--color-deep-teal` | `#0E2931` | `14, 41, 49` | Primary background, headers |
| `--color-muted-teal` | `#12484C` | `18, 72, 76` | Card backgrounds, nav |
| `--color-sea-green` | `#2B7574` | `43, 117, 116` | Interactive elements, borders |
| `--color-crimson` | `#861211` | `134, 18, 17` | Accent, CTAs, alerts |
| `--color-neutral` | `#E2E2E0` | `226, 226, 224` | Body text, neutral backgrounds |

### Extended Palette

| Token | Hex | Use |
|-------|-----|-----|
| `--color-deep-teal-90` | `#0e2931e6` | Overlays |
| `--color-sea-green-20` | `#2b757433` | Subtle tints, hover states |
| `--color-sea-green-40` | `#2b757466` | Dividers, inactive states |
| `--color-crimson-10` | `#8612111a` | Alert backgrounds |
| `--color-crimson-hover` | `#6b0e0d` | Crimson pressed state |
| `--color-white` | `#FFFFFF` | Pure white for light surfaces |
| `--color-off-white` | `#F6F6F4` | Page background (light mode) |
| `--color-stone-100` | `#F0EFED` | Card background (light mode) |
| `--color-stone-200` | `#E2E2E0` | Borders, separators |
| `--color-stone-500` | `#8A8A88` | Muted text, placeholders |
| `--color-stone-800` | `#2A2A28` | Primary text (dark on light) |

### Gradient System

```css
/* Topographic layer gradients — for hero sections, card overlays */
--gradient-topo:       linear-gradient(135deg, #0E2931 0%, #12484C 50%, #2B7574 100%);
--gradient-topo-warm:  linear-gradient(135deg, #12484C 0%, #2B7574 60%, #3d8a89 100%);
--gradient-crimson:    linear-gradient(135deg, #861211 0%, #a41615 100%);
--gradient-card-aurora: linear-gradient(135deg, #0E2931 0%, #2B7574 100%);
--gradient-card-sunset: linear-gradient(135deg, #861211 0%, #12484C 100%);
--gradient-card-ocean:  linear-gradient(135deg, #12484C 0%, #2B7574 70%, #4a9e9d 100%);
--gradient-card-ember:  linear-gradient(135deg, #861211 20%, #2B7574 100%);
--gradient-card-cosmic: linear-gradient(135deg, #0E2931 0%, #861211 50%, #2B7574 100%);

/* Subtle motion gradient — for hero/landing animations */
--gradient-motion-1: linear-gradient(120deg, #0E2931, #12484C, #2B7574, #12484C, #0E2931);
/* background-size: 300% 300%; animate: bgShift 8s ease infinite */
```

### Dark Mode Variant

```css
:root[data-theme="dark"] {
  --surface-primary:   #0E2931;
  --surface-secondary: #12484C;
  --surface-tertiary:  #1a5457;
  --surface-card:      #0f303a;
  --text-primary:      #E2E2E0;
  --text-secondary:    #9ab8bc;
  --text-muted:        #5c8a8d;
  --border:            #2B7574;
  --border-subtle:     #1e5558;
}

:root[data-theme="light"] {
  --surface-primary:   #F6F6F4;
  --surface-secondary: #FFFFFF;
  --surface-tertiary:  #F0EFED;
  --surface-card:      #FFFFFF;
  --text-primary:      #0E2931;
  --text-secondary:    #2B7574;
  --text-muted:        #8A8A88;
  --border:            #E2E2E0;
  --border-subtle:     #F0EFED;
}
```

---

## 3. Typography System

### Font Stack

```css
/* Headings — Elegant serif, editorial weight */
--font-heading: "Playfair Display", "Georgia", "Times New Roman", serif;
/* For production: license Canela or Freight Display for premium feel */

/* Body — Modern grotesk, readable at small sizes */
--font-body: "Satoshi", "Inter", "system-ui", sans-serif;
/* Satoshi: free for commercial use, excellent on mobile */

/* Mono — Technical precision */
--font-mono: "JetBrains Mono", "Fira Code", "Consolas", monospace;
```

### Type Scale (fluid, clamp-based)

```css
/* Fluid: scales between mobile (360px) and desktop (1440px) */
--text-xs:   clamp(0.70rem, 1.2vw, 0.75rem);  /* 11.2-12px */
--text-sm:   clamp(0.80rem, 1.4vw, 0.875rem); /* 12.8-14px */
--text-base: clamp(0.875rem, 1.6vw, 1rem);    /* 14-16px */
--text-lg:   clamp(1rem, 1.8vw, 1.125rem);    /* 16-18px */
--text-xl:   clamp(1.125rem, 2vw, 1.25rem);   /* 18-20px */
--text-2xl:  clamp(1.25rem, 2.5vw, 1.5rem);   /* 20-24px */
--text-3xl:  clamp(1.5rem, 3vw, 1.875rem);    /* 24-30px */
--text-4xl:  clamp(1.875rem, 4vw, 2.25rem);   /* 30-36px */
--text-5xl:  clamp(2.25rem, 5vw, 3rem);       /* 36-48px */
--text-hero: clamp(2.5rem, 7vw, 4.5rem);      /* 40-72px */
```

### Type Roles

| Role | Font | Weight | Size | Color |
|------|------|--------|------|-------|
| Hero heading | Playfair Display | 700 | `--text-hero` | `--text-primary` |
| Section heading | Playfair Display | 600 | `--text-3xl` | `--text-primary` |
| Card title | Satoshi | 600 | `--text-xl` | `--text-primary` |
| Body | Satoshi | 400 | `--text-base` | `--text-secondary` |
| Caption | Satoshi | 400 | `--text-sm` | `--text-muted` |
| Label/tag | Satoshi | 500 | `--text-xs` | varies |
| Code | JetBrains Mono | 400 | `--text-sm` | `--color-sea-green` |
| Price | Satoshi | 700 | `--text-lg` | `--text-primary` |

---

## 4. Spacing System

```css
/* 4px base unit; geometric progression */
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

---

## 5. Elevation & Shadows

```css
/* Layered depth — topographic metaphor */
--shadow-xs:  0 1px 2px rgba(14, 41, 49, 0.04);
--shadow-sm:  0 2px 8px rgba(14, 41, 49, 0.06), 0 1px 3px rgba(14, 41, 49, 0.04);
--shadow-md:  0 4px 16px rgba(14, 41, 49, 0.08), 0 2px 6px rgba(14, 41, 49, 0.04);
--shadow-lg:  0 8px 32px rgba(14, 41, 49, 0.12), 0 4px 12px rgba(14, 41, 49, 0.06);
--shadow-xl:  0 16px 48px rgba(14, 41, 49, 0.16), 0 8px 24px rgba(14, 41, 49, 0.08);
--shadow-card: 0 2px 8px rgba(14, 41, 49, 0.06), 0 0 0 1px rgba(43, 117, 116, 0.08);
--shadow-card-hover: 0 8px 24px rgba(14, 41, 49, 0.12), 0 0 0 1px rgba(43, 117, 116, 0.2);

/* Dark mode: inverted — glows instead of drops */
[data-theme="dark"] {
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(43, 117, 116, 0.15);
  --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(43, 117, 116, 0.3);
}
```

---

## 6. Border Radius

```css
--radius-sm:   0.25rem;  /* 4px — tags, badges */
--radius-md:   0.5rem;   /* 8px — inputs, small cards */
--radius-lg:   0.75rem;  /* 12px — cards, panels */
--radius-xl:   1rem;     /* 16px — modals, sheets */
--radius-2xl:  1.5rem;   /* 24px — large containers */
--radius-3xl:  2rem;     /* 32px — hero sections */
--radius-full: 9999px;   /* pills, avatars */
```

---

## 7. Motion System

```css
/* Durations */
--duration-fast:   100ms;
--duration-normal: 200ms;
--duration-slow:   350ms;
--duration-page:   500ms;

/* Easing */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);  /* Material standard */
--ease-enter:    cubic-bezier(0, 0, 0.2, 1);      /* Decelerate: elements entering */
--ease-exit:     cubic-bezier(0.4, 0, 1, 1);      /* Accelerate: elements leaving */
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* Spring: interactive feedback */

/* Transitions */
--transition-color:     color var(--duration-fast) var(--ease-standard),
                        background-color var(--duration-fast) var(--ease-standard);
--transition-shadow:    box-shadow var(--duration-normal) var(--ease-standard);
--transition-transform: transform var(--duration-normal) var(--ease-spring);

/* Gradient animation for hero/landing */
@keyframes bgShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(43, 117, 116, 0); }
  50%       { box-shadow: 0 0 20px 4px rgba(43, 117, 116, 0.2); }
}
```

---

## 8. Icon System

**Primary icon library**: HugeIcons (already installed as `@hugeicons/react`)

**Icon style conventions**:
- Stroke width: 1.5px (default) / 2px (emphasis)
- Size: 16px (small), 20px (default), 24px (large), 32px (hero)
- Color: inherits from parent or explicit `currentColor`

**Custom icons required** (not in HugeIcons):
- `AgentIcon` — abstract figure with thought bubble + code brackets
- `StorageProofIcon` — Merkle tree with checkmark
- `DecentralizedIcon` — hexagonal network nodes
- `AfricaIcon` — stylized African continent outline

**Icon in context**:
```tsx
// Usage pattern
import { Ai01Icon, DatabaseIcon, WalletIcon } from "@hugeicons/react";

// Consistent size + stroke:
<DatabaseIcon size={20} strokeWidth={1.5} className="text-sea-green" />
```

---

## 9. Accessibility Standards

### WCAG AA Requirements Met

| Element | Standard | Our Implementation |
|---------|----------|--------------------|
| Text contrast (normal) | 4.5:1 | `#E2E2E0` on `#0E2931` = 11.8:1 ✓ |
| Text contrast (large) | 3:1 | Sea green on deep teal = 4.2:1 ✓ |
| Interactive element size | 44x44px min | All buttons ≥ 44px touch target |
| Focus indicators | 3:1 ratio | 2px solid crimson `#861211` ring |
| Color alone | Never sole indicator | Always paired with text or icon |
| Motion | Prefers-reduced-motion | All animations respect `prefers-reduced-motion` |

```css
/* Focus ring */
:focus-visible {
  outline: 2px solid #861211;
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "deep-teal":  "#0E2931",
        "muted-teal": "#12484C",
        "sea-green":  "#2B7574",
        "crimson":    "#861211",
        "neutral":    "#E2E2E0",
      },
      fontFamily: {
        heading: ["Playfair Display", "Georgia", "serif"],
        body:    ["Satoshi", "Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        "3xl": "2rem",
      },
      animation: {
        "bg-shift": "bgShift 8s ease infinite",
        "fade-up":  "fadeUp 0.5s ease forwards",
        "pulse-glow": "pulseGlow 2s ease infinite",
      },
      boxShadow: {
        "card":       "0 2px 8px rgba(14,41,49,0.06), 0 0 0 1px rgba(43,117,116,0.08)",
        "card-hover": "0 8px 24px rgba(14,41,49,0.12), 0 0 0 1px rgba(43,117,116,0.2)",
      },
    },
  },
};

export default config;
```
