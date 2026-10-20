// Regenerates one markdown page per category under docs/tools/.
// Run with: npm run docs
// The registry is the only source, so a page never lists a tool that the app
// does not ship, and the README can link to a page that exists.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES, TOOLS, toolHref } from "../mevebu/libs/js/registry.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "docs", "tools");

mkdirSync(out, { recursive: true });

let pages = 0;
for (const category of CATEGORIES) {
  const tools = TOOLS.filter((tool) => tool.category === category.id);
  const rows = tools
    .map((tool) => `| ${tool.name} | ${tool.note} | \`${toolHref(tool)}\` |`)
    .join("\n");
  const body = `# ${category.name} tools

${tools.length} tools in this category, all running in the browser with no upload and no account.
Back to [all categories](../../README.md#whats-inside).

| Tool | What it does | Route |
| --- | --- | --- |
${rows}
`;
  writeFileSync(join(out, `${category.id}.md`), body, "utf8");
  pages += 1;
}

console.log(`wrote ${pages} category pages to docs/tools/`);
