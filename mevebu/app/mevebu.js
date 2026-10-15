// mevebu, the framework: the shell (header, view, footer), the hash router
// wiring, the home page, the tool index, and the bench a tool mounts into.

import { CATEGORIES, TOOLS, getTool, getCategory, toolsInCategory, toolHref } from "../libs/js/registry.js";
import { route, start, match, currentPath, go } from "../libs/js/router.js";
import {
  $, $$, el, icon, getFavorites, isFavorite, toggleFavorite, setTheme,
  modal, modalHead, button, copyButton, openPalette, shuffle, toolcard, blank,
  VERSION, PACKAGE_NAME, checkForUpdate, updateCommand, compareVersions,
} from "../libs/js/core.js";

const DONATE_URL = "https://buymeacoffee.com/fastro";
const REPO_URL = "https://github.com/mevebu/mevebu";

const NAV = [
  { path: "/", label: "Home" },
  { path: "/tools", label: "Tools" },
  { path: "/categories", label: "Categories" },
  { path: "/about", label: "About" },
];

// ---------- shell ----------

const KBD = "rounded-[5px] border border-orbit-hard px-[7px] py-px font-sans text-2xs leading-[1.45] text-ink-3";
const ICOBTN =
  "size-[var(--ctl)] cursor-pointer items-center justify-center rounded-r1 border border-transparent bg-transparent text-ink-2 transition-colors duration-150 hover:bg-deck-2 hover:text-ink focus-visible:border-jade";
/* Link shaped like a button. `button()` returns a <button>, and the three actions
   that leave the page are anchors, so they share the same two skins here. */
const LINK_BASE = "inline-flex min-h-[var(--ctl)] items-center justify-center gap-2 rounded-r1 border px-4 text-sm font-semibold whitespace-nowrap no-underline transition-colors duration-150";
const LINK_FILL = `${LINK_BASE} border-jade bg-jade text-on-jade hover:border-jade-deep hover:bg-jade-deep`;
const LINK_PLAIN = `${LINK_BASE} border-orbit bg-deck text-ink hover:border-orbit-hard hover:bg-deck-2`;

/* Page furniture. These strings are the layout rhythm of the whole site, so they
   are named once here instead of spelled out on every page. */
const PAGE = "px-[var(--margin)]";
const PAGE_NARROW = "mx-auto max-w-[var(--bench)] px-[var(--margin)]";
const GRID = "grid grid-cols-1 gap-[var(--gutter)] sm:grid-cols-2 lg:grid-cols-3";
const SECTION = "pt-[clamp(32px,5vw,60px)]";
const SECTION_HEAD = "mb-4 flex items-baseline gap-3";
const SECTION_TITLE = "flex items-center gap-2.5 text-lg font-bold tracking-[-0.02em]";
const SECTION_MORE = "ms-auto text-sm font-semibold text-jade no-underline hover:underline";
const SECTION_COUNT = "ms-1.5 rounded-full bg-deck-2 px-2 py-px text-2xs font-semibold text-ink-3";
const LEAD = "mt-[clamp(28px,5vw,56px)] mb-0 max-w-[20ch] text-balance text-lead font-bold tracking-[-0.025em]";
const LEDE = "mt-3 mb-0 max-w-[60ch] text-pretty text-md text-ink-2";
const TEXT_LINK = "text-jade underline-offset-[3px]";
const ABOUT_BLOCK = "mt-8 grid max-w-[62ch] gap-2.5 border-t border-orbit pt-6";
const CODE = "rounded-[4px] bg-deck-2 px-[5px] py-px font-mono text-[0.92em]";

function searchButton() {
  return el(
    "button",
    {
      class:
        "me-1 inline-flex h-[var(--ctl)] min-w-[180px] cursor-pointer items-center gap-2 rounded-r1 border border-orbit bg-deck-2 ps-3 pe-2.5 text-sm font-medium text-ink-2 transition-colors duration-150 hover:border-orbit-hard hover:bg-deck hover:text-ink max-[60rem]:hidden",
      type: "button",
      "aria-label": "Search tools (Ctrl K)",
      onclick: () => openPalette(),
    },
    icon("search", "size-[15px] flex-none text-ink-3"),
    el("span", { class: "flex-1 text-start text-sm" }, "Search"),
    el("kbd", { class: KBD }, "⌘K")
  );
}

