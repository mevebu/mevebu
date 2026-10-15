// Tidies KEY=value lines: sorts the names and flags duplicates.
import { el, bench, stack, panel, textArea, notice, switchControl, output, copyButton, actions, toolcard } from "../core.js";

function parse(text) {
  const entries = [];
  const comments = [];
  const seen = new Set();
  const duplicates = [];
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) { comments.push(line); continue; }
    const at = line.indexOf("=");
    const key = at === -1 ? line : line.slice(0, at).trim();
    const value = at === -1 ? null : line.slice(at + 1).trim();
    if (seen.has(key)) duplicates.push(key);
    else seen.add(key);
    entries.push({ key, value });
  }
  return { entries, comments, duplicates };
}

export function mount(slot) {
  const source = textArea({
    rows: 12,
    "aria-label": "Environment variables",
    placeholder: "KEY=value",
    value: "API_URL=https://example.com\n# a note\nPORT=3000\nAPI_URL=https://other.com"});
  const result = output({ rows: 12 });
  const warn = notice("warn");
  let sort = true;
  let keepComments = true;

  const sortSwitch = switchControl("Sort names", { checked: true });
  sortSwitch.input.addEventListener("change", () => { sort = sortSwitch.input.checked; run(); });

  const commentSwitch = switchControl("Keep comments", { checked: true });
  commentSwitch.input.addEventListener("change", () => { keepComments = commentSwitch.input.checked; run(); });

  function run() {
    warn.write("");
    if (!source.value.trim()) {
      result.write("");
      return;
    }
    const { entries, comments, duplicates } = parse(source.value);
    const ordered = sort ? entries.slice().sort((a, b) => a.key.localeCompare(b.key)) : entries;
    const lines = [];
    if (keepComments) lines.push(...comments);
    for (const entry of ordered) lines.push(entry.value === null ? entry.key : `${entry.key}=${entry.value}`);
    result.write(lines.join("\n"));
    if (duplicates.length) warn.write(`Duplicate names: ${[...new Set(duplicates)].join(", ")}.`);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Options", el("div", { class: "grid content-start gap-4" }, sortSwitch, commentSwitch)), panel("Input", source), warn),
      stack(panel("Tidied", result))
    ),
    foot: actions(copyButton(() => result.textContent, "Copy list", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
