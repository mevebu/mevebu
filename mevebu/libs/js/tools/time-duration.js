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
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const start = textInput({ type: "time", value: "09:00", "aria-label": "Start time" });
  const end = textInput({ type: "time", value: "17:30", "aria-label": "End time" });
  const breakMin = numberInput({ value: "30", min: "0", "aria-label": "Break in minutes" });

  const result = el("span", { class: "mvb-stat__v" }, "-");
  const tile = el("div", { class: "mvb-stat" }, result, el("span", { class: "mvb-stat__k" }, "Duration"));
  const stats = el("div", { class: "mvb-stats" }, tile);
  const minutesOut = el("span", { class: "mvb-kv__v" }, "-");
  const decimalOut = el("span", { class: "mvb-kv__v" }, "-");
  const kv = el("div", { class: "mvb-kv" }, kvRow("Total minutes", minutesOut), kvRow("Decimal hours", decimalOut));
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
    foot: actions(copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
