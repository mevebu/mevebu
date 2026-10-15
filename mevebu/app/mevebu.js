// mevebu, the framework: the shell (header, view, footer), the hash router
// wiring, the home page, the tool index, and the bench a tool mounts into.

import { CATEGORIES, TOOLS, getTool, getCategory, toolsInCategory, toolHref } from "../libs/js/registry.js";
import { route, start, match, currentPath, go } from "../libs/js/router.js";
import {
  $, $$, el, icon, getFavorites, isFavorite, toggleFavorite, setTheme,
  modal, button, copyButton, openPalette, shuffle, toolcard,
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

function searchButton() {
  const btn = el(
    "button",
    {
      class: "mvb-searchbtn",
      type: "button",
      "aria-label": "Search tools (Ctrl K)",
      onclick: () => openPalette(),
    },
    icon("search"),
    el("span", { class: "mvb-searchbtn__txt" }, "Search"),
    el("kbd", { class: "mvb-searchbtn__key" }, "⌘K")
  );
  return btn;
}

function masthead() {
  const menuBtn = el(
    "button",
    { class: "mvb-icobtn mvb-bar__menu", type: "button", "aria-expanded": "false", "aria-controls": "mvb-navsheet", "aria-label": "Menu" },
    icon("menu")
  );

  const sheet = el(
    "div",
    { class: "mvb-sheet", id: "mvb-navsheet", hidden: true },
    el(
      "nav",
      { class: "mvb-sheet__nav", "aria-label": "Site" },
      ...NAV.map((item) => el("a", { class: "mvb-sheet__link", href: `#${item.path}` }, item.label)),
      el("a", { class: "mvb-sheet__link", href: REPO_URL, target: "_blank", rel: "noopener" }, "GitHub"),
      el("button", { class: "mvb-sheet__link mvb-sheet__action", type: "button", onclick: () => openPalette() },
        icon("search"), el("span", {}, "Search tools"))
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

  const themeBtn = el("button", { class: "mvb-icobtn", type: "button", "aria-label": "Switch theme" }, icon("moon"));
  themeBtn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
    themeBtn.replaceChildren(icon(next === "dark" ? "sun" : "moon"));
  });

  const nav = el(
    "nav",
    { class: "mvb-nav", "aria-label": "Site" },
    ...NAV.map((item) =>
      el("a", { class: "mvb-nav__link", href: `#${item.path}`, dataset: { path: item.path } }, item.label)
    )
  );

  return el(
    "header",
    { class: "mvb-bar" },
    el(
      "div",
      { class: "mvb-bar__in" },
      el("a", { class: "mvb-mark", href: "#/" },
        el("img", { src: "./icon.png", alt: "", width: "30", height: "30" }), "mevebu"),
      nav,
      el("div", { class: "mvb-bar__end" }, searchButton(), themeBtn, menuBtn)
    ),
    sheet
  );
}

function openHelp(tool) {
  const category = getCategory(tool.category);
  const body = [
    el("div", { class: "mvb-help__head" },
      el("span", { class: "mvb-help__sigil" }, icon(tool.icon)),
      el("h2", { class: "mvb-help__title" }, tool.name)),
    el("p", { class: "mvb-help__note" }, tool.tutorial?.intro ?? tool.about),
    el("ol", { class: "mvb-help__steps" },
      ...(tool.tutorial?.steps ?? []).map((step) => el("li", {}, step))),
    el("p", { class: "mvb-help__note" },
      "Open the tool: ",
      el("a", { class: "mvb-link", href: toolHref(tool) }, toolHref(tool).slice(1))),
  ];
  modal({
    label: `${tool.name} how to use it`,
    body,
    actions: [
      el("a", { class: "mvb-btn mvb-btn--fill", href: toolHref(tool) },
        icon("play"), el("span", {}, `Open ${tool.name}`)),
    ],
    veilClass: "mvb-veil--help",
  });
}

function openDonate() {
  const close = modal({
    label: "Support mevebu",
    body: [
      el("div", { class: "mvb-modal__art" }, el("img", { src: "./icon.png", alt: "", width: "88", height: "88" })),
      el("h2", { class: "mvb-modal__title" }, "Keep mevebu flying"),
      el("p", {}, "mevebu is free and runs entirely in your browser. No accounts, no ads, nothing to sell."),
      el("p", {}, "If a tool here saved you time, a coffee keeps the next one coming."),
    ],
    actions: [
      el("a", { class: "mvb-btn mvb-btn--fill", href: DONATE_URL, target: "_blank", rel: "noopener" },
        icon("coffee"), el("span", {}, "Buy me a coffee")),
      button("Not now", { onclick: () => close() }),
    ],
  });
}

// `latest` is the published version, or null when the check could not run.
function openUpdate(latest) {
  const updatable = latest && compareVersions(latest, VERSION) > 0;
  const command = updateCommand();

  const commandBox = el(
    "div",
    { class: "mvb-cmd" },
    el("code", { class: "mvb-cmd__text" }, command),
    copyButton(() => command, "Copy command", "fill")
  );

  modal({
    label: "Update mevebu",
    body: [
      el("div", { class: "mvb-modal__art" }, el("img", { src: "./icon.png", alt: "", width: "72", height: "72" })),
      el("h2", { class: "mvb-modal__title" }, updatable ? `mevebu ${latest} is out` : "mevebu is up to date"),
      updatable
        ? el("p", {}, "A newer version is published. Update your global install, then run ", el("code", {}, PACKAGE_NAME), " again.")
        : el("p", {}, "You are on the latest version. Nothing to do."),
      el("div", { class: "mvb-vers" },
        el("div", { class: "mvb-vers__row" },
          el("span", { class: "mvb-vers__label" }, "Installed"),
          el("span", { class: "mvb-vers__val" }, VERSION)),
        el("div", { class: "mvb-vers__row" + (updatable ? " mvb-vers__row--new" : "") },
          el("span", { class: "mvb-vers__label" }, "Latest"),
          el("span", { class: "mvb-vers__val" }, latest ?? "—"))),
      updatable ? el("p", { class: "mvb-vers__hint" }, "Copy the command below and run it in your terminal.") : null,
      updatable ? commandBox : null,
    ],
    actions: updatable
      ? [el("a", { class: "mvb-btn", href: `${REPO_URL}/releases/tag/v${latest}`, target: "_blank", rel: "noopener" }, "What changed")]
      : [],
    veilClass: "mvb-veil--help",
  });
}

// ---------- version ----------

// The footer chip shows the current version. When npm reports a newer one, the
// chip turns into an "update" button and the modal explains how to upgrade.
async function startVersionChip() {
  const chip = $("#mvb-version");
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
    chip.classList.add("mvb-version--new");
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
    onclick: (event) => {
      event.preventDefault();
      openDonate();
    },
  });

  return el(
    "footer",
    { class: "mvb-foot" },
    el(
      "div",
      { class: "mvb-foot__in" },
      el(
        "div",
        { class: "mvb-foot__top" },
        el(
          "div",
          { class: "mvb-foot__brand" },
          el("a", { class: "mvb-foot__mark", href: "#/" },
            el("img", { src: "./icon.png", alt: "", width: "34", height: "34" }), "mevebu"),
          el("p", { class: "mvb-foot__tag" }, "Small tools that run in your browser. No accounts, no uploads, no tracking.")
        ),
        el(
          "nav",
          { class: "mvb-foot__nav", "aria-label": "Site" },
          el(
            "div",
            {},
            el("h4", {}, "Browse"),
            el("ul", {},
              el("li", {}, el("a", { href: "#/tools" }, "All tools")),
              el("li", {}, el("a", { href: "#/categories" }, "Categories")),
              el("li", {}, el("a", { href: "#/favorites" }, "Favorites"))
            )
          ),
          el(
            "div",
            {},
            el("h4", {}, "Project"),
            el("ul", {},
              el("li", {}, el("a", { href: "#/about" }, "About")),
              el("li", {}, el("a", { href: REPO_URL, target: "_blank", rel: "noopener" }, "GitHub")),
              el("li", {}, donate)
            )
          )
        )
      ),
      el(
        "div",
        { class: "mvb-foot__bottom" },
        el("p", { class: "mvb-foot__legal" }, "MIT licensed."),
        el(
          "p",
          { class: "mvb-foot__legal" },
          "Source: ",
          el("a", { href: REPO_URL, target: "_blank", rel: "noopener" }, "github.com/mevebu/mevebu"),
          el("span", { class: "mvb-foot__count", id: "mvb-starcount" })
        ),
        el(
          "p",
          { class: "mvb-foot__legal" },
          el("button", {
            class: "mvb-version",
            id: "mvb-version",
            type: "button",
            title: "Check for updates",
          }, "—")
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
      class: "mvb-star" + (on ? " mvb-on" : ""),
      type: "button",
      "aria-pressed": String(on),
      "aria-label": `${tool.name}: ${on ? "remove from favorites" : "add to favorites"}`,
      onclick: (event) => {
        event.preventDefault();
        event.stopPropagation();
        const now = toggleFavorite(tool.id);
        btn.classList.toggle("mvb-on", now);
        btn.setAttribute("aria-pressed", String(now));
        onToggle?.(now);
      },
    },
    icon("star")
  );
  return btn;
}

function toolCard(tool) {
  const category = getCategory(tool.category);
  return el(
    "a",
    {
      class: "mvb-card",
      href: toolHref(tool),
      dataset: { haystack: `${tool.name} ${tool.note} ${tool.keywords ?? ""}`.toLowerCase() },
    },
    el(
      "div",
      { class: "mvb-card__top" },
      el("span", { class: "mvb-card__sigil" }, icon(tool.icon)),
      el("span", { class: "mvb-card__name" }, tool.name)
    ),
    el("span", { class: "mvb-card__note" }, tool.note),
    el("span", { class: "mvb-card__foot" }, category?.name ?? "")
  );
}

function toolRow(tool, onToggle) {
  return el(
    "li",
    {
      class: "mvb-row",
      dataset: { href: toolHref(tool), haystack: `${tool.name} ${tool.note} ${tool.keywords ?? ""}`.toLowerCase() },
    },
    el(
      "a",
      { class: "mvb-row__link", href: toolHref(tool) },
      el("span", { class: "mvb-row__name" }, tool.name),
      el("span", { class: "mvb-row__note" }, tool.note)
    ),
    starButton(tool, onToggle)
  );
}

function filterBar(placeholder = "Search tools") {
  const input = el("input", {
    class: "mvb-filter__in",
    type: "search",
    placeholder,
    "aria-label": placeholder,
    autocomplete: "off",
    spellcheck: "false",
  });
  return el(
    "form",
    { class: "mvb-filter", role: "search", onsubmit: (event) => event.preventDefault() },
    el("span", { class: "mvb-filter__icon" }, icon("search")),
    input,
    el("kbd", { class: "mvb-filter__key" }, "/")
  );
}

/** Live filters `.mvb-card` grids and `.mvb-rows` lists already in the tree. */
function wireFilter(root, meta) {
  const input = root.querySelector(".mvb-filter__in");
  if (!input) return;
  const run = () => {
    const query = input.value.trim().toLowerCase();
    let shown = 0;
    for (const item of root.querySelectorAll(".mvb-card, .mvb-row")) {
      const hay = item.dataset.haystack ?? item.textContent.toLowerCase();
      const hit = !query || hay.includes(query);
      item.hidden = !hit;
      if (hit) shown++;
    }
    for (const section of root.querySelectorAll("[data-mvb-group]")) {
      const any = [...section.querySelectorAll(".mvb-card, .mvb-row")].some((item) => !item.hidden);
      section.hidden = !any;
    }
    meta.textContent = query ? `${shown} of ${TOOLS.length} tools` : `${TOOLS.length} tools`;
  };
  input.addEventListener("input", run);
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const first = [...root.querySelectorAll(".mvb-card, .mvb-row")].find((item) => !item.hidden);
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
    { class: "mvb-hero" },
    el(
      "div",
      { class: "mvb-hero__in" },
      el(
        "div",
        {},
        el("h1", { class: "mvb-hero__title" }, "Small tools, one page each."),
        el(
          "div",
          { class: "mvb-hero__cta" },
          el("button", { class: "mvb-btn mvb-btn--fill", type: "button", onclick: () => openPalette() },
            icon("search"), el("span", {}, "Search tools")),
          el("a", { class: "mvb-btn mvb-btn--plain", href: "#/tools" }, icon("shuffle"), el("span", {}, "Browse all"))
        )
      ),
      el("div", { class: "mvb-hero__orbit" }, el("img", { src: "./icon.png", alt: "mevebu planet mark", width: "300", height: "300" }))
    )
  );

  const popular = [
    "password-generator", "qr-generator", "spin-wheel",
    "uuid-generator", "base64", "name-picker",
  ].map((id) => TOOLS.find((tool) => tool.id === id)).filter(Boolean);

  const grid = el("div", { class: "mvb-page" },
    el(
      "section",
      { class: "mvb-section", "data-mvb-group": "popular" },
      el(
        "div",
        { class: "mvb-section__head" },
        el("h2", { class: "mvb-section__title" }, icon("star"), "Popular"),
        el("a", { class: "mvb-section__more", href: "#/tools" }, "All tools")
      ),
      el("div", { class: "mvb-grid" }, ...popular.map(toolCard))
    ),
    ...CATEGORIES.slice(0, 4).map((category) =>
      el(
        "section",
        { class: "mvb-section", "data-mvb-group": category.id },
        el(
          "div",
          { class: "mvb-section__head" },
          el("h2", { class: "mvb-section__title" }, icon(category.icon), category.name),
          el("a", { class: "mvb-section__more", href: `#/${category.id}` }, `Open ${category.name.toLowerCase()}`)
        ),
        el("div", { class: "mvb-grid" }, ...toolsInCategory(category.id).map(toolCard))
      )
    )
  );

  document.title = "mevebu · small tools that run in your browser";
  return el("div", {}, hero, grid);
}

