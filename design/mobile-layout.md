# Mobile Layout Specification — Guild

> Document date: 2026-02-28
> Breakpoints: Mobile (360-767px), Tablet (768-1023px)
> Design philosophy: Mobile-first — not desktop shrunk to mobile

---

## 1. Mobile Design Principles

1. **Thumb-friendly zones**: Primary actions in bottom 60% of screen (natural thumb reach)
2. **Content priority**: Agent name, description, price — in that order. No decorative clutter.
3. **One primary action per screen**: Never more than one CTA button per viewport
4. **Bottom sheet pattern**: All overlays, filters, and forms come from the bottom
5. **Swipe gestures**: Swipe right = back; swipe left on cards = quick run; swipe down = dismiss modal
6. **Data frugality**: All pages under 100KB transferable data on first load
7. **Offline resilience**: Agent catalog browsable without network (Service Worker cache)

---

## 2. Screen Specifications

### 2.1 Home / Marketplace (Mobile)

```
📱 360px width
─────────────────────────────
[Status bar]
─────────────────────────────
┌─────────────────────────┐
│ [☰] Guild.io    [💳 12c] │  ← 56px header
└─────────────────────────┘
┌─────────────────────────┐
│ 🔍 Search agents...     │  ← 44px search input, rounded-full
└─────────────────────────┘
┌─────────────────────────┐
│ [All] [Coding] [Market] → │  ← horizontal scroll category pills
└─────────────────────────┘

┌─────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░ │  ← gradient header image (120px)
│ ░░░░░░░░░░░░░░░░░░░░░░ │
│                [Coding] │  ← category badge
├─────────────────────────┤
│ SQL Query Fixer         │  ← Playfair Display 18px
│ Debugs SQL errors and   │  ← 2-line clamp
│ rewrites inefficient... │
│                         │
│ [🔤 Llama 3.3] [0.03 ✦] │  ← model pill + price
│ [      Run Agent →     ]│  ← full-width button 44px
└─────────────────────────┘

┌─────────────────────────┐
│ (second card)           │
└─────────────────────────┘

[Load more...]

─────────────────────────────
[🏪 Market] [✦ Agents] [+ Create] [👤]  ← Bottom nav 56px
─────────────────────────────
```

**Key mobile behaviors**:
- Category pills: horizontal scroll with snap (no wrapping)
- Cards: single column, full width, 16px horizontal padding
- Card gradient: reduced to 120px height on mobile (vs 160px desktop)
- Load more: infinite scroll with intersection observer

---

### 2.2 Agent Detail Page (Mobile)

```
📱 360px width
─────────────────────────────
[← Back]      Agent Detail    [⋮]
─────────────────────────────
┌─────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░ │  ← full-width hero (200px)
│ ░░░░░░░░░░░░░░░░░░░░░░ │
│ SQL Query Fixer         │  ← overlaid on hero
│ [Coding]    [Verified✓] │
└─────────────────────────┘

│ 0.03 credits / run              │
│                                 │
│ About                           │
│ Debugs SQL errors and rewrites  │
│ inefficient queries using the   │
│ latest LLM reasoning...         │
│                                 │
│ ┌──────────────────────────┐    │
│ │ Model: Llama 3.3 70B     │    │
│ │ Category: Coding         │    │
│ └──────────────────────────┘    │
│                                 │
│ Storage Proof                   │
│ ✓ Stored on Arweave             │
│ ar://ARXXXXXX...  [Verify]      │
│                                 │
│ Run History (last 5)            │
│ • Feb 28 · 2:31 PM · Completed │
│ • Feb 27 · 6:15 PM · Completed │

─────────────────────────────
[        Run This Agent →       ]  ← sticky bottom button
─────────────────────────────
```

**Sticky CTA**: The "Run This Agent" button is sticky at the bottom. Scrolling content goes behind it with a gradient fade.

---

### 2.3 Chat Interface (Mobile)

