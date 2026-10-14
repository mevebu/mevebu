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
  "external-link", "corner-down-left", "info", "circle-question-mark", "circle-arrow-up",
  // categories
  "shuffle", "shield-check", "terminal", "repeat", "file-text", "qr-code",
  // tools
  "circle-dashed", "users", "coins", "key-round", "signature",
  "hash", "fingerprint-pattern", "binary", "link", "palette",
  "case-sensitive", "pilcrow", "database", "scan-line",
  // shared tool controls
  "copy", "check", "refresh-cw", "rotate-cw", "download", "upload",
  "arrow-left-right", "trash", "plus", "minus", "camera", "video-off",
  "image-up", "clipboard", "eye", "eye-off", "circle-alert", "triangle-alert",
  "loader", "play", "lock",
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