function toolsPage() {
  const meta = el("p", {}, `${TOOLS.length} tools`);

  const groups = CATEGORIES.map((category) =>
    el(
      "section",
      { class: "mvb-section", "data-mvb-group": category.id },
      el(
        "div",
        { class: "mvb-section__head" },
        el("h2", { class: "mvb-section__title" }, icon(category.icon),
          category.name, el("span", { class: "mvb-section__count" }, toolsInCategory(category.id).length)),
        el("a", { class: "mvb-section__more", href: `#/${category.id}` }, "Open")
      ),
      el("div", { class: "mvb-grid" }, ...toolsInCategory(category.id).map(toolCard))
    )
  );

  const page = el(
    "div",
    { class: "mvb-page mvb-page--narrow" },
    filterBar("Search here"),
    el("div", { class: "mvb-filter__meta" }, meta),
    ...groups
  );
  wireFilter(page, meta);
  document.title = "Tools · mevebu";
  return page;
}

function categoriesPage() {
  const grid = el(
    "div",
    { class: "mvb-grid" },
    ...CATEGORIES.map((category) =>
      el(
        "a",
        { class: "mvb-card", href: `#/${category.id}` },
        el(
          "div",
          { class: "mvb-card__top" },
          el("span", { class: "mvb-card__sigil" }, icon(category.icon)),
          el("span", { class: "mvb-card__name" }, category.name)
        ),
        el("span", { class: "mvb-card__note" }, `${toolsInCategory(category.id).length} tools inside.`),
        el("span", { class: "mvb-card__foot" }, "Open category")
      )
    )
  );

  document.title = "Categories · mevebu";
  return el(
    "div",
    { class: "mvb-page mvb-page--narrow" },
    el("h1", { class: "mvb-lead" }, "Browse by category."),
    el("section", { class: "mvb-section" }, grid)
  );
}

