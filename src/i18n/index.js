// ============================================================
// mevebu — i18n (lightweight, JSON-ish dictionaries)
// Default: English. Tambah bahasa = tambah entri di DICTS.
// Tool names/descriptions stay English in the registry for now;
// translating them per-locale is a later data migration.
// ============================================================

import { getTool, getCategory } from "../tools/registry.js";

const en = {
  "nav.favorites": "Favorites",
  "nav.categories": "Categories",
  "nav.about": "About",
  "hero.title1": "Tiny tools that",
  "hero.title2": "just work.",
  "search.placeholder": "Search tools, categories…",
  "catalog.all": "All tools",
  "catalog.count": "{n} tools",
  "empty": "Nothing here yet. Try another category or search for something.",
  "tool.back": "Back to all tools",
  "tool.fav.add": "Add to favorites",
  "tool.fav.remove": "Remove from favorites",
  "docs.purpose": "What it does",
  "docs.howto": "How to use",
  "docs.example": "Example",
  "docs.faq": "FAQ",
  "workspace.empty": "Tool workspace — empty template, ready to be wired up.",
};

const id = {
  "nav.favorites": "Favorit",
  "nav.categories": "Kategori",
  "nav.about": "Tentang",
  "hero.title1": "Tools kecil yang",
  "hero.title2": "langsung jalan.",
  "search.placeholder": "Cari tools, kategori…",
  "catalog.all": "Semua tools",
  "catalog.count": "{n} tools",
  "empty": "Belum ada apa-apa di sini. Coba kategori lain atau cari sesuatu.",
  "tool.back": "Kembali ke semua tools",
  "tool.fav.add": "Tambah ke favorit",
  "tool.fav.remove": "Hapus dari favorit",
  "docs.purpose": "Fungsi",
  "docs.howto": "Cara pakai",
  "docs.example": "Contoh",
  "docs.faq": "FAQ",
  "workspace.empty": "Ruang kerja tool — template kosong, siap dipasang.",
};

const es = {
  "nav.favorites": "Favoritos",
  "nav.categories": "Categorías",
  "nav.about": "Acerca de",
  "hero.title1": "Mini herramientas que",
  "hero.title2": "simplemente funcionan.",
  "search.placeholder": "Buscar herramientas, categorías…",
  "catalog.all": "Todas las herramientas",
  "catalog.count": "{n} herramientas",
  "empty": "Nada por aquí todavía. Prueba otra categoría o busca algo.",
  "tool.back": "Volver a todas",
  "tool.fav.add": "Añadir a favoritos",
  "tool.fav.remove": "Quitar de favoritos",
  "docs.purpose": "Qué hace",
  "docs.howto": "Cómo usar",
  "docs.example": "Ejemplo",
  "docs.faq": "Preguntas frecuentes",
  "workspace.empty": "Área de trabajo — plantilla vacía, lista para conectar.",
};

export const DICTS = { en, id, es };
export const LANGS = [
  { code: "en", label: "🇬🇧 English" },
  { code: "id", label: "🇮🇩 Bahasa Indonesia" },
  { code: "es", label: "🇪🇸 Español" },
];

const LS_KEY = "mevebu.lang";
let current = localStorage.getItem(LS_KEY) || "en";
if (!DICTS[current]) current = "en";

export function setLang(code) {
  current = DICTS[code] ? code : "en";
  localStorage.setItem(LS_KEY, current);
  document.documentElement.lang = current;
}

export function getLang() {
  return current;
}

export function t(key, vars = {}) {
  let s = DICTS[current]?.[key] ?? DICTS.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

// translate static chrome nodes marked with data-i18n
export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
}
