// ============================================================
// mevebu — app entry (vanilla JS, no framework)
// ============================================================
import { createIcons, icons } from "lucide";

import { CATEGORIES, TOOLS, getTool, getCategory, toolsByCategory } from "./tools/registry.js";
import { t, applyI18n, setLang, getLang, LANGS } from "./i18n/index.js";
import { route, navigate, startRouter, render as rerender } from "./router.js";
import { loadToolImpl } from "./tools/implementations/index.js";
import { $, $$, el, icon, getFavorites, isFavorite, toggleFavorite, copyText, toast, debounce } from "./lib/dom.js";

const refreshIcons = () => createIcons({ icons });

// ---------- theme ----------
const THEME_KEY = "mevebu.theme";
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
}
function toggleTheme() {
  const cur = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = cur;
  localStorage.setItem(THEME_KEY, cur);
}

// ---------- static chrome refs ----------
const hero = $("#hero");
const catalogSection = $("#catalog");
const toolGrid = $("#toolGrid");
const catalogTitle = $("#catalogTitle");
const catalogCount = $("#catalogCount");
const emptyState = $("#emptyState");
const toolPage = $("#toolPage");

let mountedTool = null; // { unmount?() } of currently mounted tool impl

function showCatalog() {
  toolPage.hidden = true;
  hero.hidden = false;
  catalogSection.hidden = false;
  if (mountedTool?.unmount) { try { mountedTool.unmount(); } catch {} }
  mountedTool = null;
}

function showToolPage() {
  hero.hidden = true;
  catalogSection.hidden = true;
  toolPage.hidden = false;
}

// ---------- cards ----------
function toolCard(tool) {
  const fav = isFavorite(tool.id);
  const favBtn = el(
    "button",
    {
      class: "card__fav" + (fav ? " is-fav" : ""),
      type: "button",
      title: fav ? t("tool.fav.remove") : t("tool.fav.add"),
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const now = toggleFavorite(tool.id);
        favBtn.classList.toggle("is-fav", now);
        favBtn.title = now ? t("tool.fav.remove") : t("tool.fav.add");
        favBtn.setAttribute("aria-pressed", String(now));
        if (getHashIsFavRoute()) rerender();
      },
    },
    icon("star")
  );

  const a = el(
    "a",
    { class: "card", href: `#/${tool.category}/${tool.id}`, "data-nav": true },
    el("div", { class: "card__top" }, el("span", { class: "card__icon" }, icon(tool.icon, "icon-md")), favBtn),
    el("span", { class: "card__name" }, tool.name),
    el("span", { class: "card__desc" }, tool.tagline),
    el("span", { class: "card__cat" }, getCategory(tool.category)?.label ?? tool.category)
  );
  return a;
}