function favoritesPage() {
  const favorites = getFavorites();
  const saved = TOOLS.filter((tool) => favorites.has(tool.id));
  document.title = "Favorites · mevebu";
  return el(
    "div",
    { class: "mvb-page mvb-page--narrow" },
    el("h1", { class: "mvb-lead" }, saved.length ? "Your favorites." : "No favorites yet."),
    saved.length
      ? el("p", { class: "mvb-lede" }, "Tap the star on any tool to add or remove it. Saved in this browser only.")
      : el("p", { class: "mvb-lede" },
        "Tap the star on any tool to keep it here. ",
        el("a", { class: "mvb-link", href: "#/tools" }, "Browse the tools")),
    el("section", { class: "mvb-section" },
      el("ul", { class: "mvb-rows" }, ...saved.map((tool) => toolRow(tool, rerenderFavorites))))
  );
}

function categoryPage(category) {
  const tools = toolsInCategory(category.id);
  document.title = `${category.name} · mevebu`;
  return el(
    "div",
    { class: "mvb-page mvb-page--narrow" },
    el("h1", { class: "mvb-lead" }, category.name),
    el("p", { class: "mvb-lede" }, `${tools.length} tools. Pick a card to open it.`),
    el("section", { class: "mvb-section" },
      el("div", { class: "mvb-grid" }, ...tools.map(toolCard)))
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
    class: "mvb-helpbtn",
    type: "button",
    "aria-label": `How to use ${tool.name}`,
    "aria-haspopup": "dialog",
    title: `How to use ${tool.name}`,
    onclick: () => openHelp(tool),
  }, "?");
  return el(
    "div",
    { class: "mvb-head" },
    el("a", { class: "mvb-head__back", href: parent.href }, icon("arrow-left"), parent.label),
    el("div", { class: "mvb-head__row" },
      el("h1", { class: "mvb-head__title" }, tool.name),
      el("div", { class: "mvb-head__actions" }, helpButton, starButton(tool))),
    el("p", { class: "mvb-head__about" }, tool.about)
  );
}

