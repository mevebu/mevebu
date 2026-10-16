// Character counts that follow the text, with an optional limit and the
// number of characters left.
import { el, bench, stack, panel, textArea, numberInput, notice, button, copyButton, actions, toolcard } from "../core.js";

const chars = (text) => [...text].length;
const withoutSpaces = (text) => [...text.replace(/\s/g, "")].length;

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function mount(slot) {
  const source = textArea({ rows: 10, "aria-label": "Text" });
  const limitField = numberInput({ min: "0", placeholder: "No limit", "aria-label": "Character limit" });

  const totalTile = tile("Characters");
  const noSpaceTile = tile("Without spaces");
  const wordsTile = tile("Words");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, totalTile, noSpaceTile, wordsTile);

  const meter = el("div", { class: "h-2 overflow-hidden rounded-full bg-deck-2", role: "img", "aria-label": "Character limit" }, el("div", { class: "h-full w-0 rounded-full bg-orbit-hard transition-[width,background-color] duration-150 data-[level=weak]:bg-danger data-[level=ok]:bg-star data-[level=strong]:bg-jade" }));
  const limitNote = notice("note");
  const fill = meter.firstElementChild;

  let counts = { total: 0, noSpace: 0, words: 0 };

  function summary() {
    return [
      plural(counts.total, "character"),
      plural(counts.noSpace, "character") + " without spaces",
      plural(counts.words, "word")].join("\n");
  }

  function run() {
    const text = source.value;
    counts = {
      total: chars(text),
      noSpace: withoutSpaces(text),
      words: text.trim() ? text.trim().split(/\s+/).length : 0};
    totalTile.set(String(counts.total));
    noSpaceTile.set(String(counts.noSpace));
    wordsTile.set(String(counts.words));

    const limit = parseInt(limitField.value, 10) || 0;
    // The track is only worth showing once a limit exists to fill it.
    meter.hidden = limit <= 0;
    if (limit > 0) {
      const ratio = counts.total / limit;
      fill.style.width = `${Math.min(100, ratio * 100)}%`;
      fill.dataset.level = ratio > 1 ? "weak" : ratio > 0.8 ? "ok" : "strong";
      limitNote.write(ratio > 1 ? `${counts.total - limit} over the limit.` : `${plural(limit - counts.total, "character")} left.`);
    } else {
      fill.style.width = "0%";
      delete fill.dataset.level;
      limitNote.write("");
    }
  }

  const clearButton = button("Clear", { icon: "trash" });
  clearButton.addEventListener("click", () => { source.value = ""; run(); });
  limitField.addEventListener("input", run);
  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), panel("Character limit", limitField)),
      stack(stats, meter, limitNote)
    ),
    foot: actions(clearButton, copyButton(summary, "Copy summary", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
