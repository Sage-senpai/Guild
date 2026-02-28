# Desktop Layout Specification — Ajently

> Document date: 2026-02-28
> Breakpoints: Desktop (1024-1439px), Wide (1440px+)
> Philosophy: Desktop is NOT just a wider mobile — it is a structurally different experience

---

## 1. Desktop Design Principles

1. **Information density**: Desktop can show more — use it. Side panels, two-column layouts, visible detail that collapses on mobile.
2. **Keyboard navigation**: Every action is keyboard-accessible; shortcuts documented in `/credits` route hint.
3. **Hover states**: Desktop can show richer hover — info on card hover, preview on link hover.
4. **No bottom nav**: Desktop uses a full top navbar with visible links.
5. **Side panels**: Desktop opens secondary content in side sheets, not full-screen modals.
6. **Max-width containment**: Content max-width 1200px, centered. Wide screens get ample whitespace — premium feel.

---

## 2. Global Desktop Layout Grid

```
┌──────────────────────────────────────────────────────────────────────┐
│  GLOBAL HEADER (64px)                                                │
│  Logo · Marketplace · Create · Profile · Credits     [Wallet Button] │
└──────────────────────────────────────────────────────────────────────┘
│                                                                      │
│              CONTENT AREA (max-width: 1200px, centered)              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                       PAGE CONTENT                             │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
│  FOOTER (optional, minimal — external links, legal, social)          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Marketplace (Desktop)

```
──────────────────────────────────────────────────────────────────────
NAVIGATION (sticky glassmorphism header, 64px)
──────────────────────────────────────────────────────────────────────
[Guild]   Marketplace   Create   Profile   Credits        [0x1234...◦]
──────────────────────────────────────────────────────────────────────

HERO SECTION (optional on home, 280px, animated gradient)
┌────────────────────────────────────────────────────────────────────┐
│     ░░░░ Topographic gradient background ░░░░                      │
│                                                                    │
│     The App Store                                                  │
│     for AI Agents.           [Browse Marketplace →]                │
│                              [Create an Agent →    ]               │
└────────────────────────────────────────────────────────────────────┘

FILTER SIDEBAR + GRID (two-column: 240px sidebar + 900px grid)
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────────┐  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ FILTER PANEL │  │  │ Agent 1  │  │ Agent 2  │  │ Agent 3  │  │
│  │              │  │  └──────────┘  └──────────┘  └──────────┘  │
│  │ 🔍 Search   │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │             │  │  │ Agent 4  │  │ Agent 5  │  │ Agent 6  │  │
│  │ Category    │  │  └──────────┘  └──────────┘  └──────────┘  │
│  │ ● All       │  │                                              │
│  │ ○ Coding    │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ ○ Marketing │  │  │ Agent 7  │  │ Agent 8  │  │ Agent 9  │  │
│  │ ○ Research  │  │  └──────────┘  └──────────┘  └──────────┘  │
│  │ ○ Design    │  │                                              │
│  │ ○ Finance   │  │  [Load more agents ▾]                       │
│  │ ○ Education │  │                                              │
│  │ ○ Productiv │  │                                              │
│  │ ○ General   │  │                                              │
│  │             │  │                                              │
│  │ Price Range │  │                                              │
│  │ $──●────$   │  │                                              │
│  │             │  │                                              │
│  │ Model Type  │  │                                              │
│  │ □ Text      │  │                                              │
│  │ □ Vision    │  │                                              │
│  │ □ Image     │  │                                              │
│  └──────────────┘  │                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Desktop Agent Card (larger variant)
```
┌─────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← 160px gradient header
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                        [💻 Coding] │  ← badge top-right
├─────────────────────────────────────┤
│                                     │
│  SQL Query Fixer                    │  ← Playfair Display 20px
│  Debugs SQL errors and rewrites     │  ← 3-line clamp
│  inefficient queries in seconds.    │
│  Works with all major databases.    │
│                                     │
│  ┌───────────────┐  ┌─────────────┐ │
│  │ 🔤 Llama 3.3  │  │  0.03 ✦/run │ │
│  └───────────────┘  └─────────────┘ │
│                                     │
│  ┌──────────────────┐ ┌───────────┐ │
│  │   Run Agent →    │ │  Details  │ │  ← two buttons on desktop
│  └──────────────────┘ └───────────┘ │
│                                     │
│  ✓ Verified on Arweave              │  ← storage proof badge
└─────────────────────────────────────┘
```

Hover state: card lifts with shadow-card-hover, scale(1.01), border teal brightens.

---

## 4. Agent Detail Page (Desktop — Two-Column)