const getHashIsFavRoute = () => location.hash.replace(/^#/, "") === "/favorites";

function renderGrid(tools, { group = false } = {}) {
  toolGrid.innerHTML = "";
  if (!tools.length) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  if (group) {
    for (const cat of CATEGORIES) {
      const inCat = tools.filter((t2) => t2.category === cat.id);
      if (!inCat.length) continue;
      const head = el("h3", { class: "group-title" }, icon(cat.icon), cat.label);
      toolGrid.append(head);
      inCat.forEach((t2) => toolGrid.append(toolCard(t2)));
    }
  } else {
    tools.forEach((t2) => toolGrid.append(toolCard(t2)));
  }
  catalogCount.textContent = t("catalog.count", { n: tools.length });
}

// ---------- routes ----------
route("/", () => {
  showCatalog();
  catalogTitle.textContent = t("catalog.all");
  renderGrid(TOOLS, { group: true });
  setActiveNav("#/");
});

route("/favorites", () => {
  showCatalog();
  const favs = getFavorites();
  catalogTitle.textContent = t("nav.favorites");
  renderGrid(TOOLS.filter((x) => favs.has(x.id)));
  setActiveNav("#/favorites");
});

route("/categories", () => {
  showCatalog();
  catalogTitle.textContent = t("nav.categories");
  renderGrid(TOOLS, { group: true });
  setActiveNav("#/categories");
});

route("/about", () => {
  showCatalog();
  catalogTitle.textContent = t("nav.about");
  toolGrid.innerHTML = "";
  emptyState.hidden = true;
  catalogCount.textContent = "";
  const about = el(
    "div",
    { class: "docs__block", style: "max-width:640px" },
    el("h2", {}, icon("info", "icon-sm"), t("nav.about")),
    el("p", { class: "docs__body" },
      `mevebu is ${TOOLS.length} tiny utilities that run 100% in your browser — no accounts, no uploads, no tracking. It works offline: download it or install via npm and open it anywhere.`),
    el("p", { class: "docs__body", style: "margin-top:10px" },
      "Built with plain HTML/CSS/JS + Vite. MIT licensed."),
    el("div", { class: "hero__cta", style: "justify-content:flex-start;margin-top:14px" },
      el("a", { class: "btn btn--ghost", href: "https://github.com/fastro/mevebu", target: "_blank", rel: "noopener" }, icon("github", "icon-sm"), " GitHub"),
      el("a", { class: "btn btn--accent", href: "https://buymeacoffee.com/fastro", target: "_blank", rel: "noopener" }, icon("coffee", "icon-sm"), " Buy me a coffee"))
  );
  toolGrid.append(about);
  setActiveNav("#/about");
});

route("/:cat/:id", async ({ cat, id }) => {
  const tool = getTool(id);
  if (!tool || tool.category !== cat) return notFound();
  showToolPage();
  document.title = `${tool.name} — mevebu`;

  // breadcrumb
  const category = getCategory(cat);
  const crumbs = $("#toolCrumbs");
  crumbs.innerHTML = "";
  crumbs.append(
    el("a", { href: "#/", "data-nav": true }, t("catalog.all")),
    el("span", { class: "sep" }, "/"),
    el("a", { href: `#/${cat}`, "data-nav": true }, category?.label ?? cat),
    el("span", { class: "sep" }, "/"),
    el("span", { class: "current" }, tool.name)
  );

  // head
  const iconWrap = $("#toolIcon");
  iconWrap.innerHTML = "";
  iconWrap.append(icon(tool.icon, "icon-md"));
  $("#toolTitle").textContent = tool.name;
  $("#toolTagline").textContent = tool.tagline;

  // favorite button
  const favBtn = $("#toolFavBtn");
  const syncFav = () => {
    const on = isFavorite(tool.id);
    favBtn.classList.toggle("is-fav", on);
    favBtn.setAttribute("aria-pressed", String(on));
    favBtn.setAttribute("aria-label", on ? t("tool.fav.remove") : t("tool.fav.add"));
  };
  favBtn.onclick = () => { toggleFavorite(tool.id); syncFav(); };
  syncFav();

  // docs
  $("#docPurpose").textContent = tool.description;
  const howTo = $("#docHowTo");
  howTo.innerHTML = "";
  (tool.howTo || []).forEach((s) => howTo.append(el("li", {}, s)));
  $("#docExample").textContent = tool.example || "—";
  const faq = $("#docFaq");
  faq.innerHTML = "";
  (tool.faq || []).forEach((f) => {
    const q = f.q ?? f[0];
    const a = f.a ?? f[1];
    faq.append(el("details", {}, el("summary", {}, q), el("p", { class: "faq__a" }, a)));
  });

  // workspace — mount implementation (or placeholder)
  const ws = $("#toolWorkspace");
  ws.innerHTML = "";
  const impl = await loadToolImpl(tool.id);
  if (impl && typeof impl.mount === "function") {
    mountedTool = impl;
    impl.mount(ws);
  } else {
    mountedTool = null;
    ws.append(el(
      "div", { class: "workspace__placeholder" },
      icon("wrench", "icon-lg"),
      el("p", {}, t("workspace.empty"))
    ));
  }
  refreshIcons();
  window.scrollTo({ top: 0 });
});

route("/:cat", ({ cat }) => {
  const category = getCategory(cat);
  if (!category) return notFound();
  showCatalog();
  hero.hidden = true;
  catalogTitle.textContent = category.label;
  renderGrid(toolsByCategory(cat));
  setActiveNav("");
});

function notFound() {
  showCatalog();
  catalogTitle.textContent = "404";
  toolGrid.innerHTML = "";
  catalogCount.textContent = "";
  emptyState.hidden = false;
}

// ---------- nav active state ----------
function setActiveNav(href) {
  $$(".topnav__link").forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === href));
}

// ---------- search modal ----------
const searchModal = $("#searchModal");
const searchInput = $("#searchInput");
const searchResults = $("#searchResults");
let searchIdx = -1;

function fuzzyScore(query, text) {
  query = query.toLowerCase();
  text = text.toLowerCase();
  if (text.includes(query)) return 100 - text.indexOf(query);
  // subsequence match
  let qi = 0;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text[ti] === query[qi]) qi++;
  }
  return qi === query.length ? 20 : -1;
}

function search(q) {
  q = q.trim();
  if (!q) return [];
  const out = [];
  for (const tool of TOOLS) {
    const hay = `${tool.name} ${tool.tagline} ${tool.description} ${getCategory(tool.category)?.label ?? ""}`;
    const s = Math.max(fuzzyScore(q, tool.name) * 1.5, fuzzyScore(q, hay));
    if (s > 0) out.push({ kind: "tool", tool, score: s });
  }
  for (const cat of CATEGORIES) {
    const s = fuzzyScore(q, cat.label);
    if (s > 0) out.push({ kind: "cat", cat, score: s });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 12);
}