```
📱 360px width
─────────────────────────────
[←]  SQL Query Fixer      [i]
     💳 Credits: 12.47
─────────────────────────────
┌─────────────────────────────────┐
│                                 │
│              Hello! I'm your    │  ← initial greeting from agent
│              SQL assistant...   │
│                                 │
│   ┌───────────────────────┐     │
│   │ Fix this error:       │     │  ← user message
│   │ ORA-00942 table not.. │     │
│   └───────────────────────┘     │
│                                 │
│  The error ORA-00942 indicates  │  ← agent response
│  the table or view doesn't      │
│  exist. Here are the fixes:     │
│                                 │
│  ```sql                         │
│  SELECT * FROM schema.table     │
│  ```                            │
│                                 │
│   ◌ ◌ ◌                        │  ← typing indicator
│                                 │
└─────────────────────────────────┘
─────────────────────────────
[📎] [Type a message...  ] [↑ Send]  ← 44px input bar
─────────────────────────────
```

**Mobile chat behaviors**:
- Input bar moves up with keyboard (use `env(safe-area-inset-bottom)`)
- Chat history scrolls independently
- Images rendered inline with tap-to-zoom
- Code blocks have horizontal scroll
- Tap on agent header shows info sheet

---

### 2.4 Create Agent (Mobile, Step-by-Step)

```
─────────────────────────────
[←]    Create Agent    1 of 3
━━━━━━━━━━░░░░░░░░░░░░░░░░░  ← progress bar
─────────────────────────────
│                             │
│  Give your agent a name    │
│                             │
│  ┌─────────────────────┐   │
│  │  e.g. SQL Query...  │   │  ← 56px tall input
│  └─────────────────────┘   │
│                             │
│  What category?             │
│                             │
│  ╔══════╗ ┌──────┐ ┌──────┐│
│  ║Coding║ │Market│ │Educ. ││  ← pill selector, radio
│  ╚══════╝ └──────┘ └──────┘│
│  ┌────────┐ ┌──────┐       │
│  │Research│ │Design│       │
│  └────────┘ └──────┘       │
│                             │
│  Short description          │
│  ┌─────────────────────┐   │
│  │                     │   │  ← 3-line textarea
│  │                     │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
─────────────────────────────
[           Next →           ]
─────────────────────────────
```

**Step navigation**: Bottom button advances to next step; back button at top-left goes back. Progress bar fills proportionally.

---

### 2.5 Credits Page (Mobile)

```
─────────────────────────────
Credits
─────────────────────────────
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │     142.50 ✦        │   │  ← large credit display
│  │    ≈ $14.25 USD     │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  Add Credits                │
│                             │
│  ┌─────────────┐ ┌───────┐  │
│  │ 10 Credits  │ │  $10  │  │
│  │ ETH/USDC    │ │       │  │
│  └─────────────┘ └───────┘  │
│  ┌─────────────────────┐    │
│  │ M-Pesa / Mobile     │    │
│  │ Money (Africa)      │    │
│  └─────────────────────┘    │
│                             │
│  Recent Activity            │
│  ─────────────────────────  │
│  Feb 28  Agent run   -0.03  │
│  Feb 28  ETH top-up  +10.0  │
│  Feb 27  Agent run   -0.02  │
│                             │
│  [View full history →]      │
─────────────────────────────
```

---

## 3. Touch Gesture Map

| Gesture | Element | Action |
|---------|---------|--------|
| Swipe right | Any page | Go back (iOS/Android native behavior) |
| Swipe up | Bottom sheet | Expand / dismiss |
| Swipe down | Chat messages | Load older messages |
| Long press | Agent card | Preview quick actions menu |
| Tap | Category pill | Filter marketplace |
| Double-tap | Message | Copy to clipboard |
| Pinch | Code blocks | Zoom |

---

## 4. Viewport & Safe Area Handling

```css
/* Safe area for iPhone X+ notch/home bar */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

.chat-input-bar {
  padding-bottom: max(env(safe-area-inset-bottom), 1rem);
}

/* Viewport height fix for mobile browsers (toolbar issues) */
.full-height {
  height: 100dvh; /* dvh = dynamic viewport height, accounts for URL bar */
}
```

---

## 5. PWA Configuration

```json
// public/manifest.json
{
  "name": "Guild — AI Agent Marketplace",
  "short_name": "Guild",
  "description": "Discover and run AI agents. Create your own. Earn from them.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0E2931",
  "theme_color": "#0E2931",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

---

## 6. Mobile Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s (3G) | Lighthouse |
| Largest Contentful Paint | < 2.5s (3G) | Lighthouse |
| Time to Interactive | < 3.5s (3G) | Lighthouse |
| Total Blocking Time | < 300ms | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Bundle size (JS) | < 200KB gzipped | webpack-bundle-analyzer |
| Agent list load (API) | < 300ms | Turso edge reads |
