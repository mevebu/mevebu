// Checks text against a minimum and maximum word count.
import { el, bench, stack, panel, textArea, numberInput, notice, copyButton, actions, toolcard } from "../core.js";

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Text", placeholder: "Paste your text" });
  const min = numberInput({ value: "150", min: "0", "aria-label": "Minimum words" });
  const max = numberInput({ value: "250", min: "0", "aria-label": "Maximum words" });
  const wordsTile = tile("Words");
  const minTile = tile("To minimum");
  const maxTile = tile("To maximum");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, wordsTile, minTile, maxTile);
  const status = notice("note");
  const note = notice("note");
  note.write("Each hyphenated word and each number counts as one word.");
  let summary = "";

  function run() {
    const words = countWords(source.value);
    const lo = Number(min.value);
    const hi = Number(max.value);
    const hasLo = min.value.trim() !== "" && Number.isFinite(lo);
    const hasHi = max.value.trim() !== "" && Number.isFinite(hi);

    wordsTile.set(String(words));
    minTile.set(hasLo ? String(Math.max(0, lo - words)) : "-");
    maxTile.set(hasHi ? String(Math.max(0, hi - words)) : "-");

    if (hasLo && words < lo) status.write(`${lo - words} words under the minimum.`);
    else if (hasHi && words > hi) status.write(`${words - hi} words over the maximum.`);
    else if (hasLo && hasHi) status.write("Within the range.");
    else status.write("");

    summary = `${words} words`;
  }

  for (const input of [source, min, max]) input.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), panel("Minimum", min), panel("Maximum", max), note),
      stack(stats, status)
    ),
    foot: actions(copyButton(() => summary, "Copy count", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
