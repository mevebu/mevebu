// Compares two JSON documents by path, so a reformatted file does not look
// like a rewrite.
import { el, bench, stack, panel, textArea, notice, copyButton, actions, toolcard } from "../core.js";

const EXAMPLE_OLD = '{\n  "name": "mevebu",\n  "tools": 220,\n  "tags": ["offline", "browser"]\n}';
const EXAMPLE_NEW = '{\n  "name": "mevebu",\n  "tools": 225,\n  "tags": ["offline", "browser", "free"],\n  "license": "MIT"\n}';

const kindLabel = { added: "Added", removed: "Removed", changed: "Changed" };

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function walk(oldValue, newValue, path, output) {
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    const length = Math.max(oldValue.length, newValue.length);
    for (let index = 0; index < length; index++) {
      const child = `${path}[${index}]`;
      if (index >= oldValue.length) output.push({ kind: "added", path: child, after: newValue[index] });
      else if (index >= newValue.length) output.push({ kind: "removed", path: child, before: oldValue[index] });
      else walk(oldValue[index], newValue[index], child, output);
    }
    return;
  }
  if (isObject(oldValue) && isObject(newValue)) {
    const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
    for (const key of keys) {
      const child = path ? `${path}.${key}` : key;
      if (!(key in newValue)) output.push({ kind: "removed", path: child, before: oldValue[key] });
      else if (!(key in oldValue)) output.push({ kind: "added", path: child, after: newValue[key] });
      else walk(oldValue[key], newValue[key], child, output);
    }
    return;
  }
  if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
    output.push({ kind: "changed", path, before: oldValue, after: newValue });
  }
}

const show = (value) => {
  if (value === undefined) return "";
  const text = JSON.stringify(value);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
};

export function mount(slot) {
  const before = textArea({ rows: 10, "aria-label": "Old JSON", value: EXAMPLE_OLD });
  const after = textArea({ rows: 10, "aria-label": "New JSON", value: EXAMPLE_NEW });
  const error = notice("error");
  const list = el("div", { class: "grid gap-2" });
  const summary = el("div", { class: "flex flex-wrap gap-2 text-2xs font-semibold" });
  let rows = [];

  function run() {
    error.write("");
    rows = [];
    if (!before.value.trim() || !after.value.trim()) {
      list.replaceChildren(el("p", { class: "text-sm text-ink-3" }, "Paste both documents."));
      summary.replaceChildren();
      return;
    }
    let oldValue;
    let newValue;
    try {
      oldValue = JSON.parse(before.value);
      newValue = JSON.parse(after.value);
    } catch (caught) {
      list.replaceChildren();
      summary.replaceChildren();
      error.write(caught.message);
      return;
    }
    walk(oldValue, newValue, "$", rows);
    const counts = rows.reduce((total, row) => ({ ...total, [row.kind]: (total[row.kind] ?? 0) + 1 }), {});
    summary.replaceChildren(...["added", "removed", "changed"].map((kind) =>
      el("span", { class: `rounded-full border px-2.5 py-1 ${kind === "added" ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : kind === "removed" ? "border-rose-500/40 text-rose-600 dark:text-rose-400" : "border-amber-500/40 text-amber-600 dark:text-amber-400"}` },
        `${counts[kind] ?? 0} ${kind}`)));
    if (!rows.length) {
      list.replaceChildren(el("p", { class: "text-sm text-ink-2" }, "No differences."));
      return;
    }
    list.replaceChildren(...rows.map((row) =>
      el("div", { class: "grid gap-1 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
        el("div", { class: "flex flex-wrap items-baseline gap-2" },
          el("span", { class: "rounded-full border border-orbit px-2 py-0.5 text-2xs font-semibold text-ink-2" }, kindLabel[row.kind]),
          el("code", { class: "wrap-anywhere text-sm font-semibold" }, row.path)),
        el("p", { class: "wrap-anywhere font-mono text-xs text-ink-2" },
          row.kind === "added" ? show(row.after)
            : row.kind === "removed" ? show(row.before)
              : `${show(row.before)} -> ${show(row.after)}`))));
  }

  before.addEventListener("input", run);
  after.addEventListener("input", run);

  const report = () => rows.map((row) => `${kindLabel[row.kind]}: ${row.path}`).join("\n");

  const card = toolcard({
    body: bench(
      stack(panel("Old", before), panel("New", after), error),
      stack(panel("Changes", el("div", { class: "grid gap-2" }, summary, list))),
    ),
    foot: actions(copyButton(report, "Copy report", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
