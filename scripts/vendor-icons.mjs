// Regenerates mevebu/libs/js/icons.js from node_modules/lucide.
// Run with: npm run icons
// Only the icons mevebu actually renders are vendored, so the app ships ~7kb
// instead of the 450kb full lucide bundle.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ICONS = [
  // shell
  "search", "menu", "x", "sun", "moon", "star", "arrow-left", "coffee",
  "external-link", "corner-down-left", "flag", "info", "circle-question-mark", "circle-arrow-up",
  "bug",
  // categories
  "shuffle", "shield-check", "terminal", "repeat", "file-text", "qr-code",
  // tools
  "circle-dashed", "users", "coins", "key-round", "signature",
  "hash", "fingerprint-pattern", "binary", "link", "palette",
  "case-sensitive", "pilcrow", "database", "scan-line",
  // shared tool controls
  "copy", "check", "refresh-cw", "rotate-cw", "download", "upload", "delete", "scissors",
  "arrow-left-right", "trash", "plus", "minus", "camera", "video-off",
  "image-up", "clipboard", "eye", "eye-off", "circle-alert", "triangle-alert",
  "loader", "play", "lock", "wrench", "gauge", "monitor",
  // categories (extended)
  "calendar-days", "graduation-cap", "calculator", "clock", "table",
  "brush", "globe", "book-open", "briefcase", "code", "languages",
  "megaphone", "git-branch",
  // text and writing
  "text-cursor-input", "ruler", "list", "list-minus", "arrow-down-a-z",
  "replace", "eraser", "link-2", "list-plus", "file-diff", "text-search",
  "text-align-start", "square-check", "type", "text-cursor",
  // developer
  "braces", "circle-check", "badge-check", "minimize-2", "shrink",
  "file-code", "regex", "code-xml", "calendar-clock", "paintbrush", "audio-lines",
  "settings-2", "file-key", "send", "webhook", "scan-text",
  // daily use
  "timer", "list-checks", "calendar-plus", "calendar-range", "grid-2x2",
  "target", "users-round", "flame", "clipboard-list",
  // math and time
  "percent", "trending-up", "badge-percent", "tag", "divide", "sigma",
  "superscript", "radical", "list-ordered", "calendar-check", "bell",
  "pause", "square-play", "chart-line", "hand-coins", "scale",
  // date, time, data and lists
  "calendar-minus", "hourglass", "cake", "file-spreadsheet", "table-2",
  "git-merge", "git-compare", "combine", "rows-3", "arrow-right-left",
  // design
  "swatch-book", "pipette", "layers", "blend", "contrast", "ratio",
  "rectangle-horizontal", "square-dashed-bottom", "layout-grid", "scaling",
  "type-outline", "baseline", "grid-3x3", "sliders-horizontal",
  // security
  "shield-alert", "gauge", "clock-alert", "scan-eye", "activity",
  // academic, business, content, units
  "text-quote", "library", "notebook-pen", "shapes", "receipt", "banknote",
  "package", "video", "git-pull-request", "weight", "thermometer",
  "hard-drive", "square-function", "clipboard-check", "circle-check-big",
  "square", "chevron-right",
];

const src = join(root, "node_modules", "lucide", "dist", "esm", "icons");
const version = JSON.parse(
  readFileSync(join(root, "node_modules", "lucide", "package.json"), "utf8")
).version;

const entries = [];
const missing = [];

for (const name of ICONS) {
  const file = join(src, `${name}.mjs`);
  let code;
  try {
    code = readFileSync(file, "utf8");
  } catch {
    missing.push(name);
    continue;
  }
  const body = code.match(/= (\[[\s\S]*?\]);/)[1].replace(/\s+/g, " ").trim();
  entries.push([name, body]);
}

if (missing.length) {
  console.error(`Missing lucide icons: ${missing.join(", ")}`);
  process.exit(1);
}

const out = `// GENERATED FILE, DO NOT EDIT.
// Source: lucide v${version} (ISC), icons/${ICONS.length} names from scripts/vendor-icons.mjs
// Regenerate with: npm run icons

const D = {
${entries.map(([name, body]) => `  ${JSON.stringify(name)}: ${body},`).join("\n")}
};

const SVG_NS = "http://www.w3.org/2000/svg";

export function hasIcon(name) {
  return Object.prototype.hasOwnProperty.call(D, name);
}

/** Builds an inline <svg> for a lucide icon name, or null when it is unknown. */
export function svg(name, cls = "ico") {
  const parts = D[name];
  if (!parts) return null;
  const el = document.createElementNS(SVG_NS, "svg");
  el.setAttribute("class", cls);
  el.setAttribute("viewBox", "0 0 24 24");
  el.setAttribute("fill", "none");
  el.setAttribute("stroke", "currentColor");
  el.setAttribute("stroke-width", "2");
  el.setAttribute("stroke-linecap", "round");
  el.setAttribute("stroke-linejoin", "round");
  el.setAttribute("aria-hidden", "true");
  for (const [tag, attrs] of parts) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    el.append(node);
  }
  return el;
}
`;

writeFileSync(join(root, "mevebu", "libs", "js", "icons.js"), out);
console.log(`icons.js written: ${entries.length} icons from lucide v${version}`);