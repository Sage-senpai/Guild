# Component Library Specification — Ajently

> Document date: 2026-02-28
> Framework: Next.js 16 + React 19 + TailwindCSS + Radix UI

---

## 1. Agent Card

The primary marketplace item. Full redesign from current implementation.

### Visual Specification

```
┌─────────────────────────────────────────┐
│ ░░░░░░░░ GRADIENT BAND (topo map) ░░░░ │  ← 160px high, gradient from type
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                            [Category]  │  ← top-right badge
│                            [Type tag]  │
├─────────────────────────────────────────┤
│                                         │
│  Agent Name                             │  ← Playfair Display 18px
│  Description of what the agent does    │  ← Satoshi 14px, 2-line clamp
│  here in a natural sentence.           │
│                                         │
│  ┌──────────────────┐  ┌─────────────┐ │
│  │  Model: Llama-3  │  │ ✦ 0.03 cred │ │  ← model pill + price
│  └──────────────────┘  └─────────────┘ │
│                                         │
│         [ Run Agent → ]                 │  ← CTA button full-width
└─────────────────────────────────────────┘
```

### Component Code Structure

```tsx
// components/agent-card.tsx — redesign target

type AgentCardProps = {
  agent: PublicAgent;
  onRun?: () => void;
  compact?: boolean; // mobile list view
};

// Gradient map (from current AGENT_CARD_GRADIENTS)
const GRADIENT_CLASSES = {
  aurora:  "from-deep-teal via-muted-teal to-sea-green",
  sunset:  "from-crimson via-muted-teal to-deep-teal",
  ocean:   "from-muted-teal via-sea-green to-teal-400",
  ember:   "from-crimson via-sea-green to-muted-teal",
  cosmic:  "from-deep-teal via-crimson to-sea-green",
};

// Topographic lines overlay (CSS pattern)
// background-image: repeating-linear-gradient(
//   transparent, transparent 8px,
//   rgba(226,226,224,0.05) 8px, rgba(226,226,224,0.05) 10px
// );
```

### States
- **Default**: Shadow-card, border 1px sea-green/8%
- **Hover**: Shadow-card-hover, border sea-green/20%, transform translateY(-2px)
- **Active/pressed**: scale(0.98)
- **Loading skeleton**: Pulse animation with teal tints
- **Published badge**: Green dot + "Verified on-chain" tooltip

---

## 2. Button System

### Variants

```tsx
// components/ui/button.tsx — extend current CVA implementation

const buttonVariants = cva(
  // base
  "inline-flex items-center justify-center gap-2 font-body font-medium " +
  "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-crimson focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:   // Deep teal bg, neutral text — main CTA
          "bg-deep-teal text-neutral border border-transparent " +
          "hover:bg-muted-teal active:scale-[0.98] shadow-sm",

        secondary: // Sea green outline — secondary action
          "border border-sea-green text-sea-green bg-transparent " +
          "hover:bg-sea-green/10 active:scale-[0.98]",

        crimson:   // Crimson bg — destructive / attention
          "bg-crimson text-white border border-transparent " +
          "hover:bg-crimson-hover active:scale-[0.98] shadow-sm",

        ghost:     // No border, subtle hover
          "bg-transparent text-text-secondary " +
          "hover:bg-sea-green/5 hover:text-text-primary",

        topo:      // Gradient — hero CTAs only
          "bg-gradient-to-r from-deep-teal to-sea-green text-neutral " +
          "hover:opacity-90 active:scale-[0.98] shadow-md",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-12 px-6 text-base rounded-xl",
        xl: "h-14 px-8 text-lg rounded-2xl",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);
```

### Touch Targets
All buttons maintain minimum 44×44px touch targets on mobile:
```css
@media (max-width: 768px) {
  button { min-height: 44px; min-width: 44px; }
}
```

---

## 3. Navigation — Site Header

