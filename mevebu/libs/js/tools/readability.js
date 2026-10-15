// Common readability formulas over a pasted text, with the counts behind them.
import { el, bench, stack, panel, textArea, notice, copyButton, actions, toolcard } from "../core.js";

function wordsOf(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
      return [...segmenter.segment(trimmed)].filter((part) => part.isWordLike).map((part) => part.segment);
    } catch {
      /* fall back to the whitespace split below */
    }
  }
  return trimmed.split(/\s+/);
}

const sentencesOf = (text) => text.trim()
  ? text.trim().split(/[.!?\u2026]+/).map((part) => part.trim()).filter(Boolean)
  : [];

function syllablesOf(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return 0;
  const groups = clean.replace(/e$/, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

function tile(label, initial = "-") {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, initial);
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

const kvRow = (key, value) => el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" },
  el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key),
  el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Text", placeholder: "Type or paste text" });

  const easeTile = tile("Reading ease");
  const gradeTile = tile("Grade level");
  const fogTile = tile("Gunning Fog");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, easeTile, gradeTile, fogTile);

  const counts = {
    words: el("span", { class: "wrap-anywhere font-mono text-2xs" }, "0"),
    sentences: el("span", { class: "wrap-anywhere font-mono text-2xs" }, "0"),
    syllables: el("span", { class: "wrap-anywhere font-mono text-2xs" }, "0")};
  const countList = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" },
    kvRow("Words", counts.words),
    kvRow("Sentences", counts.sentences),
    kvRow("Syllables", counts.syllables));

  const note = notice("note");
  note.write("These formulas suit English best, so read the result with care.");

  let summary = "";

  function run() {
    const words = wordsOf(source.value);
    const sentences = sentencesOf(source.value);
    const syllableCount = words.reduce((sum, word) => sum + syllablesOf(word), 0);
    counts.words.textContent = String(words.length);
    counts.sentences.textContent = String(sentences.length);
    counts.syllables.textContent = String(syllableCount);

    if (!words.length || !sentences.length) {
      easeTile.set("-");
      gradeTile.set("-");
      fogTile.set("-");
      summary = "";
      return;
    }

    const perSentence = words.length / sentences.length;
    const perWord = syllableCount / words.length;
    const ease = 206.835 - 1.015 * perSentence - 84.6 * perWord;
    const grade = 0.39 * perSentence + 11.8 * perWord - 15.59;
    const complex = words.filter((word) => syllablesOf(word) >= 3).length;
    const fog = 0.4 * (perSentence + 100 * (complex / words.length));

    easeTile.set(ease.toFixed(1));
    gradeTile.set(grade.toFixed(1));
    fogTile.set(fog.toFixed(1));
    summary = [
      `Reading ease ${ease.toFixed(1)}`,
      `Grade level ${grade.toFixed(1)}`,
      `Gunning Fog ${fog.toFixed(1)}`,
      `${words.length} words, ${sentences.length} sentences, ${syllableCount} syllables`].join("\n");
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source)),
      stack(stats, countList, note)
    ),
    foot: actions(copyButton(() => summary, "Copy scores", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