function renderSearch(q) {
  searchResults.innerHTML = "";
  searchIdx = -1;
  const items = search(q);
  if (!q || !items.length) {
    searchResults.append(el("li", { class: "sres", style: "color:var(--text-faint)" }, q ? t("empty") : "Type to search…"));
    return;
  }
  items.forEach((it) => {
    let node;
    if (it.kind === "tool") {
      node = el(
        "li", { class: "sres", role: "option", tabindex: "-1", "data-href": `#/${it.tool.category}/${it.tool.id}` },
        icon(it.tool.icon), el("span", {}, it.tool.name),
        el("span", { class: "sres__meta" }, getCategory(it.tool.category)?.label ?? "")
      );
    } else {
      node = el(
        "li", { class: "sres", role: "option", tabindex: "-1", "data-href": `#/${it.cat.id}` },
        icon(it.cat.icon), el("span", {}, it.cat.label),
        el("span", { class: "sres__meta" }, t("catalog.count", { n: toolsByCategory(it.cat.id).length }))
      );
    }
    node.addEventListener("click", () => goFromSearch(node.dataset.href));
    searchResults.append(node);
  });
}

function goFromSearch(href) {
  closeSearch();
  location.hash = href;
}

function openSearch() {
  searchModal.hidden = false;
  searchInput.value = "";
  renderSearch("");
  setTimeout(() => searchInput.focus(), 30);
}
function closeSearch() {
  searchModal.hidden = true;
}

searchInput.addEventListener("input", debounce(() => renderSearch(searchInput.value), 80));
searchInput.addEventListener("keydown", (e) => {
  const items = $$(".sres[data-href]", searchResults);
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (!items.length) return;
    searchIdx = (searchIdx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items.forEach((n, i) => n.classList.toggle("is-active", i === searchIdx));
    items[searchIdx].scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter") {
    const target = items[searchIdx] || items[0];
    if (target) goFromSearch(target.dataset.href);
  } else if (e.key === "Escape") {
    closeSearch();
  }
});
$$("[data-close-search]").forEach((n) => n.addEventListener("click", closeSearch));
$("#searchTrigger").addEventListener("click", openSearch);
$("#heroSearchBtn").addEventListener("click", openSearch);
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    searchModal.hidden ? openSearch() : closeSearch();
  } else if (e.key === "Escape" && !searchModal.hidden) {
    closeSearch();
  }
});

// ---------- language dropdown ----------
const langBtn = $("#langBtn");
const langMenu = $("#langMenu");
function renderLangMenu() {
  langMenu.innerHTML = "";
  LANGS.forEach((l) => {
    langMenu.append(el(
      "button",
      {
        class: "dropdown__item" + (l.code === getLang() ? " is-active" : ""),
        type: "button",
        onclick: () => {
          setLang(l.code);
          localStorage.setItem("mevebu.lang", l.code);
          applyI18n(document);
          translateChrome();
          rerender();
          langMenu.hidden = true;
          langBtn.setAttribute("aria-expanded", "false");
        },
      },
      l.label
    ));
  });
}
langBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  langMenu.hidden = !langMenu.hidden;
  langBtn.setAttribute("aria-expanded", String(!langMenu.hidden));
  if (!langMenu.hidden) renderLangMenu();
});
document.addEventListener("click", () => { langMenu.hidden = true; langBtn.setAttribute("aria-expanded", "false"); });

// translate the parts of index.html that aren't handled by data-i18n
function translateChrome() {
  const labels = $$(".topnav__label");
  if (labels.length >= 3) {
    labels[0].textContent = t("nav.favorites");
    labels[1].textContent = t("nav.categories");
    labels[2].textContent = t("nav.about");
  }
  $(".search__placeholder") && ($(".search__placeholder").textContent = t("search.placeholder"));
  searchInput.placeholder = t("search.placeholder");
}

// ---------- mobile burger ----------
const burgerBtn = $("#burgerBtn");
const mobileNav = $("#mobileNav");
burgerBtn.addEventListener("click", () => {
  mobileNav.hidden = !mobileNav.hidden;
});

// ---------- theme button ----------
$("#themeBtn").addEventListener("click", toggleTheme);

// ---------- star count (best-effort, fails silently offline) ----------
(async () => {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch("https://api.github.com/repos/fastro/mevebu", { signal: ctrl.signal });
    clearTimeout(id);
    if (res.ok) {
      const j = await res.json();
      if (typeof j.stargazers_count === "number") {
        $("#starCount").textContent = j.stargazers_count >= 1000
          ? (j.stargazers_count / 1000).toFixed(1).replace(/\.0$/, "") + "k"
          : String(j.stargazers_count);
      }
    }
  } catch {
    /* offline — keep the dash */
  }
})();

// ---------- footer year ----------
$("#year").textContent = new Date().getFullYear();

// ---------- boot ----------
initTheme();
setLang(getLang());
applyI18n(document);
translateChrome();
startRouter();
refreshIcons();