### Mobile Layout
```
┌─────────────────────────────────────────────────┐
│  [≡]  [Guild Logo]                  [Wallet]    │
└─────────────────────────────────────────────────┘
     ↓ drawer opens bottom-up
┌─────────────────────────────────────────────────┐
│                                                 │
│  Marketplace       →                            │
│  Create Agent      →                            │
│  My Agents         →                            │
│  Credits           →                            │
│  Profile           →                            │
│                                                 │
│  [Switch to Dark Mode]                          │
└─────────────────────────────────────────────────┘
```

### Desktop Layout
```
┌──────────────────────────────────────────────────────────────────┐
│  [Guild]   Marketplace  Create  Profile  Credits    [Wallet btn] │
└──────────────────────────────────────────────────────────────────┘
```

**Desktop header**: glassmorphism with backdrop-blur, `bg-deep-teal/80`, sticky
**Mobile header**: solid `bg-deep-teal`, bottom navigation bar alternative

### Bottom Navigation (Mobile)
```
┌────────────────────────────────────────────────────┐
│                                                    │
│  [🏪 Market]  [✦ Agents]  [+ Create]  [👤 Profile] │
└────────────────────────────────────────────────────┘
```

---

## 4. Chat Interface

### Chat Window Layout

```
┌─────────────────────────────────────────────┐
│  Agent Name  ·  Model Badge  ·  Credits: X  │  ← header
├─────────────────────────────────────────────┤
│                                             │
│                    ┌──────────────────┐     │
│              User: │ How do I write   │     │
│                    │ a viral tweet?   │     │
│                    └──────────────────┘     │
│                                             │
│  ┌──────────────────────────────────┐       │
│  │ Agent: Here are 3 hooks that    │       │
│  │ consistently perform above...   │       │
│  │                                  │       │
│  │  [Code block or formatted text] │       │
│  └──────────────────────────────────┘       │
│                                             │
│         ◌ Agent is thinking...             │
│                                             │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────┐ [Send↑] │
│  │ Type a message...             │         │
│  └───────────────────────────────┘         │
│  [📎 Attach]  [Cost: 0.03 credits]         │
└─────────────────────────────────────────────┘
```

### Message Bubbles
- **User messages**: Right-aligned, `bg-sea-green/15`, `border border-sea-green/20`, `rounded-2xl rounded-br-sm`
- **Agent messages**: Left-aligned, `bg-surface-secondary`, `border border-border-subtle`, `rounded-2xl rounded-bl-sm`
- **Thinking state**: Animated three-dot pulse in `--color-sea-green`
- **Streaming**: Tokens appear with a subtle fade-in; cursor blink at end of partial response

---

## 5. Marketplace Page

### Filter Bar
```
┌────────────────────────────────────────────────────────────┐
│  🔍 Search agents...        [All Categories ▾]  [Sort ▾]   │
│                                                            │
│  ○ Marketing  ○ Coding  ○ Education  ○ Research            │
│  ○ Design     ○ Finance  ○ Productivity  ○ General         │
└────────────────────────────────────────────────────────────┘
```

### Grid Layout
- **Mobile**: 1 column, full-width cards
- **Tablet**: 2 columns
- **Desktop**: 3 columns (max content width 1200px)

### Empty State
```
        ≋ (topographic illustration)

    No agents found for this search.

    Be the first to publish an agent →
         [ Create Agent ]
```

---

## 6. Create Agent Form

### Multi-step wizard (mobile-optimized)

