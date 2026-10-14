# DESIGN.md — mevebu styling reference

Single stylesheet: `src/styles/mevebu.css` (~850 lines, hand-written, no framework). This document is the contract for how classes are named, what tokens exist, and which components are already styled vs. still needed by tool implementations.

## Design language (the "vibe")

- **"Ink & paper"**: calm neutral surfaces, one warm accent (amber/coffee — nods to *buy me a coffee*), hairline borders instead of heavy shadows.
- Fluid type scale via `clamp()`, 4/8px spacing rhythm, system font stack (`--font-sans`), monospace for values/code (`--font-mono`).
- Dark theme is the default (`<html data-theme="dark">`); light theme flips tokens only. Toggle sets `data-theme` on `<html>` + persists to `localStorage["mevebu.theme"]`.
- Motion: subtle transitions (0.15s), card lift on hover; everything disabled under `prefers-reduced-motion`.
- A11y built into styles: `:focus-visible { outline: 2px solid var(--accent) }`, `[hidden] { display:none !important }`.

## Tokens (CSS custom properties)

| Token | Purpose | Dark → Light |
|---|---|---|
| `--bg` | page background | `#0e0f12` → `#faf9f7` |
| `--bg-raised` | topbar/footer/inputs surface | `#14161a` → `#fff` |
| `--bg-card` | cards, modals, workspace | `#17191e` → `#fff` |
| `--bg-hover` | hover fills | `#1d2027` → `#f1efeb` |
| `--border` / `--border-strong` | hairlines / hover border | `#262a31`,`#343a44` → `#e5e2dc`,`#d6d2c9` |
| `--text` / `--text-muted` / `--text-faint` | 3-step text hierarchy | light greys → dark greys |
| `--accent` | amber `#f5b942` / burnt `#b45309` | brand color, active states |
| `--accent-soft` | translucent accent fill | icon chips, active nav bg |
| `--accent-contrast` | text **on** accent | `#1c1917` (both themes) |
| `--shadow` | one elevation level | used on card hover, dropdowns, modal |
| `--scrim` | modal backdrop | with `backdrop-filter: blur(2px)` |
| `--r-sm/md/lg` | radii | `8px / 12px / 16px` |
| `--topbar-h` / `--page-max` | layout constants | `60px / 1180px` |
| `--font-sans` / `--font-mono` | stacks | system-ui / ui-monospace |

Rules: **never hardcode colors in new CSS** — consume tokens. Theme switching must keep working purely by token swap.

## Naming convention — BEM-ish

- Block = component: `.card`, `.topbar`, `.donate-card`, `.toolpage`.
- Element = `block__element`: `.card__name`, `.footer__inner`, `.searchbox__input`.
- Modifier = `block--modifier` or `is-state` class: `.btn--accent`, `.split--equal`, `.card__fav.is-fav`, `.topnav__link.is-active`.
- Utility-ish single-purpose helpers allowed: `.icon-sm/.icon-md/.icon-lg` (16/20/28px), `.breakable`, `.grow`, `.wrap`, `.center-col`, `.dot-sep`, `.linklike`, `.scrollbox`, `.tablewrap`, `.meter`(+`__fill`).
- Shared atoms prefixed `t*` live inside the tool workspace (see §Workspace below): `tstack`, `tfield`, `tinput`, `tchip`…

## Component inventory (already styled in mevebu.css)

### Chrome / layout
- `.page` — centered max-width container w/ fluid padding.
- `.topbar` (+ `__inner`, `__actions`, `__burger`) — sticky, blurred (`color-mix` + backdrop-filter), bottom hairline.
- `.brand` (+ `__mark` accent square, `__name`, `__tag` pill) — logo lockup, reused as `.brand--footer`.
- `.search` — fake search trigger button in topbar (opens modal); hidden ≤860px.
- `.topnav` / `.topnav__link` (+ `.is-active` accent soft bg) — desktop nav; hidden ≤860px.
- `.lang` + `.dropdown` / `.dropdown__item` — absolutely-positioned menu under lang button.
- `.mobilenav` (+ `__donate` accent link) — burger panel shown ≤860px.
- `.theme-sun` / `.theme-moon` — icon visibility swapped by `html[data-theme="light"]`.
- `.hero` (+ `__kicker` pill, `__title` clamp(34–56px), `__title-accent`, `__sub`, `__cta`) — home header block.
- `.section` (+ `__head`, `__title`, `__count` mono), `.group-title` (uppercase label with trailing hairline `::after`).
- `.footer` (+ `__inner` 4-col grid → 2 → 1, `__col`, `__title`, `__blurb`, `__privacy`, `__bottom`, `__bottom-right`) — donate card lives in last column.

### Buttons & controls
- `.btn` base (inline-flex, 9×16 padding, r-sm, weight 600) with modifiers:
  `--accent` (accent bg + contrast text), `--ghost` (raised bg + border), `--block` (full width), `--star`, `--donate` (labels collapse to icons ≤860px).