function masthead() {
  const menuBtn = el(
    "button",
    {
      class: `hidden max-[45rem]:inline-flex ${ICOBTN}`,
      type: "button",
      "aria-expanded": "false",
      "aria-controls": "navsheet",
      "aria-label": "Menu",
    },
    icon("menu")
  );

  const sheet = el(
    "div",
    { class: "grid border-t border-orbit bg-deck px-[var(--margin)] pt-1.5 pb-3.5", id: "navsheet", hidden: true },
    el(
      "nav",
      { class: "grid", "aria-label": "Site" },
      ...NAV.map((item) =>
        el("a", { class: "flex items-center gap-2 border-b border-orbit py-[13px] text-start text-md font-medium text-ink no-underline last:border-b-0", href: `#${item.path}` }, item.label)
      ),
      el("a", { class: "flex items-center gap-2 border-b border-orbit py-[13px] text-md font-medium text-ink no-underline last:border-b-0", href: REPO_URL, target: "_blank", rel: "noopener" }, "GitHub"),
      el("button", { class: "flex items-center gap-2 border-b-0 border-orbit py-[13px] text-start text-md font-medium text-jade", type: "button", onclick: () => openPalette() },
        icon("search", "size-[18px] flex-none text-ink-3"), el("span", {}, "Search tools"))
    )
  );

  const setMenu = (open) => {
    sheet.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.replaceChildren(icon(open ? "x" : "menu"));
  };
  menuBtn.addEventListener("click", () => setMenu(sheet.hidden));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !sheet.hidden) setMenu(false);
  });

  const themeBtn = el("button", { class: `inline-flex ${ICOBTN}`, type: "button", "aria-label": "Switch theme" }, icon("moon"));
  themeBtn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
    themeBtn.replaceChildren(icon(next === "dark" ? "sun" : "moon"));
  });

  const nav = el(
    "nav",
    { class: "ms-auto hidden flex-none gap-1 rounded-r2 border border-orbit bg-deck-2 p-1 min-[45rem]:flex", "aria-label": "Site" },
    ...NAV.map((item) =>
      el(
        "a",
        {
          class:
            "whitespace-nowrap rounded-lg px-3 py-[7px] text-sm font-semibold text-ink-2 no-underline transition-colors duration-150 hover:bg-ink/6 hover:text-ink data-[on]:bg-deck data-[on]:text-ink data-[on]:shadow-[0_0_0_1px_var(--orbit)]",
          href: `#${item.path}`,
          dataset: { path: item.path },
        },
        item.label
      )
    )
  );

  return el(
    "header",
    { class: "sticky top-0 z-30 border-b border-orbit bg-deck" },
    el(
      "div",
      { class: "mx-[var(--margin)] flex h-[var(--bar)] items-center gap-[clamp(14px,3vw,32px)]" },
      el("a", { class: "inline-flex flex-none items-center gap-2.5 text-lg font-bold tracking-[-0.01em] text-ink no-underline", href: "#/" },
        el("img", { class: "block size-[30px] rounded-[9px] shadow-[0_0_0_1px_var(--orbit)]", src: "./icon.png", alt: "", width: "30", height: "30" }), "mevebu"),
      nav,
      el("div", { class: "flex items-center gap-0.5 max-[45rem]:ms-auto" }, searchButton(), themeBtn, menuBtn)
    ),
    sheet
  );
}

function openHelp(tool) {
  modal({
    label: `${tool.name} how to use it`,
    body: [
      modalHead(tool.icon, tool.name),
      el("p", {}, tool.tutorial?.intro ?? tool.about),
      el(
        "ol",
        { class: "m-0 grid list-none gap-2.5 p-0 [counter-reset:step] [&>li]:grid [&>li]:grid-cols-[22px_1fr] [&>li]:items-start [&>li]:gap-2 [&>li]:text-sm [&>li]:text-ink [&>li]:[counter-increment:step] [&>li::before]:grid [&>li::before]:size-[22px] [&>li::before]:place-items-center [&>li::before]:rounded-full [&>li::before]:bg-jade-soft [&>li::before]:text-2xs [&>li::before]:font-bold [&>li::before]:tabular-nums [&>li::before]:text-jade [&>li::before]:content-[counter(step)]" },
        ...(tool.tutorial?.steps ?? []).map((step) => el("li", {}, step))
      ),
    ],
    actions: [
      el("a", { class: LINK_FILL, href: toolHref(tool) },
        icon("play"), el("span", {}, `Open ${tool.name}`)),
    ],
  });
}

