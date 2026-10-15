// Live word, character, sentence and line counts, plus an optional word limit
// and a reading time estimate.
import { el, bench, stack, panel, textArea, numberInput, notice, button, copyButton, actions, toolcard } from "../core.js";

const WPM = 200;

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
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
  const stats = el("div", { class: "mvb-stats" }, wordsTile, charsTile, sentencesTile, linesTile, readingTile);

  const meter = el("div", { class: "mvb-meter", role: "img", "aria-label": "Word limit" }, el("div", { class: "mvb-meter__fill" }));
  const limitNote = notice("note");
  const fill = meter.querySelector(".mvb-meter__fill");

  let counts = { words: 0, chars: 0, sentences: 0, lines: 0 };

  function summary() {
    return [
      `${counts.words} words`,
      `${counts.chars} characters`,
      `${counts.sentences} sentences`,
      `${counts.lines} lines`,
    ].join("\n");
  }

  function run() {
    const text = source.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    counts = {
      words,
      chars: text.length,
      sentences: countSentences(text),
      lines: text ? text.split("\n").length : 0,
    };
    wordsTile.set(String(counts.words));
    charsTile.set(String(counts.chars));
    sentencesTile.set(String(counts.sentences));
    linesTile.set(String(counts.lines));
    readingTile.set(counts.words ? `${Math.max(1, Math.round(counts.words / WPM))} min` : "0 min");

    const limit = parseInt(limitField.value, 10) || 0;
    if (limit > 0) {
      const ratio = words / limit;
      fill.style.width = `${Math.min(100, ratio * 100)}%`;
      fill.className = `mvb-meter__fill ${ratio > 1 ? "mvb-weak" : ratio > 0.8 ? "mvb-ok" : "mvb-strong"}`;
      limitNote.write(ratio > 1 ? `${words - limit} over the limit.` : `${limit - words} words left.`);
    } else {
      fill.style.width = "0%";
      fill.className = "mvb-meter__fill";
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
    foot: actions(clearButton, copyButton(summary, "Copy summary", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
