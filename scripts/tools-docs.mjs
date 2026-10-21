// Regenerates the tool documentation from the registry: one markdown page per
// category under docs/tools/, plus the count and the category table in README.
// Run with: npm run docs, or let `npm run ship` do it before every commit.
// The registry is the only source, so a page never lists a tool that the app
// does not ship, and the README can link to a page that exists.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES, TOOLS, toolHref } from "../mevebu/libs/js/registry.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = join(root, "docs", "tools");
const readmePath = join(root, "README.md");
const pageBase = "https://github.com/mevebu/mevebu/blob/main/docs/tools/";

mkdirSync(docsDir, { recursive: true });

const pages = new Map();
for (const category of CATEGORIES) {
  const tools = TOOLS.filter((tool) => tool.category === category.id);
  const rows = tools
    .map((tool) => `| ${tool.name} | ${tool.note} | \`${toolHref(tool)}\` |`)
    .join("\n");
  pages.set(
    `${category.id}.md`,
    `# ${category.name} tools

${tools.length} tools in this category, all running in the browser with no upload and no account.
Back to [all categories](../../README.md#whats-inside).

| Tool | What it does | Route |
| --- | --- | --- |
${rows}
`
  );
}

// A category that no longer exists must not keep a stale page behind.
for (const file of readdirSync(docsDir)) {
  if (file.endsWith(".md") && !pages.has(file)) rmSync(join(docsDir, file));
}
for (const [file, body] of pages) writeFileSync(join(docsDir, file), body, "utf8");

const total = TOOLS.length;
const categoryCount = CATEGORIES.length;
const table = [
  "| Category | A few tools | Count |",
  "| --- | --- | ---: |",
  ...CATEGORIES.map((category) => {
    const tools = TOOLS.filter((tool) => tool.category === category.id);
    const names = tools.slice(0, 3).map((tool) => tool.name).join(", ");
    return `| [${category.name}](${pageBase}${category.id}.md) | ${names} | ${String(tools.length).padStart(4)} |`;
  }),
  `| **Total** | **${categoryCount} categories** | **${total}** |`,
].join("\n");

let readme = readFileSync(readmePath, "utf8");
const before = readme;
readme = readme
  .replace(/\*\*\d+ free browser tools/g, `**${total} free browser tools`)
  .replace(/tools-\d+-brightgreen/g, `tools-${total}-brightgreen`)
  .replace(/\*\*\d+ small online tools\*\*/g, `**${total} small online tools**`)
  .replace(/has \*\*\d+ tools in \d+ categories\*\*/g, `has **${total} tools in ${categoryCount} categories**`)
  .replace(/collection of \d+ browser based tools/g, `collection of ${total} browser based tools`);

if (/<!-- tools:start -->[\s\S]*?<!-- tools:end -->/.test(readme)) {
  readme = readme.replace(
    /<!-- tools:start -->[\s\S]*?<!-- tools:end -->/,
    `<!-- tools:start -->\n${table}\n<!-- tools:end -->`
  );
} else {
  throw new Error("README.md is missing the <!-- tools:start --> and <!-- tools:end --> markers");
}

if (readme !== before) writeFileSync(readmePath, readme, "utf8");

console.log(`docs: ${pages.size} category pages, ${total} tools in ${categoryCount} categories`);
