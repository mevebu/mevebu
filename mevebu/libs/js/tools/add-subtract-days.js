// Moves a date forward or back by days, weeks, months or years.
import { el, bench, stack, panel, textInput, numberInput, selectInput, chipRow, notice, copyButton, actions, toolcard } from "../core.js";

const UNITS = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" }];

const pad = (n) => String(n).padStart(2, "0");

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const date = textInput({ type: "date", value: "2026-01-01", "aria-label": "Start date" });
  const amount = numberInput({ value: "30", min: "0", "aria-label": "Amount" });
  const unit = selectInput(UNITS, { value: "days", "aria-label": "Unit" });
  let mode = "add";
  const direction = chipRow(
    [{ value: "add", label: "Add" }, { value: "subtract", label: "Subtract" }],
    { value: "add", label: "Direction", onChange: (value) => { mode = value; run(); } }
  );
  const result = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "-");
  const tile = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, result, el("span", { class: "text-2xs font-semibold text-ink-3" }, "Result"));
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, tile);
  const isoOut = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const weekday = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" }, kvRow("ISO date", isoOut), kvRow("Weekday", weekday));
  const error = notice("error");
  let text = "";

  function clear() {
    result.textContent = "-";
    isoOut.textContent = "-";
    weekday.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    const base = parseDate(date.value);
    const count = Number(amount.value);
    if (!base) {
      clear();
      error.write("Pick a valid date.");
      return;
    }
    if (amount.value.trim() === "" || !Number.isFinite(count) || count < 0) {
      clear();
      error.write("Enter a number of days, weeks, months or years.");
      return;
    }
    const sign = mode === "subtract" ? -1 : 1;
    const step = sign * Math.floor(count);
    const out = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    if (unit.value === "days") out.setDate(out.getDate() + step);
    else if (unit.value === "weeks") out.setDate(out.getDate() + step * 7);
    else if (unit.value === "months") out.setMonth(out.getMonth() + step);
    else out.setFullYear(out.getFullYear() + step);

    result.textContent = out.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    isoOut.textContent = iso(out);
    weekday.textContent = out.toLocaleDateString(undefined, { weekday: "long" });
    text = `${out.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} (${iso(out)})`;
  }

  date.addEventListener("input", run);
  amount.addEventListener("input", run);
  unit.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Date", date),
        panel("Amount", amount),
        panel("Unit", unit),
        panel("Direction", direction),
        error
      ),
      stack(stats, panel("Result", kv))
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
