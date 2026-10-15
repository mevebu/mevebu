// Line totals for pasted lists, logs and data: total, filled and blank.
import { el, bench, stack, panel, textArea, button, copyButton, actions, toolcard } from "../core.js";

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 14, "aria-label": "Text", placeholder: "Paste text, one entry per line" });

  const totalTile = tile("Total lines");
  const filledTile = tile("Filled");
  const blankTile = tile("Blank");
  const stats = el("div", { class: "mvb-stats" }, totalTile, filledTile, blankTile);

  let counts = { total: 0, filled: 0, blank: 0 };

  function summary() {
    return [
      `${counts.total} total lines`,
      `${counts.filled} filled`,
      `${counts.blank} blank`,
    ].join("\n");
  }

  function run() {
    const lines = source.value === "" ? [] : source.value.split("\n");
    const blank = lines.filter((line) => !line.trim()).length;
    counts = { total: lines.length, filled: lines.length - blank, blank };
    totalTile.set(String(counts.total));
    filledTile.set(String(counts.filled));
    blankTile.set(String(counts.blank));
  }

  const clearButton = button("Clear", { icon: "trash" });
  clearButton.addEventListener("click", () => { source.value = ""; run(); });
  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source)),
      stack(stats)
    ),
    foot: actions(clearButton, copyButton(summary, "Copy summary", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
