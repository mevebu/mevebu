// Reading and speaking time for a text, at a speed the user sets.
import { el, bench, stack, panel, textArea, numberInput, notice, copyButton, actions, toolcard } from "../core.js";

const countWords = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
      let count = 0;
      for (const part of segmenter.segment(trimmed)) if (part.isWordLike) count++;
      return count;
    } catch {
      /* fall back to the whitespace split below */
    }
  }
  return trimmed.split(/\s+/).length;
};

const clock = (minutes) => {
  const total = Math.round(minutes * 60);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0:00");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 10, "aria-label": "Text", placeholder: "Type or paste text" });
  const speed = numberInput({ min: "50", max: "1000", step: "10", value: "200", "aria-label": "Reading speed in words per minute" });

  const wordsTile = tile("Words");
  const readTile = tile("Reading time");
  const speakTile = tile("Speaking time");
  const stats = el("div", { class: "mvb-stats" }, wordsTile, readTile, speakTile);
  const note = notice("note");
  note.write("Reading and speaking speeds vary by person and text.");

  let summary = "";

  function run() {
    const words = countWords(source.value);
    const wpm = Math.max(1, parseInt(speed.value, 10) || 200);
    const readMinutes = words / wpm;
    const speakMinutes = words / 130;
    wordsTile.set(String(words));
    readTile.set(words ? clock(readMinutes) : "0:00");
    speakTile.set(words ? clock(speakMinutes) : "0:00");
    summary = [
      `${words} words`,
      `Reading ${words ? clock(readMinutes) : "0:00"} at ${wpm} words per minute`,
      `Speaking ${words ? clock(speakMinutes) : "0:00"} at 130 words per minute`,
    ].join("\n");
  }

  source.addEventListener("input", run);
  speed.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), panel("Reading speed", speed, "Words per minute")),
      stack(stats, note)
    ),
    foot: actions(copyButton(() => summary, "Copy estimate", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