- `.btn__count` — mono pill for star count.
- `.iconbtn` — 36×36 square icon-only button.
- `kbd` — keycap styling used in search hints.

### Catalog
- `.grid` — `repeat(auto-fill, minmax(min(260px,100%), 1fr))`, gap 14.
- `.card` (+ `__top`, `__icon` 40px accent-soft chip, `__fav` star toggle w/ `.is-fav` filled, `__name`, `__desc` 2-line clamp, `__cat` footer label) — whole card is an `<a href="#/cat/id">`; hover lifts -2px + shadow.
- `.empty` — dashed-border empty state.

### Search modal
- `.modal` (fixed, top-aligned 12vh) + `__backdrop` (scrim+blur) + `__panel` (min(560px,100%), r-lg).
- `.searchbox__input` (icon + borderless input row), `.searchbox__results` (max-height 320 scroll), `.sres` rows (+ `__meta` right-aligned, `.is-active` hover bg), `.searchbox__foot` kbd legend.

### Tool page
- `.crumbs` (+ `.sep`, `.current`) breadcrumb row.
- `.toolpage__head` — 52px `.toolpage__icon` chip + `.toolpage__meta` (h1 clamp 20–26 + muted tagline) + `.favbtn` 42px bordered star (`.is-fav` accent border/fill).
- `.workspace` — card container, `min-height:300px`, currently `display:grid; place-items:center` (⚠ tools that render their own layout need `align-items:start` / full-width child handling when workspace classes land).
- `.workspace__placeholder` — wrench + note for unmounted tools.
- `.docs` auto-fit grid (≥420px cols) of `.docs__block` (raised card, h2 w/ accent icon) containing `.docs__body`, `.docs__steps` (ol), `.docs__example` (mono pre-wrap code box), `.faq` (`details/summary` with `+`/`–` marker), `.faq__a`.
- `.toolpage__foot` + `.backlink`.

### Footer donate
- `.donate-card` — bordered card, `__title`, body copy ("Thanks for stopping by…" — user-supplied text, don't rewrite), `.btn--block` CTA → buymeacoffee.com/fastro.

## Workspace classes (used by tool implementations — TO IMPLEMENT)

These are referenced from `src/tools/implementations/*.js` but **not yet defined in mevebu.css**. When adding them, follow existing tokens/BEM and keep each ≤ ~15 lines. Suggested semantics (from usage sites):

Layout:
- `.tstack` — vertical flex/grid, gap 12–14 (form column).
- `.split`, `.split--equal` (1fr 1fr), `.split--wide-right` (narrow left controls, wide right output). Collapse to 1 column ≤720px.
- `.trow`, `.trow--wrap` — horizontal inline control row, gap 8.
- `.center-col` — centered single-column stage (coin flip, wheel result).
- `.grow` — flex:1 utility; `.wrap`, `.breakable`, `.scrollbox`, `.tablewrap` — overflow helpers.

Form atoms:
- `.tfield` (+ `.tfield__label` small muted label above control).
- `.tinput` — shared input/textarea/select skin (bg-raised, border, r-sm, focus accent border); `.ttextarea` (resize:vertical, min rows); `.code` variant uses `--font-mono`.
- `.tout` / `.tout--block` — read-only output panel (mono, selectable).
- `.terr` — error text (use a red token or `color-mix` of accent; keep readable in both themes).
- `.tnote` — small muted helper text.
- `.tcheck` — checkbox row; `.tnum` — compact number input (width ~80px).
- `.tslider` — range input styled with accent thumb/track.
- `.tpicker` — native color input sizing.
- `.tseg` — segmented control group (bordered pill row); children get `.is-on` active state (accent-soft bg).
- `.tchip` — small selectable pill button (cases, algs, ECC levels); active = `.is-on`.

Tool-specific (fine to style per-tool if generic atoms don't fit):
`.wheel` + `.wheel__chip/__status/__history`, `.flip__result/__tally`, `.coin`, `.die`, `.dice__faces/__total`, `.pick__result`, `.pwdout`, `.swatch`, `.caselist`, `.meter` + `.meter__fill` (password strength), `.dropzone` (+ drag-over state), `.qrcam`, `.qrcanvas`, `.tablewrap .ttable`, `.toast` (fixed bottom-center pill, shown by `toast()` in dom.js).

## Responsive breakpoints

- `≤1020px` — footer 4→2 columns.
- `≤860px` — hide `.search` + `.topnav`, show burger; star/donate buttons become icon-only.
- `≤560px` — footer 1 column, hero padding shrinks, tool head wraps.
- New workspace layouts should add their own collapse at ~720px (two-pane → stacked).

## Do / Don't

- ✅ Add tokens first, components second; reuse `.btn`, `.tfield`, `.tchip` everywhere.
- ✅ Style against **both** themes before calling it done (toggle manually).
- ❌ No Tailwind/utility-CSS, no CSS-in-JS, no new fonts/network assets (offline-first!).
- ❌ No `!important` except the existing `[hidden]` rule.
- ❌ Don't restyle lucide SVG internals beyond size/color utilities.