function openDonate() {
  const close = modal({
    label: "Support mevebu",
    body: [
      modalHead("coffee", "Keep mevebu flying"),
      el("p", {}, "mevebu is free and runs entirely in your browser. No accounts, no ads, nothing to sell."),
      el("p", {}, "If a tool here saved you time, a coffee keeps the next one coming."),
    ],
    actions: [
      button("Not now", { onclick: () => close() }),
      el("a", { class: LINK_FILL, href: DONATE_URL, target: "_blank", rel: "noopener" },
        icon("coffee"), el("span", {}, "Buy me a coffee")),
    ],
  });
}

// `latest` is the published version, or null when the check could not run.
function openUpdate(latest) {
  const updatable = latest && compareVersions(latest, VERSION) > 0;
  const command = updateCommand();

  const commandBox = el(
    "div",
    { class: "mt-2.5 flex flex-wrap items-center gap-2 rounded-r2 border border-orbit bg-deck-2 py-2.5 pe-2.5 ps-4" },
    el("code", { class: "min-w-0 flex-1 font-mono text-sm [overflow-wrap:anywhere]" }, command),
    copyButton(() => command, "Copy command", "fill")
  );

  const versionRow = (label, value, isNew) =>
    el(
      "div",
      { class: "flex items-center justify-between gap-3 px-4 py-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-orbit" },
      el("span", { class: "text-sm text-ink-3" }, label),
      el("span", { class: `font-mono text-sm font-semibold ${isNew ? "text-jade" : ""}` }, value)
    );

  modal({
    label: "Update mevebu",
    body: [
      modalHead("circle-arrow-up", updatable ? `mevebu ${latest} is out` : "mevebu is up to date"),
      updatable
        ? el("p", {}, "A newer version is published. Update your global install, then run ", el("code", { class: "rounded-[4px] bg-deck-2 px-[5px] py-px font-mono text-[0.92em]" }, PACKAGE_NAME), " again.")
        : el("p", {}, "You are on the latest version. Nothing to do."),
      el("div", { class: "mt-[18px] overflow-hidden rounded-r2 border border-orbit" },
        versionRow("Installed", VERSION, false),
        versionRow("Latest", latest ?? "-", Boolean(updatable))),
      updatable ? el("p", { class: "mt-3.5 text-sm" }, "Copy the command below and run it in your terminal.") : null,
      updatable ? commandBox : null,
    ],
    actions: updatable
      ? [el("a", { class: LINK_PLAIN, href: `${REPO_URL}/releases/tag/v${latest}`, target: "_blank", rel: "noopener" }, "What changed")]
      : [],
  });
}

// ---------- version ----------

// The footer chip shows the current version. When npm reports a newer one, the
// chip turns into an "update" button and the modal explains how to upgrade.
async function startVersionChip() {
  const chip = $("#version");
  if (!chip) return;
  chip.textContent = `v${VERSION}`;

  let latest = null;
  try {
    const result = await checkForUpdate();
    latest = result?.latest ?? null;
  } catch {
    /* offline: keep the plain version label */
  }

  const outdated = latest && compareVersions(latest, VERSION) > 0;
  if (outdated) {
    chip.dataset.new = "";
    chip.setAttribute("aria-label", `Update available: version ${latest}`);
    chip.replaceChildren(icon("circle-arrow-up"), el("span", {}, `Update to v${latest}`));
  }

  chip.addEventListener("click", (event) => {
    event.preventDefault();
    openUpdate(latest);
  });
  chip.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openUpdate(latest);
    }
  });
}

