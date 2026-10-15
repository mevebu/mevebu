// Word counts per sentence, with a threshold that flags the long ones.
import { el, blank, bench, stack, panel, textArea, numberInput, notice, copyButton, actions, toolcard } from "../core.js";

const splitSentences = (text) => text.trim()
  ? text.trim().split(/[.!?\u2026]+/).map((part) => part.trim()).filter(Boolean)
  : [];

const countWords = (text) => text.trim() ? text.trim().split(/\s+/).length : 0;

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

const kvRow = (key, value) => el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" },
  el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key),
  el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Text", placeholder: "Type or paste text" });
  const threshold = numberInput({ min: "1", max: "120", value: "25", "aria-label": "Long sentence threshold in words" });

  const sentencesTile = tile("Sentences");
  const shortestTile = tile("Shortest");
  const longestTile = tile("Longest");
  const averageTile = tile("Average");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, sentencesTile, shortestTile, longestTile, averageTile);

  const listWrap = el("div", { class: "max-h-80 overflow-auto" });
  const note = notice("note");

  let longText = "";

  function run() {
    const sentences = splitSentences(source.value);
    const limit = Math.max(1, parseInt(threshold.value, 10) || 25);
    const lengths = sentences.map((sentence) => countWords(sentence));

    sentencesTile.set(String(sentences.length));
    if (lengths.length) {
      shortestTile.set(String(Math.min(...lengths)));
      longestTile.set(String(Math.max(...lengths)));
      averageTile.set((lengths.reduce((sum, value) => sum + value, 0) / lengths.length).toFixed(1));
    } else {
      shortestTile.set("0");
      longestTile.set("0");
      averageTile.set("0");
    }

    const long = sentences.filter((sentence) => countWords(sentence) > limit);
    longText = long.map((sentence) => `${countWords(sentence)} words  ${sentence}`).join("\n");
    note.write(long.length ? `${long.length} sentences run past ${limit} words.` : "");

    if (!long.length) {
      listWrap.replaceChildren(blank("text-align-start", "No sentence runs past the threshold."));
    } else {
      listWrap.replaceChildren(el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" },
        ...long.map((sentence) => kvRow(`${countWords(sentence)} words`, sentence))));
    }
  }

  source.addEventListener("input", run);
  threshold.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), panel("Flag past", threshold, "Words")),
      stack(stats, note, panel("Long sentences", listWrap))
    ),
    foot: actions(copyButton(() => longText, "Copy long sentences", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
