# nguix — Design System

## Colors

All colors are defined as CSS custom properties on `:root`.

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0f1117` | Page background |
| `--surface` | `#1a1d27` | Cards, sidebar, table, inputs |
| `--border` | `#2a2d3a` | All borders and dividers |
| `--text` | `#e2e4ed` | Primary text |
| `--text-muted` | `#6b7280` | Labels, placeholders, secondary info |
| `--accent` | `#4f8ef7` | CTA buttons, active states, focus rings |
| `--green` | `#34d399` | Enabled status, SSL active, positive stats |
| `--red` | `#f87171` | Destructive actions (delete hover) |
| `--yellow` | `#fbbf24` | SSL stat counter, warnings |

### Color usage rules

- Backgrounds layer from dark to light: `--bg` → `--surface`. Never go deeper than two levels.
- Borders are always `--border`, no exceptions. Don't use opacity hacks for borders.
- `--accent` is for one interactive element per view (primary button, active nav item). Don't spread it.
- Status colors (`--green`, `--red`, `--yellow`) are used at 10% opacity for backgrounds (`rgba(52,211,153,0.1)`), full opacity for text and dots.

---

## Typography

Font stack: `'Inter', system-ui, -apple-system, sans-serif`

| Role | Size | Weight |
|---|---|---|
| Page title | 20px | 600 |
| Logo | 18px | 700 |
| Body / table cells | 14px | 400 |
| Small labels, aliases | 13px | 400 |
| Table headers, badges, config paths | 11–12px | 500–600 |

Table headers use `text-transform: uppercase` with `letter-spacing: 0.6px`.

Monospace (config file paths): inherit the system monospace stack, 12px.

---

## Spacing

Base unit: **4px**. All padding and gaps are multiples of 4.

| Context | Value |
|---|---|
| Page padding | 32px top, 40px sides |
| Section gap (stats → filters → table) | 24–28px |
| Table cell padding | 14px vertical, 16px horizontal |
| Table header padding | 11px vertical, 16px horizontal |
| Sidebar padding | 24px top, 20px sides |
| Nav item padding | 9px vertical, 20px horizontal |

---

## Components

### Badges

Two variants, both use a colored dot + colored text on a tinted background.

```
.badge-enabled  → green  (#34d399), 10% opacity background
.badge-disabled → muted  (#6b7280), 10% opacity background
```

Border-radius: 4px. Font: 11px / 500.

### Buttons

| Class | Background | Text | Use |
|---|---|---|---|
| `.btn-primary` | `--accent` | white | One per view, main action |
| `.btn-ghost` | transparent | `--text-muted` | Secondary actions |

Border-radius: 6px. Hover: `opacity: 0.85`. Icon gap: 6px.

### Icon buttons (`.icon-btn`)

30×30px, border-radius 5px. Default color: `--text-muted`.  
Hover: `--text` on `rgba(255,255,255,0.06)` background.  
Danger variant: `--red` on `rgba(248,113,113,0.08)` background on hover.

### Filter tabs

Group of tabs inside a single `--surface` container with `--border` border.  
Active tab: `--accent` background, white text.  
Inactive: `--text-muted`, no background.  
Border-radius container: 6px. Tab border-radius: 4px. Padding: 5px 12px.

### Stat cards

Full-width flex row, each card takes equal space (`flex: 1`).  
Label: 11px uppercase muted. Value: 24px / 700.  
Value colors: default `--text`, positive `--green`, warning `--yellow`.

---

## Surfaces & elevation

nguix uses two surface levels only:

```
Level 0 — --bg      (#0f1117)  Page background
Level 1 — --surface (#1a1d27)  Sidebar, cards, table, inputs
```

Elevation is expressed through borders (`--border`), not shadows.  
Don't introduce `box-shadow` unless absolutely necessary (e.g. dropdowns/modals).

---

## Layout

- **Sidebar**: fixed, 220px wide, full height.
- **Main content**: `margin-left: 220px`, `padding: 32px 40px`.
- No responsive breakpoints yet — desktop only for v0.

---

## Do / Don't

| Do | Don't |
|---|---|
| Use CSS tokens everywhere | Hardcode hex values in components |
| Layer surface colors (bg → surface) | Add a third surface level |
| Use `--accent` for one action per screen | Use `--accent` for decorative elements |
| Express elevation with borders | Use box-shadow for depth |
| Keep status colors to badges and dots | Color entire rows or sections with status colors |
