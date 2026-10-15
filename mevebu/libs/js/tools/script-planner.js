// A video script laid out in sections, with word and time estimates.
import { el, bench, stack, panel, textArea, numberInput, copyButton, actions, toolcard } from "../core.js";

const SECTIONS = [
  ["hook", "Hook"],
  ["intro", "Intro"],
  ["body", "Body"],
  ["outro", "Outro"]];

const clock = (seconds) => {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

const kvRow = (key, value) => el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" },
  el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key),
  el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const inputs = {};
  const fields = SECTIONS.map(([id, label]) => {
    const area = textArea({ rows: 4, "aria-label": label, placeholder: `${label} text` });
    inputs[id] = area;
    return panel(label, area);
  });

  const rate = numberInput({ min: "60", max: "400", value: "150", "aria-label": "Speaking rate in words per minute" });

  const rows = {};
  const list = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" });
  for (const [id, label] of SECTIONS) {
    const value = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "0 words");
    rows[id] = value;
    list.append(kvRow(label, value));
  }
  const total = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "0 words");
  list.append(kvRow("Total", total));

  let fullScript = "";

  function run() {
    const wpm = Math.max(1, parseInt(rate.value, 10) || 150);
    let totalWords = 0;
    for (const [id] of SECTIONS) {
      const words = countWords(inputs[id].value);
      totalWords += words;
      rows[id].textContent = `${words} words - ${clock((words / wpm) * 60)}`;
    }
    total.textContent = `${totalWords} words - ${clock((totalWords / wpm) * 60)}`;
    fullScript = SECTIONS.map(([id, label]) => `${label}\n${inputs[id].value.trim()}`).join("\n\n");
  }

  for (const area of Object.values(inputs)) area.addEventListener("input", run);
  rate.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(...fields),
      stack(panel("Speaking rate", rate, "Words per minute"), list)
    ),
    foot: actions(copyButton(() => fullScript, "Copy script", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