```
Step 1: Identity          Step 2: Intelligence       Step 3: Economics
┌─────────────────┐       ┌─────────────────┐        ┌─────────────────┐
│ Agent Name      │       │ Select Model    │        │ Price Per Run   │
│ ┌─────────────┐ │       │ ┌─────────────┐ │        │ ┌──────────────┐ │
│ │ e.g. SQL    │ │  →→   │ │ Llama 3.3   │ │  →→   │ │ 0.03        │ │
│ │ Query Fixer │ │       │ │ 70B ▾       │ │        │ │ credits     │ │
│ └─────────────┘ │       └─────────────────┘        └─────────────────┘
│                 │       │ System Prompt   │        │ Card Gradient   │
│ Category        │       │ ┌─────────────┐ │        │ [aurora][sunset]│
│ [Coding ▾]      │       │ │ You are a   │ │        │ [ocean][ember]  │
│                 │       │ │ specialized │ │        │                 │
│ Description     │       │ │ ...         │ │        │ Knowledge File  │
│ ┌─────────────┐ │       │ └─────────────┘ │        │ [📎 Upload PDF] │
│ │             │ │       │                 │        │                 │
│ └─────────────┘ │       │ Knowledge File  │        │ [ Publish →]    │
│ [Next →]        │       │ [Next →]        │        │                 │
└─────────────────┘       └─────────────────┘        └─────────────────┘
```

---

## 7. Credits Page

```
┌────────────────────────────────────────────────────────────────┐
│                    Your Credits                                 │
│                                                                │
│         ╔══════════════════════════════════╗                  │
│         ║                                  ║                  │
│         ║         142.50 Credits          ║                  │
│         ║         ≈ $14.25 USD            ║                  │
│         ╚══════════════════════════════════╝                  │
│                                                                │
│  ┌──────────────────────┐  ┌────────────────────────────────┐ │
│  │  Top Up via ETH      │  │  Top Up via M-Pesa             │ │
│  │  Send to treasury    │  │  (Africa — instant)            │ │
│  └──────────────────────┘  └────────────────────────────────┘ │
│                                                                │
│  Recent Activity                                               │
│  ─────────────────────────────────────────────────────────── │
│  ✦ Agent run: SQL Query Fixer        -0.03  Feb 28, 2:31 PM │
│  ↑ Top up via ETH (Base)             +10.00 Feb 28, 9:00 AM │
│  ✦ Agent run: Viral Hook Architect   -0.02  Feb 27, 6:15 PM │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Loading States & Skeletons

```tsx
// components/ui/skeleton.tsx

// Agent card skeleton — pulse animation
export function AgentCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border-subtle overflow-hidden animate-pulse">
      <div className="h-40 bg-gradient-to-r from-surface-secondary to-surface-tertiary" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-2/3 rounded-md bg-surface-tertiary" />
        <div className="h-4 w-full rounded-md bg-surface-tertiary" />
        <div className="h-4 w-4/5 rounded-md bg-surface-tertiary" />
        <div className="flex gap-2 mt-4">
          <div className="h-8 w-24 rounded-full bg-surface-tertiary" />
          <div className="h-8 w-20 rounded-full bg-surface-tertiary" />
        </div>
        <div className="h-10 w-full rounded-xl bg-surface-tertiary mt-2" />
      </div>
    </div>
  );
}
```

---

## 9. Storage Proof Badge

```
┌──────────────────────────────────────────────┐
│  ✓ Stored on Arweave                        │
│  Manifest: ar://ARXXXXXX...                 │
│  TX: 2025-02-28 · Permanent                 │
│                         [Verify →]           │
└──────────────────────────────────────────────┘
```

- **Verified**: Sea green `#2B7574` + checkmark icon
- **Pending**: Amber + loading indicator
- **Failed**: Crimson `#861211` + retry button

---

## 10. Component Checklist

| Component | Status | Notes |
|-----------|--------|-------|
| AgentCard | Redesign | New gradient + topo texture |
| Button | Extend | Add topo variant, fix sizes |
| SiteHeader | Redesign | Mobile bottom nav |
| ChatClient | Refine | Add streaming, cost display |
| CreateAgentForm | Redesign | Multi-step wizard |
| CreditsPage | Redesign | Mobile money CTA |
| FilterBar | New | Category pills + search |
| StorageProofBadge | New | Arweave/Filecoin proof UI |
| AgentCardSkeleton | New | Loading state |
| EmptyState | New | Illustrated empty states |
| ToastNotification | New | Success/error/info toasts |
| Modal (Radix) | Existing | Update styles |
| ThemeSwitcher | New | Dark/light toggle |
| MobileNavDrawer | New | Bottom sheet navigation |