```
──────────────────────────────────────────────────────────────────────
[← Marketplace]    SQL Query Fixer                        [Share] [⋮]
──────────────────────────────────────────────────────────────────────

┌──────────────────────────────────┐  ┌────────────────────────────────┐
│  MAIN CONTENT (65%)              │  │  ACTION PANEL (35%)            │
│                                  │  │                                │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │  Credits: 142.50 ✦             │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │  Cost: 0.03 ✦ / run           │
│  ░░ Hero banner (full width) ░░ │  │                                │
│                                  │  │  ┌──────────────────────────┐ │
│  About this Agent               │  │  │     Run Agent →          │ │
│  Debugs SQL errors and rewrites │  │  └──────────────────────────┘ │
│  inefficient queries. Supports  │  │                                │
│  MySQL, PostgreSQL, SQLite,     │  │  Storage Proof                │
│  Oracle, and BigQuery.          │  │  ✓ Stored on Arweave         │
│                                  │  │  ar://ARXXXXXX...            │
│  Specifications                 │  │  TX: Feb 28, 2026            │
│  ┌──────────────────────────┐   │  │  [Verify Retrieval →]        │
│  │ Model:    Llama 3.3 70B  │   │  │                                │
│  │ Category: Coding         │   │  │  Creator                      │
│  │ Price:    0.03 ✦/run    │   │  │  0x1234...5678               │
│  │ Created:  Feb 28, 2026   │   │  │  3 agents published          │
│  └──────────────────────────┘   │  │                                │
│                                  │  │  Share                        │
│  Run History                    │  │  [🔗 Copy Link] [𝕏 Tweet]    │
│  ┌──────────────────────────┐   │  └────────────────────────────────┘
│  │ Feb 28 · 2:31PM · Done  │   │
│  │ Feb 27 · 6:15PM · Done  │   │
│  │ Feb 26 · 11:02AM · Done │   │
│  └──────────────────────────┘   │
└──────────────────────────────────┘
```

---

## 5. Chat Interface (Desktop — Two-Column)

```
──────────────────────────────────────────────────────────────────────
[← Back]    SQL Query Fixer    [🔤 Llama 3.3 70B]    Credits: 142.50
──────────────────────────────────────────────────────────────────────

┌──────────────────────────────────┐  ┌────────────────────────────────┐
│  CHAT HISTORY (65%)              │  │  AGENT INFO PANEL (35%)        │
│                                  │  │                                │
│  Agent: Hello! I'm your SQL      │  │  About                        │
│         assistant. Send me your  │  │  Debugs SQL errors and...     │
│         queries or error logs.   │  │                                │
│                                  │  │  Model                        │
│       User: Fix this error:      │  │  Llama 3.3 70B               │
│       ORA-00942 table not found  │  │  [text] badge                 │
│                                  │  │                                │
│  Agent: ORA-00942 means the table│  │  Cost per run                 │
│         or view doesn't exist in │  │  0.03 credits                 │
│         the current schema...    │  │                                │
│                                  │  │  Your Balance                 │
│  ```sql                          │  │  142.47 credits               │
│  SELECT * FROM schema.tablename  │  │  [Add Credits]                │
│  WHERE ...                       │  │                                │
│  ```                             │  │  ─────────────────────────── │
│                                  │  │                                │
│       ◌ ◌ ◌                     │  │  Knowledge                    │
│                                  │  │  SQL standards doc.pdf       │
│                                  │  │  Uploaded · 24KB             │
└──────────────────────────────────┘  └────────────────────────────────┘
──────────────────────────────────────────────────────────────────────
 [📎 Attach]  [Type a message here...                    ]  [↑ Send]
 Cost estimate: 0.03 credits  ·  Remaining: 142.47 credits
──────────────────────────────────────────────────────────────────────
```

**Desktop chat behaviors**:
- Agent info panel is always visible (no need to go back to detail page)
- Code blocks have copy button, line numbers, syntax highlighting via Shiki
- Message actions appear on hover (copy, thumbs up/down)
- Right-click on message = context menu (copy, report)

---

## 6. Create Agent (Desktop — Single Wide Form)