function toolFailed(tool) {
  return el("div", { class: "mvb-blank" }, icon("circle-alert", "mvb-ico mvb-ico--lg"), el("p", {}, `${tool.name} could not be loaded.`));
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
    { class: "mvb-more" },
    el("h2", { class: "mvb-more__title" }, "More from mevebu"),
    el("div", { class: "mvb-grid" }, ...picks.map((t) => toolCard(t)))
  );
}

async function toolPage(tool, category) {
  const token = ++navToken;
  const slot = el("div", {});
  const more = moreFromMev(tool);

  const container = el(
    "div",
    { class: "mvb-page mvb-page--tool" },
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
    const failed = toolcard({ body: toolFailed(tool) });
    slot.append(failed.node);
  }

  return container;
}

function aboutPage() {
  const block = (title, ...nodes) =>
    el("section", { class: "mvb-about" }, el("h2", { class: "mvb-about__title" }, title), ...nodes);

  document.title = "About · mevebu";
  return el(
    "div",
    { class: "mvb-page mvb-page--narrow" },
    el("h1", { class: "mvb-lead" }, "About mevebu"),
    el("p", { class: "mvb-lede" },
      `mevebu is ${TOOLS.length} small tools that run in your browser. Each one has its own page and does a single job.`),

    block("Running it",
      el("p", {}, "Install it once from npm. The command starts a local server and opens your browser at the address it prints."),
      el("pre", { class: "mvb-code" }, "npm install -g mevebu\nmevebu"),
      el("p", {}, "Serve the ", el("code", {}, "mevebu/"), " folder from any static host. Routes are hash routes, so no rewrite rules are needed.")),

    block("Adding a tool",
      el("p", {}, "Add one object to ", el("code", {}, "mevebu/libs/js/registry.js"), " and one file in ", el("code", {}, "mevebu/libs/js/tools/"), ". The home page, the index, the categories, search and the route all come from that entry.")),

    block("Built with",
      el("p", {}, "Plain HTML, CSS and JavaScript. No framework, no bundler, no build step. Icons are Lucide and the QR decoder is jsQR."),
      el("p", {}, "Source and issues: ",
        el("a", { class: "mvb-link", href: REPO_URL, target: "_blank", rel: "noopener" }, "github.com/mevebu/mevebu")),
      el("p", {}, copyButton(() => location.href, "Copy this page link")))
  );
}