function footer() {
  const donate = button("Donate", {
    icon: "coffee",
    kind: "quiet",
    onclick: (event) => {
      event.preventDefault();
      openDonate();
    },
  });

  const FOOT_LINK = "text-sm text-ink-2 no-underline hover:text-jade";
  const group = (title, links) =>
    el(
      "div",
      {},
      el("h4", { class: "m-0 mb-2.5 text-2xs font-bold tracking-[0.08em] text-ink-3 uppercase" }, title),
      el("ul", { class: "m-0 grid list-none gap-1.5 p-0" }, ...links.map((link) => el("li", {}, link)))
    );

  return el(
    "footer",
    { class: "mt-[clamp(40px,8vw,88px)] border-t border-orbit bg-deck" },
    el(
      "div",
      { class: "mx-[var(--margin)] pt-[clamp(30px,5vw,48px)] pb-7" },
      el(
        "div",
        { class: "flex flex-wrap items-start justify-between gap-[clamp(24px,5vw,64px)]" },
        el(
          "div",
          { class: "grid gap-1.5" },
          el("a", { class: "inline-flex items-center gap-[9px] text-md font-bold tracking-[-0.01em] text-ink no-underline", href: "#/" },
            el("img", { class: "block size-[34px] rounded-[11px] shadow-[0_0_0_1px_var(--orbit)]", src: "./icon.png", alt: "", width: "34", height: "34" }), "mevebu"),
          el("p", { class: "m-0 max-w-[30ch] text-sm leading-[1.5] text-ink-3" }, "Small tools that run in your browser. No accounts, no uploads, no tracking.")
        ),
        el(
          "nav",
          { class: "flex flex-wrap gap-[clamp(28px,6vw,72px)]", "aria-label": "Site" },
          group("Browse", [
            el("a", { class: FOOT_LINK, href: "#/tools" }, "All tools"),
            el("a", { class: FOOT_LINK, href: "#/categories" }, "Categories"),
            el("a", { class: FOOT_LINK, href: "#/favorites" }, "Favorites"),
          ]),
          group("Project", [
            el("a", { class: FOOT_LINK, href: "#/about" }, "About"),
            el("a", { class: FOOT_LINK, href: REPO_URL, target: "_blank", rel: "noopener" }, "GitHub"),
            donate,
          ])
        )
      ),
      el(
        "div",
        { class: "mt-[clamp(26px,4vw,44px)] flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-orbit pt-5 text-2xs text-ink-3" },
        el("p", { class: "m-0 flex items-center gap-2" }, "MIT licensed."),
        el(
          "p",
          { class: "m-0 flex items-center gap-2" },
          "Source: ",
          el("a", { class: FOOT_LINK, href: REPO_URL, target: "_blank", rel: "noopener" }, "github.com/mevebu/mevebu"),
          el("span", { class: "inline-flex items-center gap-1 text-2xs text-ink-3", id: "starcount" })
        ),
        el(
          "p",
          { class: "m-0 flex items-center gap-2" },
          el("button", {
            class:
              "inline-flex min-h-7 cursor-pointer items-center gap-1.5 rounded-full border border-orbit bg-transparent px-2.5 py-[3px] font-sans text-2xs tabular-nums text-ink-3 transition-colors duration-150 hover:border-orbit-hard hover:text-ink data-[new]:border-jade data-[new]:bg-jade-soft data-[new]:font-semibold data-[new]:text-jade data-[new]:hover:bg-jade data-[new]:hover:text-on-jade",
            id: "version",
            type: "button",
            title: "Check for updates",
          }, "-")
        )
      )
    )
  );
}

// ---------- cards, rows, filter ----------

function starButton(tool, onToggle) {
  const on = isFavorite(tool.id);
  const btn = el(
    "button",
    {
      class:
        "me-2 inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-r1 border-0 bg-transparent text-orbit-hard transition-[color,transform] duration-150 hover:text-ink-2 active:scale-[0.88] data-[on]:text-star data-[on]:[&_svg]:fill-star",
      type: "button",
      "aria-pressed": String(on),
      "aria-label": `${tool.name}: ${on ? "remove from favorites" : "add to favorites"}`,
      onclick: (event) => {
        event.preventDefault();
        event.stopPropagation();
        const now = toggleFavorite(tool.id);
        if (now) btn.dataset.on = "";
        else delete btn.dataset.on;
        btn.setAttribute("aria-pressed", String(now));
        onToggle?.(now);
      },
    },
    icon("star")
  );
  if (on) btn.dataset.on = "";
  return btn;
}

function toolCard(tool) {
  const category = getCategory(tool.category);
  return el(
    "a",
    {
      class:
        "relative grid gap-1.5 rounded-r2 border border-orbit bg-deck p-5 no-underline transition-colors duration-150 hover:border-jade",
      href: toolHref(tool),
      dataset: { tool: "", haystack: `${tool.name} ${tool.note} ${tool.keywords ?? ""}`.toLowerCase() },
    },
    el(
      "div",
      { class: "flex items-center gap-3" },
      el("span", { class: "grid size-[42px] flex-none place-items-center rounded-[13px] bg-jade-soft text-jade [&_svg]:size-[21px]" }, icon(tool.icon)),
      el("span", { class: "text-md font-semibold tracking-[-0.01em]" }, tool.name)
    ),
    el("span", { class: "min-h-11 text-pretty text-sm text-ink-2" }, tool.note),
    el("span", { class: "mt-1.5 flex items-center gap-2 text-2xs font-semibold text-ink-3" }, category?.name ?? "")
  );
}