```
──────────────────────────────────────────────────────────────────────
Create Agent
──────────────────────────────────────────────────────────────────────

┌────────────────────────────────────┐  ┌──────────────────────────────┐
│  FORM (60%)                        │  │  LIVE PREVIEW (40%)          │
│                                    │  │                              │
│  Agent Identity                    │  │  ┌────────────────────────┐  │
│  Name ────────────────────────     │  │  │ ░░░░░░░░░░░░░░░░░░░░░ │  │
│  [SQL Query Fixer              ]   │  │  │ ░░░░░░░░░░░░░░░░░░░░░ │  │
│                                    │  │  │               [Coding] │  │
│  Category ─────────────────────    │  │  ├────────────────────────┤  │
│  [Coding               ▾      ]    │  │  │ SQL Query Fixer        │  │
│                                    │  │  │ Debugs SQL errors and  │  │
│  Description ──────────────────    │  │  │ rewrites queries...    │  │
│  [                             ]   │  │  │                        │  │
│  [                             ]   │  │  │ [🔤 Llama] [0.03 ✦]   │  │
│  [                             ]   │  │  │ [    Run Agent →    ]  │  │
│                                    │  │  └────────────────────────┘  │
│  Intelligence                      │  │                              │
│  Model ─────────────────────────   │  │  This is how your agent      │
│  [Llama 3.3 70B          ▾     ]   │  │  appears in the marketplace  │
│                                    │  │                              │
│  System Prompt ─────────────────   │  │  Gradient                   │
│  ┌──────────────────────────────┐  │  │  [aurora][sunset][ocean]    │
│  │ You are a SQL performance   │  │  │  [ember ][cosmic]           │
│  │ specialist. Fix broken SQL  │  │  │                              │
│  │ and suggest faster...       │  │  │  Card Image (optional)       │
│  └──────────────────────────────┘  │  │  [📁 Upload or drag image]  │
│  [↓ 450 tokens · ~$0.0009/call]    │  │                              │
│                                    │  │  ┌──────────────────────┐   │
│  Knowledge File (optional)         │  │  │  Price: 0.03 ✦/run  │   │
│  [📎 Drag or click to upload]      │  │  └──────────────────────┘   │
│                                    │  └──────────────────────────────┘
│  Economics                         │
│  Price per Run ─────────────────   │
│  [ 0.03 ] credits                  │
│                                    │
│  [ Save Draft ]  [ Publish → ]     │
└────────────────────────────────────┘
```

**Live preview**: Right panel shows the agent card preview in real-time as form fields change. Gradient selection updates the preview card immediately.

---

## 7. Profile / Dashboard (Desktop)

```
──────────────────────────────────────────────────────────────────────
Profile
──────────────────────────────────────────────────────────────────────

┌──────────────────────────────────────────────────────────────────┐
│  ┌──────┐  0x1234...5678                                         │
│  │ 👤   │  Joined: Feb 2026                                      │
│  └──────┘  3 agents published · 47 total runs                   │
└──────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐ ┌────────────────────────┐
│  My Agents                             │ │  Credits Summary       │
│                                        │ │                        │
│  ┌──────────┐ ┌──────────┐ ┌────────┐  │ │  Remaining            │
│  │ SQL Fix  │ │ Hook Arc │ │ + New  │  │ │  142.50 ✦            │
│  │ ✓ Live   │ │ ✓ Live   │ │ Create │  │ │                        │
│  └──────────┘ └──────────┘ └────────┘  │ │  Used (30 days)       │
│                                        │ │  12.40 ✦             │
│  Drafts (1)                            │ │                        │
│  • Market Intel Scout  [Publish →]     │ │  Topped Up            │
│                                        │ │  155.00 ✦            │
└────────────────────────────────────────┘ │                        │
                                           │  [Add Credits →]       │
                                           └────────────────────────┘

Runs
┌──────────────────────────────────────────────────────────────────┐
│  Date         Agent              Mode          Cost    Status     │
│  ─────────────────────────────────────────────────────────────── │
│  Feb 28 2:31  SQL Query Fixer    OpenRouter    0.03 ✦  Done      │
│  Feb 28 9:15  Viral Hook Arch.   OpenRouter    0.02 ✦  Done      │
│  Feb 27 6:15  SQL Query Fixer    0G Compute    0.03 ✦  Done      │
│  [Load more...]                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Wide Screen Handling (1440px+)

At 1440px+, the layout adds generous whitespace:
- Max content width remains 1200px
- Left/right margins increase proportionally
- Hero sections extend edge-to-edge behind the nav
- Cards get slightly larger (5% scale increase via `max-w-sm` → `max-w-md`)
- Sidebar filter panel becomes 280px (vs 240px)

```css
/* Content container */
.content-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 4rem);
}

/* Hero sections bleed to edges */
.hero-section {
  width: 100vw;
  margin-left: calc(-1 * ((100vw - 1200px) / 2));
  padding-left: calc((100vw - 1200px) / 2 + 4rem);
  padding-right: calc((100vw - 1200px) / 2 + 4rem);
}
```

---

## 9. Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `N` | New agent |
| `G G` | Go to marketplace |
| `G P` | Go to profile |
| `G C` | Go to credits |
| `Esc` | Close modal / go back |
| `Cmd+Enter` | Submit form |
| `Cmd+K` | Open command palette |
| `D` | Toggle dark mode |

---

## 10. Desktop Accessibility

- All interactive elements reachable by keyboard in logical tab order
- Skip to main content link at top of page
- Screen reader: ARIA labels on all icon-only buttons
- Reduced motion: no animations or transitions
- High contrast mode: uses OS-level contrast settings
- Font size: respects user's browser font size setting (rem-based sizing)
