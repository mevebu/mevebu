// Tags cleaned, de-duplicated and laid out one way or the other.
import { el, bench, stack, panel, textArea, chipRow, output, copyButton, actions, toolcard } from "../core.js";

const clean = (raw) => raw.replace(/#/g, "").replace(/[^\p{L}\p{N}_]/gu, "");

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 8, "aria-label": "Tags", placeholder: "One tag per line or space separated" });
  const tagsTile = tile("Tags");
  const removedTile = tile("Duplicates removed");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, tagsTile, removedTile);
  const out = output({ rows: 8 });

  let mode = "list";
  const modeChips = chipRow(
    [
      { value: "line", label: "One line" },
      { value: "list", label: "One per line" }],
    { value: "list", label: "Layout", onChange: (next) => { mode = next; run(); } }
  );

  let result = "";

  function run() {
    const tokens = source.value.split(/[\s]+/).map(clean).filter(Boolean);
    const seen = new Set();
    const tags = [];
    for (const token of tokens) {
      const key = token.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tags.push(`#${token}`);
    }
    result = tags.join(mode === "line" ? " " : "\n");
    out.write(result);
    tagsTile.set(String(tags.length));
    removedTile.set(String(tokens.length - tags.length));
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Tags", source), panel("Layout", modeChips)),
      stack(stats, panel("Result", out))
    ),
    foot: actions(copyButton(() => result, "Copy tags", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