function toolRow(tool, onToggle) {
  return el(
    "li",
    {
      class: "flex items-center border-b border-orbit last:border-b-0",
      dataset: { tool: "", href: toolHref(tool), haystack: `${tool.name} ${tool.note} ${tool.keywords ?? ""}`.toLowerCase() },
    },
    el(
      "a",
      { class: "grid min-w-0 flex-1 gap-px py-[13px] pe-1.5 ps-[18px] no-underline", href: toolHref(tool) },
      el("span", { class: "text-md font-semibold tracking-[-0.01em]" }, tool.name),
      el("span", { class: "text-sm text-ink-2" }, tool.note)
    ),
    starButton(tool, onToggle)
  );
}

function filterBar(placeholder = "Search tools") {
  const input = el("input", {
    class: "h-[calc(var(--ctl)+12px)] min-w-0 flex-1 border-0 bg-transparent text-md placeholder:text-ink-3 focus:outline-none",
    dataset: { filter: "" },
    type: "search",
    placeholder,
    "aria-label": placeholder,
    autocomplete: "off",
    spellcheck: "false",
  });
  return el(
    "form",
    {
      class: "mt-[clamp(22px,4vw,36px)] flex items-center gap-2.5 rounded-r2 border border-orbit bg-deck px-3.5 transition-colors duration-150 focus-within:border-jade",
      role: "search",
      onsubmit: (event) => event.preventDefault(),
    },
    el("span", { class: "flex text-ink-3" }, icon("search")),
    input,
    el("kbd", { class: KBD }, "/")
  );
}

/** Live filters the `[data-tool]` cards and rows already in the tree. */
function wireFilter(root, meta) {
  const input = root.querySelector("[data-filter]");
  if (!input) return;
  const run = () => {
    const query = input.value.trim().toLowerCase();
    let shown = 0;
    for (const item of root.querySelectorAll("[data-tool]")) {
      const hay = item.dataset.haystack ?? item.textContent.toLowerCase();
      const hit = !query || hay.includes(query);
      item.hidden = !hit;
      if (hit) shown++;
    }
    for (const section of root.querySelectorAll("[data-group]")) {
      const any = [...section.querySelectorAll("[data-tool]")].some((item) => !item.hidden);
      section.hidden = !any;
    }
    meta.textContent = query ? `${shown} of ${TOOLS.length} tools` : `${TOOLS.length} tools`;
  };
  input.addEventListener("input", run);
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const first = [...root.querySelectorAll("[data-tool]")].find((item) => !item.hidden);
    if (first) {
      const href = first.tagName === "A" ? first.getAttribute("href") : first.dataset.href;
      go(href.slice(1));
    }
  });
  run();
}

// ---------- pages ----------

function homePage() {
  const hero = el(
    "section",
    { class: "relative overflow-hidden border-b border-orbit" },
    el(
      "div",
      { class: "mx-[var(--margin)] grid items-center gap-[clamp(24px,5vw,48px)] py-[clamp(36px,7vw,68px)] min-[60rem]:grid-cols-[minmax(0,1fr)_auto]" },
      el(
        "div",
        {},
        el("h1", { class: "max-w-[20ch] text-balance text-hero font-bold tracking-[-0.03em]" }, "Small tools, one page each."),
        el(
          "div",
          { class: "mt-[clamp(22px,3vw,30px)] flex flex-wrap gap-2.5" },
          button("Search tools", { icon: "search", kind: "fill", onclick: () => openPalette() }),
          el("a", { class: LINK_PLAIN, href: "#/tools" }, icon("shuffle"), el("span", {}, "Browse all"))
        )
      ),
      el("div", { class: "grid place-items-center rounded-[28px] border border-orbit bg-deck-2 p-6 max-[60rem]:hidden" },
        el("img", { class: "block size-[220px]", src: "./icon.png", alt: "", width: "220", height: "220" }))
    )
  );

  const popular = [
    "password-generator", "qr-generator", "spin-wheel",
    "uuid-generator", "base64", "name-picker",
  ].map((id) => TOOLS.find((tool) => tool.id === id)).filter(Boolean);

  const section = (title, iconName, more, tools, group) =>
    el(
      "section",
      { class: "pt-[clamp(32px,5vw,60px)]", dataset: { group } },
      el(
        "div",
        { class: "mb-4 flex items-baseline gap-3" },
        el("h2", { class: "flex items-center gap-2.5 text-lg font-bold tracking-[-0.02em]" }, icon(iconName, "size-[22px] flex-none text-jade"), title),
        more
      ),
      el("div", { class: "grid grid-cols-1 gap-[var(--gutter)] sm:grid-cols-2 lg:grid-cols-3" }, ...tools.map(toolCard))
    );

  const grid = el("div", { class: "px-[var(--margin)]" },
    section("Popular", "star", el("a", { class: "ms-auto text-sm font-semibold text-jade no-underline hover:underline", href: "#/tools" }, "All tools"), popular, "popular"),
    ...CATEGORIES.slice(0, 4).map((category) =>
      section(
        category.name,
        category.icon,
        el("a", { class: "ms-auto text-sm font-semibold text-jade no-underline hover:underline", href: `#/${category.id}` }, `Open ${category.name.toLowerCase()}`),
        toolsInCategory(category.id).slice(0, 3),
        category.id
      )
    )
  );

  document.title = "mevebu · small tools that run in your browser";
  return el("div", {}, hero, grid);
}

