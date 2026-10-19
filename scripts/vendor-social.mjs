// Regenerates mevebu/libs/js/social-icons.js from node_modules/simple-icons.
// Run with: npm run social
// Only the brand marks the footer links to are vendored, so the app ships a few
// kilobytes instead of the whole simple-icons set.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NAMES = ["github", "instagram", "threads", "tiktok", "facebook", "youtube"];

const version = JSON.parse(
  readFileSync(join(root, "node_modules", "simple-icons", "package.json"), "utf8")
).version;

const mod = await import("simple-icons");
const entries = [];
const missing = [];

for (const name of NAMES) {
  const key = `si${name[0].toUpperCase()}${name.slice(1)}`;
  const icon = mod[key];
  if (!icon) {
    missing.push(name);
    continue;
  }
  entries.push([name, icon.title, icon.path]);
}

if (missing.length) {
  console.error(`Missing simple-icons: ${missing.join(", ")}`);
  process.exit(1);
}

const out = `// GENERATED FILE, DO NOT EDIT.
// Source: simple-icons v${version} (CC0 1.0), ${entries.length} brand marks from scripts/vendor-social.mjs
// Regenerate with: npm run social

const D = {
${entries.map(([name, title, path]) => `  ${JSON.stringify(name)}: { title: ${JSON.stringify(title)}, path: ${JSON.stringify(path)} },`).join("\n")}
};

const SVG_NS = "http://www.w3.org/2000/svg";

export const SOCIAL_NAMES = Object.keys(D);

/** Builds an inline <svg> for a brand name, or null when it is unknown. */
export function socialIcon(name, cls = "size-5") {
  const icon = D[name];
  if (!icon) return null;
  const el = document.createElementNS(SVG_NS, "svg");
  el.setAttribute("class", cls);
  el.setAttribute("viewBox", "0 0 24 24");
  el.setAttribute("fill", "currentColor");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", icon.title);
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", icon.path);
  el.append(path);
  return el;
}
`;

writeFileSync(join(root, "mevebu", "libs", "js", "social-icons.js"), out);
console.log(`social-icons.js written: ${entries.length} marks from simple-icons v${version}`);
