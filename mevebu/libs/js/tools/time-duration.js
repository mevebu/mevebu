// Measures the time between two clock times, across midnight, minus a break.
import { el, bench, stack, panel, textInput, numberInput, notice, copyButton, actions, toolcard } from "../core.js";

function parseTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const start = textInput({ type: "time", value: "09:00", "aria-label": "Start time" });
  const end = textInput({ type: "time", value: "17:30", "aria-label": "End time" });
  const breakMin = numberInput({ value: "30", min: "0", "aria-label": "Break in minutes" });

  const result = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "-");
  const tile = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, result, el("span", { class: "text-2xs font-semibold text-ink-3" }, "Duration"));
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, tile);
  const minutesOut = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const decimalOut = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" }, kvRow("Total minutes", minutesOut), kvRow("Decimal hours", decimalOut));
  const error = notice("error");
  let text = "";

  function clear() {
    result.textContent = "-";
    minutesOut.textContent = "-";
    decimalOut.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    const from = parseTime(start.value);
    const to = parseTime(end.value);
    if (from == null || to == null) {
      clear();
      error.write("Enter a valid start and end time.");
      return;
    }
    let span = to - from;
    if (span < 0) span += 1440;
    const pause = breakMin.value.trim() === "" ? 0 : Number(breakMin.value);
    if (!Number.isFinite(pause) || pause < 0) {
      clear();
      error.write("Enter the break in minutes.");
      return;
    }
    if (pause > span) {
      clear();
      error.write("The break is longer than the time between the two clocks.");
      return;
    }
    const total = span - pause;
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    result.textContent = `${hours}h ${minutes}m`;
    minutesOut.textContent = String(total);
    decimalOut.textContent = (total / 60).toFixed(2);
    text = `${hours}h ${minutes}m`;
  }

  for (const input of [start, end, breakMin]) input.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Start", start), panel("End", end), panel("Break in minutes", breakMin), error),
      stack(stats, panel("Breakdown", kv))
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
