// Measures text as characters, code points, UTF-8 bytes and UTF-16 units.
import { el, bench, stack, panel, textArea, copyButton, actions, toolcard } from "../core.js";

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

function graphemes(text) {
  if (text && typeof Intl !== "undefined" && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;
  }
  return Array.from(text).length;
}

export function mount(slot) {
  const source = textArea({ rows: 10, value: "mevebu", "aria-label": "Text" });

  const characterTile = tile("Characters");
  const pointTile = tile("Code points");
  const byteTile = tile("UTF-8 bytes");
  const unitTile = tile("UTF-16 units");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, characterTile, pointTile, byteTile, unitTile);

  let counts = { characters: 0, points: 0, bytes: 0, units: 0 };

  function summary() {
    return [
      `${counts.characters} characters`,
      `${counts.points} code points`,
      `${counts.bytes} UTF-8 bytes`,
      `${counts.units} UTF-16 units`].join("\n");
  }

  function run() {
    const text = source.value;
    counts = {
      characters: graphemes(text),
      points: Array.from(text).length,
      bytes: new TextEncoder().encode(text).length,
      units: text.length};
    characterTile.set(String(counts.characters));
    pointTile.set(String(counts.points));
    byteTile.set(String(counts.bytes));
    unitTile.set(String(counts.units));
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source)),
      stack(stats)
    ),
    foot: actions(copyButton(summary, "Copy counts", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
