// Live word, character, sentence and line counts, plus an optional word limit
// and a reading time estimate.
import { el, bench, stack, panel, textArea, numberInput, notice, button, copyButton, actions, toolcard } from "../core.js";

const WPM = 200;

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

const countSentences = (text) => text.trim()
  ? text.trim().split(/[.!?\u2026]+/).filter((part) => part.trim()).length
  : 0;

export function mount(slot) {
  const source = textArea({ rows: 10, "aria-label": "Text", placeholder: "Type or paste text" });
  const limitField = numberInput({ min: "0", placeholder: "No limit", "aria-label": "Word limit" });

  const wordsTile = tile("Words");
  const charsTile = tile("Characters");
  const sentencesTile = tile("Sentences");
  const linesTile = tile("Lines");
  const readingTile = tile("Reading time");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, wordsTile, charsTile, sentencesTile, linesTile, readingTile);

  const meter = el("div", { class: "h-2 overflow-hidden rounded-full bg-deck-2", role: "img", "aria-label": "Word limit" }, el("div", { class: "h-full w-0 rounded-full bg-orbit-hard transition-[width,background-color] duration-150 data-[level=weak]:bg-danger data-[level=ok]:bg-star data-[level=strong]:bg-jade" }));
  const limitNote = notice("note");
  const fill = meter.firstElementChild;

  let counts = { words: 0, chars: 0, sentences: 0, lines: 0 };

  function summary() {
    return [
      `${counts.words} words`,
      `${counts.chars} characters`,
      `${counts.sentences} sentences`,
      `${counts.lines} lines`].join("\n");
  }

  function run() {
    const text = source.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    counts = {
      words,
      chars: text.length,
      sentences: countSentences(text),
      lines: text ? text.split("\n").length : 0};
    wordsTile.set(String(counts.words));
    charsTile.set(String(counts.chars));
    sentencesTile.set(String(counts.sentences));
    linesTile.set(String(counts.lines));
    readingTile.set(counts.words ? `${Math.max(1, Math.round(counts.words / WPM))} min` : "0 min");

    const limit = parseInt(limitField.value, 10) || 0;
    if (limit > 0) {
      const ratio = words / limit;
      fill.style.width = `${Math.min(100, ratio * 100)}%`;
      fill.dataset.level = ratio > 1 ? "weak" : ratio > 0.8 ? "ok" : "strong";
      limitNote.write(ratio > 1 ? `${words - limit} over the limit.` : `${limit - words} words left.`);
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
      stack(panel("Text", source), panel("Word limit", limitField)),
      stack(stats, meter, limitNote)
    ),
    foot: actions(clearButton, copyButton(summary, "Copy summary", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