function toolsPage() {
  const meta = el("p", { class: "m-0" }, `${TOOLS.length} tools`);

  const groups = CATEGORIES.map((category) =>
    el(
      "section",
      { class: SECTION, dataset: { group: category.id } },
      el(
        "div",
        { class: SECTION_HEAD },
        el("h2", { class: SECTION_TITLE }, icon(category.icon, "size-[22px] flex-none text-jade"),
          category.name, el("span", { class: SECTION_COUNT }, toolsInCategory(category.id).length)),
        el("a", { class: SECTION_MORE, href: `#/${category.id}` }, "Open")
      ),
      el("div", { class: GRID }, ...toolsInCategory(category.id).map(toolCard))
    )
  );

  const page = el(
    "div",
    { class: PAGE },
    el("h1", { class: LEAD }, "All tools."),
    filterBar("Search here"),
    el("div", { class: "mt-2.5 flex min-h-[22px] items-baseline gap-3.5 text-sm text-ink-3" }, meta),
    ...groups
  );
  wireFilter(page, meta);
  document.title = "Tools · mevebu";
  return page;
}

function categoriesPage() {
  const grid = el(
    "div",
    { class: GRID },
    ...CATEGORIES.map((category) =>
      el(
        "a",
        {
          class: "relative grid gap-1.5 rounded-r2 border border-orbit bg-deck p-5 no-underline transition-colors duration-150 hover:border-jade",
          href: `#/${category.id}`,
        },
        el(
          "div",
          { class: "flex items-center gap-3" },
          el("span", { class: "grid size-[42px] flex-none place-items-center rounded-[13px] bg-jade-soft text-jade [&_svg]:size-[21px]" }, icon(category.icon)),
          el("span", { class: "text-md font-semibold tracking-[-0.01em]" }, category.name)
        ),
        el("span", { class: "min-h-11 text-pretty text-sm text-ink-2" }, `${toolsInCategory(category.id).length} tools inside.`),
        el("span", { class: "mt-1.5 flex items-center gap-2 text-2xs font-semibold text-ink-3" }, "Open category")
      )
    )
  );

  document.title = "Categories · mevebu";
  return el(
    "div",
    { class: PAGE_NARROW },
    el("h1", { class: LEAD }, "Browse by category."),
    el("section", { class: SECTION }, grid)
  );
}

function favoritesPage() {
  const favorites = getFavorites();
  const saved = TOOLS.filter((tool) => favorites.has(tool.id));
  document.title = "Favorites · mevebu";
  return el(
    "div",
    { class: PAGE_NARROW },
    el("h1", { class: LEAD }, saved.length ? "Your favorites." : "No favorites yet."),
    saved.length
      ? el("p", { class: LEDE }, "Tap the star on any tool to add or remove it. Saved in this browser only.")
      : el("p", { class: LEDE },
        "Tap the star on any tool to keep it here. ",
        el("a", { class: TEXT_LINK, href: "#/tools" }, "Browse the tools")),
    el("section", { class: SECTION },
      el("ul", { class: "m-0 grid list-none overflow-clip rounded-r2 border border-orbit bg-deck p-0" }, ...saved.map((tool) => toolRow(tool, rerenderFavorites))))
  );
}

