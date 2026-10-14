# AGENTS.md — mevebu

Guidance for AI agents (and humans) working on this repository. Read this before touching code. Pair it with `DESIGN.md` for styling conventions.

## What mevebu is

A collection of tiny, privacy-first browser tools (spin wheel, name picker, JWT generator, QR generator/scanner, …), organized by category, that run **100% offline in the browser**. No accounts, no uploads, no tracking, no backend.

- Primary market: English-speaking (default locale `en`).
- Distribution is dual:
  1. **npm CLI** — `npm install -g mevebu` then run `mevebu` to serve the built app locally (9router-style). Zero runtime dependencies: use only Node built-ins (`node:http`, `node:fs`) in the CLI/server script.
  2. **Static / non-npm** — anyone can download the repo or open `dist/index.html` directly. This is why routing uses **hash routes** (`#/{category}/{tool}`): they work from `file://` and any static host without server rewrites.
- Donation link (must stay): <https://buymeacoffee.com/fastro>. GitHub star button: best-effort fetch of `api.github.com/repos/fastro/mevebu` stargazers, **fails silently when offline** (keep the placeholder dash).

## Tech stack & ground rules

- **Vanilla JS (ESM) + Vite only.** No UI framework (React/Vue/Svelte), no CSS framework, no Tailwind, no component library. Styling is hand-written in `src/styles/mevebu.css`.
- Icons: `lucide` package via `createIcons({ icons })` — elements are created as `<i data-lucide="name">` placeholders (see `icon()` in `src/lib/dom.js`) and hydrated by `refreshIcons()` after DOM changes. Icon names in the registry must be valid lucide names.
- Allowed runtime deps today: `lucide`, `jsqr` (QR decoding). Keep the dependency list minimal; prefer Web APIs (`crypto.subtle`, `crypto.randomUUID`, Canvas, `getUserMedia`) over new packages.
- All tool logic runs client-side. Never introduce network calls inside tools. The only permitted external fetch is the GitHub star count (fail-silent).

## Project layout

```
index.html                     # single shell: topbar, hero, catalog grid, tool page, search modal, footer
src/main.js                    # app entry: theme, cards, routes, search modal, i18n wiring, boot
src/router.js                  # tiny hash router (route("/pattern", handler), params via ":name")
src/i18n/index.js              # dictionaries en/id/es, t(key, vars), applyI18n(data-i18n), LANGS
src/lib/dom.js                 # $, $$, el(tag, attrs, ...children), icon(), favorites (localStorage), copyText, toast, debounce
src/tools/registry.js          # CATEGORIES + TOOLS = single source of truth (see below)
src/tools/implementations/     # one file per tool + index.js lazy-registration map
src/styles/mevebu.css          # all styles, design tokens, dark/light themes
public/                        # static assets copied verbatim by Vite
bin/ (planned)                 # npm CLI launcher (Node built-ins only)
```

## Adding a tool (the only workflow you need to know)

1. **Registry** — add an object to `TOOLS` in `src/tools/registry.js`:
   `{ id, category, name, icon, tagline, description, howTo[], example, faq[] }`.
   Route `#/{category}/{id}`, card, docs section, and search indexing are automatic. Use an existing `CATEGORIES` id or add one there first.
2. **Implementation** — create `src/tools/implementations/<id>.js` exporting `{ mount(container), unmount?() }`:
   ```js
   import { el, icon, toast, copyText } from "../../lib/dom.js";
   export function mount(container) { /* build DOM into container */ return {}; }
   export default { mount };
   ```
3. **Registration** — add one line to `src/tools/implementations/index.js`:
   `registerTool("<id>", () => import("./implementations/<id>.js"));`
   (dynamic import keeps the initial bundle small — do not convert to static imports).
4. Style the tool using the shared workspace classes documented in `DESIGN.md` (`tstack`, `tfield`, `tinput`, `split`, …). Do not invent one-off styled widgets if a token/class already exists.

Copy an existing implementation as reference: `base64.js` (simple two-pane), `coin-flip.js` (centered result), `color-converter.js` (mixed controls).

## Routing model

- Hash-based: `#/` (all tools, grouped), `#/favorites`, `#/categories`, `#/about`, `#/{cat}` (category listing), `#/{cat}/{id}` (tool page). Anything else → 404 empty-state.
- Handlers live in `src/main.js` registered via `route(pattern, handler)`. The tool-page route is async: it awaits `loadToolImpl(id)` and mounts into `#toolWorkspace`; missing impls render `.workspace__placeholder`.
- Always call `refreshIcons()` after injecting DOM containing `[data-lucide]` nodes.
- Unmount discipline: `showCatalog()` calls `mountedTool.unmount?.()` — stop cameras/rAF/timers there (see `qr-scanner.js`, `spin-wheel.js`).

## i18n

- Chrome/UI strings go through `t("key")` / `data-i18n` attributes in `src/i18n/index.js` (dictionaries `en`, `id`, `es`). Add keys to **all** dicts; `en` is the fallback.
- Tool names/descriptions in the registry stay English for now (translating registry content is a planned data migration — don't half-do it).
- Language persists in `localStorage["mevebu.lang"]`; switching language re-runs `applyI18n`, `translateChrome`, and `rerender()`.

## State & storage

Everything is localStorage, prefixed `mevebu.`:
`mevebu.theme` (`dark`|`light`), `mevebu.lang`, `mevebu.favorites` (Set of tool ids, managed via `getFavorites/isFavorite/toggleFavorite` in `src/lib/dom.js`). No cookies, no sessionStorage patterns, no server state.

## Build & verify

- Dev: `npx vite` · Build: `npx vite build` → `dist/` (gitignored). Preview: `npx vite preview`.
- There is no test suite yet; verification = build passes + manual check of affected routes. Run `node --check` on edited JS files.
- `package.json` currently lacks scripts/name fields; when adding the npm CLI, set `"bin": { "mevebu": "bin/mevebu.js" }` and keep the server dependency-free.

## Conventions

- Comments and commit messages may mix English/Indonesian casually; code identifiers are English.
- `el()` builder is preferred over template strings/`innerHTML` (only `innerHTML = ""` for clearing is used).
- Event handlers via `onclick` attr in `el()` or `addEventListener`; links that change hash use `href="#/..."` (router listens on `hashchange`).
- Accessibility is non-negotiable: `aria-pressed` on favorite toggles, keyboard support in search modal (↑/↓/Enter/Esc, Ctrl/Cmd+K), visible `:focus-visible` outline, `prefers-reduced-motion` respected.
- Don't commit `.design/`, `.skills/`, `node_modules/`, `dist/` (already gitignored).

## Current status / TODO

- [x] Shell, hash router, registry-driven catalog, search modal, favorites, theme toggle, i18n chrome (en/id/es), donate + star UI.
- [x] 16 tool implementations scaffolded under `src/tools/implementations/` (incl. `qr-encoder.js` vendored encoder used by `qr-generator.js`).
- [ ] Workspace tool classes (`tstack`, `tfield`, `split`, `toast`, …) referenced by implementations but **not yet defined in `mevebu.css`** — see DESIGN.md §"Workspace classes (to implement)".
- [ ] npm CLI (`bin/mevebu.js`) + package metadata.
- [ ] Translated registry content per locale; PWA manifest/service worker for true offline caching.
