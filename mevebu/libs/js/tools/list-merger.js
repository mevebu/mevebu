// Joins two lists into one, optionally dropping duplicates.
import { el, bench, stack, panel, textArea, checkbox, output, copyButton, button, actions, toolcard } from "../core.js";

const linesOf = (text) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const first = textArea({ rows: 8, "aria-label": "List A", placeholder: "One entry per line" });
  const second = textArea({ rows: 8, "aria-label": "List B", placeholder: "One entry per line" });
  const dedupeBox = checkbox("Remove duplicates", { checked: true });
  const caseBox = checkbox("Ignore case");

  const result = output({ rows: 12 });
  const listATile = tile("List A");
  const listBTile = tile("List B");
  const mergedTile = tile("Merged");
  const stats = el("div", { class: "mvb-stats" }, listATile, listBTile, mergedTile);
  let current = [];

  function run() {
    const a = linesOf(first.value);
    const b = linesOf(second.value);
    let merged = [...a, ...b];
    if (dedupeBox.input.checked) {
      const seen = new Set();
      const ignoreCase = caseBox.input.checked;
      merged = merged.filter((line) => {
        const key = ignoreCase ? line.toLowerCase() : line;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    current = merged;
    result.write(merged.join("\n"));
    listATile.set(String(a.length));
    listBTile.set(String(b.length));
    mergedTile.set(String(merged.length));
  }

  const clearButton = button("Clear", { icon: "trash" });
  clearButton.addEventListener("click", () => { first.value = ""; second.value = ""; run(); });
  first.addEventListener("input", run);
  second.addEventListener("input", run);
  dedupeBox.input.addEventListener("change", run);
  caseBox.input.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("List A", first), panel("List B", second), panel(null, dedupeBox), panel(null, caseBox)),
      stack(stats, panel("Merged", result))
    ),
    foot: actions(clearButton, copyButton(() => current.join("\n"), "Copy merged", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