function categoryPage(category) {
  const tools = toolsInCategory(category.id);
  document.title = `${category.name} · mevebu`;
  return el(
    "div",
    { class: PAGE_NARROW },
    el("h1", { class: LEAD }, category.name),
    el("p", { class: LEDE }, `${tools.length} tools. Pick a card to open it.`),
    el("section", { class: SECTION },
      el("div", { class: GRID }, ...tools.map(toolCard)))
  );
}

// ---------- tool page ----------

let activeTool = null;
let navToken = 0;

let repaint = () => {};
const rerenderFavorites = () => {
  if (currentPath() === "/favorites") repaint();
};

function benchHead(tool, category) {
  const parent = category ? { href: `#/${category.id}`, label: category.name } : { href: "#/tools", label: "Tools" };
  const helpButton = el("button", {
    class:
      "inline-flex size-[var(--ctl)] flex-none cursor-pointer items-center justify-center rounded-full border border-orbit bg-deck-2 font-sans text-base font-bold text-ink-2 transition-colors duration-150 hover:border-orbit-hard hover:bg-deck hover:text-ink",
    type: "button",
    "aria-label": `How to use ${tool.name}`,
    "aria-haspopup": "dialog",
    title: `How to use ${tool.name}`,
    onclick: () => openHelp(tool),
  }, "?");
  return el(
    "div",
    { class: "mt-[clamp(24px,4vw,44px)] mb-[clamp(22px,3vw,32px)]" },
    el("a", { class: "mb-4 inline-flex items-center gap-[7px] text-sm font-medium text-ink-2 no-underline hover:text-ink", href: parent.href }, icon("arrow-left"), parent.label),
    el("div", { class: "flex items-start gap-2" },
      el("h1", { class: "flex-1 text-balance text-title font-bold tracking-[-0.025em]" }, tool.name),
      el("div", { class: "flex items-center gap-0.5 pt-1" }, helpButton, starButton(tool))),
    el("p", { class: "mt-2 mb-0 max-w-[58ch] text-pretty text-md text-ink-2" }, tool.about)
  );
}

function moreFromMev(tool) {
  const sameCat = toolsInCategory(tool.category).filter((t) => t.id !== tool.id);
  const otherCat = TOOLS.filter((t) => t.id !== tool.id && t.category !== tool.category);
  const samePicks = shuffle(sameCat).slice(0, 3);
  const needed = 6 - samePicks.length;
  const otherPicks = shuffle(otherCat).slice(0, Math.max(3, needed));
  const picks = [...samePicks, ...otherPicks];
  if (!picks.length) return null;

  return el(
    "section",
    { class: "mt-[clamp(40px,6vw,72px)]" },
    el("h2", { class: "mb-2.5 text-sm font-bold text-ink-3" }, "More from mevebu"),
    el("div", { class: GRID }, ...picks.map((t) => toolCard(t)))
  );
}

async function toolPage(tool, category) {
  const token = ++navToken;
  const slot = el("div", {});
  const more = moreFromMev(tool);

  const container = el(
    "div",
    { class: PAGE_NARROW },
    benchHead(tool, category),
    slot,
    more
  );

  document.title = `${tool.name} · mevebu`;

  try {
    const module = await tool.load();
    if (token !== navToken) return null;
    const factory = module.default ?? module;
    if (typeof factory.mount !== "function") throw new Error("no mount()");
    activeTool = factory.mount(slot) ?? {};
  } catch (error) {
    console.error(`[mevebu] ${tool.id} failed`, error);
    if (token !== navToken) return null;
    const failed = toolcard({ body: blank("circle-alert", `${tool.name} could not be loaded.`) });
    slot.append(failed.node);
  }

  return container;
}

function aboutPage() {
  const block = (title, ...nodes) =>
    el("section", { class: ABOUT_BLOCK }, el("h2", { class: "text-lg font-bold tracking-[-0.01em]" }, title), ...nodes);

  document.title = "About · mevebu";
  return el(
    "div",
    { class: PAGE_NARROW },
    el("h1", { class: LEAD }, "About mevebu"),
    el("p", { class: LEDE },
      `mevebu is ${TOOLS.length} small tools that run in your browser. Each one has its own page and does a single job.`),

    block("Running it",
      el("p", {}, "Install it once from npm. The command starts a local server and opens your browser at the address it prints."),
      el("pre", { class: "m-0 overflow-x-auto rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3 font-mono text-sm" }, "npm install -g mevebu\nmevebu"),
      el("p", {}, "Serve the ", el("code", { class: CODE }, "mevebu/"), " folder from any static host. Routes are hash routes, so no rewrite rules are needed.")),

    block("Adding a tool",
      el("p", {}, "Add one object to ", el("code", { class: CODE }, "mevebu/libs/js/registry.js"), " and one file in ", el("code", { class: CODE }, "mevebu/libs/js/tools/"), ". The home page, the index, the categories, search and the route all come from that entry.")),

    block("Built with",
      el("p", {}, "Hand written HTML, CSS and JavaScript, with Tailwind for the stylesheet. Icons are Lucide and the QR decoder is jsQR."),
      el("p", {}, "Source and issues: ",
        el("a", { class: TEXT_LINK, href: REPO_URL, target: "_blank", rel: "noopener" }, "github.com/mevebu/mevebu")),
      el("p", {}, copyButton(() => location.href, "Copy this page link")))
  );
}

