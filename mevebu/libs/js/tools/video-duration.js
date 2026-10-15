// Estimated video length from a script at a speaking rate, plus pauses.
import { el, bench, stack, panel, textArea, numberInput, notice, copyButton, actions, toolcard } from "../core.js";

const clock = (seconds) => {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0:00");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 10, "aria-label": "Script", placeholder: "Type or paste the script" });
  const wordsOverride = numberInput({ min: "0", placeholder: "From the script", "aria-label": "Word count" });
  const rate = numberInput({ min: "60", max: "400", value: "150", "aria-label": "Speaking rate in words per minute" });
  const pause = numberInput({ min: "0", max: "60", value: "8", "aria-label": "Pause seconds per minute" });

  const wordsTile = tile("Words");
  const speakTile = tile("Speaking");
  const totalTile = tile("With pauses");
  const stats = el("div", { class: "mvb-stats" }, wordsTile, speakTile, totalTile);
  const note = notice("note");
  note.write("Speaking rates vary by person and script.");

  let summary = "";

  function run() {
    const typed = parseInt(wordsOverride.value, 10) || 0;
    const words = typed > 0 ? typed : (source.value.trim() ? source.value.trim().split(/\s+/).length : 0);
    const wpm = Math.max(1, parseInt(rate.value, 10) || 150);
    const pauseSeconds = Math.max(0, parseInt(pause.value, 10) || 0);
    const speaking = (words / wpm) * 60;
    const total = speaking + (speaking / 60) * pauseSeconds;

    wordsTile.set(String(words));
    speakTile.set(clock(speaking));
    totalTile.set(clock(total));
    summary = [
      `${words} words`,
      `Speaking ${clock(speaking)} at ${wpm} words per minute`,
      `Total ${clock(total)} with ${pauseSeconds} seconds of pause per minute`,
    ].join("\n");
  }

  source.addEventListener("input", run);
  wordsOverride.addEventListener("input", run);
  rate.addEventListener("input", run);
  pause.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Script", source),
        panel("Word count", wordsOverride, "Overrides the script"),
        panel("Speaking rate", rate, "Words per minute"),
        panel("Pauses", pause, "Seconds per minute")
      ),
      stack(stats, note)
    ),
    foot: actions(copyButton(() => summary, "Copy estimate", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