function notFound() {
  document.title = "Page not found · mevebu";
  return el(
    "div",
    { class: "mvb-page mvb-page--narrow" },
    el("h1", { class: "mvb-lead" }, "That page is not here."),
    el("p", { class: "mvb-lede" }, "Check the address, or pick a tool from the index."),
    el("p", {}, el("a", { class: "mvb-link", href: "#/" }, "Go home"))
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
  for (const link of $$(".mvb-nav__link")) {
    const active = link.dataset.path === path;
    link.classList.toggle("mvb-on", active);
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
  $("#mvb-view").replaceChildren(node);
  markActiveNav(["/", "/tools", "/categories", "/about"].includes(path) ? path : "");
  activePath = path;
  window.scrollTo({ top: restoring ? scrollMemory.get(path) ?? 0 : 0 });
  if (!history.state?.mvb) history.replaceState({ mvb: true }, "", location.href);
}

window.addEventListener("hashchange", () => {
  if (activePath) scrollMemory.set(activePath, window.scrollY);
});

// A history move replays the state stored for that entry, which this app tags
// with mvb. A plain hash change carries no such state.
window.addEventListener("popstate", (event) => {
  historyMove = Boolean(event.state?.mvb);
});

function mountShell() {
  $("#app").append(masthead(), el("main", { class: "mvb-main", id: "mvb-view", tabindex: "-1" }), footer());
}

function startStarCount() {
  const node = $("#mvb-starcount");
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
      const field = $(".mvb-filter__in");
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