function notFound() {
  document.title = "Page not found · mevebu";
  return el(
    "div",
    { class: PAGE_NARROW },
    el("h1", { class: LEAD }, "That page is not here."),
    el("p", { class: LEDE }, "Check the address, or pick a tool from the index."),
    el("p", {}, el("a", { class: TEXT_LINK, href: "#/" }, "Go home"))
  );
}

// ---------- routes ----------

function closeTool() {
  if (activeTool?.unmount) {
    try {
      activeTool.unmount();
    } catch (error) {
      console.error("[mevebu] unmount failed", error);
    }
  }
  activeTool = null;
  navToken++;
}

route("/", () => {
  closeTool();
  return homePage();
});

route("/tools", () => {
  closeTool();
  return toolsPage();
});

route("/categories", () => {
  closeTool();
  return categoriesPage();
});

route("/favorites", () => {
  closeTool();
  return favoritesPage();
});

route("/about", () => {
  closeTool();
  return aboutPage();
});

route("/:category", ({ category }) => {
  closeTool();
  const found = getCategory(category);
  if (!found) return notFound();
  return categoryPage(found);
});

route("/:category/:id", ({ category, id }) => {
  closeTool();
  const tool = getTool(id);
  if (!tool || tool.category !== category) return notFound();
  return toolPage(tool, getCategory(category));
});

// ---------- boot ----------

function markActiveNav(path) {
  for (const link of $$("a[data-path]")) {
    const active = link.dataset.path === path;
    if (active) link.dataset.on = "";
    else delete link.dataset.on;
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

// Scroll is remembered per route, but only a back or forward navigation restores
// it. Clicking a link to a route you have visited before still starts at the top.
//
// A popstate flag is not reliable here, because setting location.hash can fire
// popstate too. history.state is: the browser replays the exact state object it
// stored for that entry on back and forward, so a marker written when the entry
// was created reads back true only on a history move.
const scrollMemory = new Map();
let activePath = null;
let historyMove = false;

async function render(path) {
  const restoring = historyMove;
  historyMove = false;
  repaint = () => render(path);
  const found = match(path);
  const node = found ? await found.handler(found.params, path) : notFound();
  if (!node) return;
  $("#view").replaceChildren(node);
  markActiveNav(["/", "/tools", "/categories", "/about"].includes(path) ? path : "");
  activePath = path;
  window.scrollTo({ top: restoring ? scrollMemory.get(path) ?? 0 : 0 });
  if (!history.state?.mevebu) history.replaceState({ mevebu: true }, "", location.href);
}

window.addEventListener("hashchange", () => {
  if (activePath) scrollMemory.set(activePath, window.scrollY);
});

// A history move replays the state stored for that entry, which this app tags
// with mevebu. A plain hash change carries no such state.
window.addEventListener("popstate", (event) => {
  historyMove = Boolean(event.state?.mevebu);
});

function mountShell() {
  $("#app").append(masthead(), el("main", { class: "flex-1 outline-none", id: "view", tabindex: "-1" }), footer());
}

function startStarCount() {
  const node = $("#starcount");
  if (!node) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  fetch("https://api.github.com/repos/mevebu/mevebu", { signal: controller.signal })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      clearTimeout(timer);
      const count = data?.stargazers_count;
      if (typeof count === "number") node.textContent = count.toLocaleString("en");
    })
    .catch(() => {
      /* offline: the link still works, the count stays empty */
    });
}

function globalKeys() {
  document.addEventListener("keydown", (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
      const field = $("[data-filter]");
      if (!field) return;
      event.preventDefault();
      field.focus();
      field.select();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openPalette();
    }
  });
}

mountShell();
globalKeys();
startStarCount();
startVersionChip();
start(render);