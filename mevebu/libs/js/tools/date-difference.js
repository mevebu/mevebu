// Counts the gap between two dates in days, weeks and calendar units.
import { el, bench, stack, panel, textInput, checkbox, notice, copyButton, actions, toolcard } from "../core.js";

const DAY = 86400000;

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

function calendarDiff(from, to) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const start = textInput({ type: "date", value: "2026-01-01", "aria-label": "Start date" });
  const end = textInput({ type: "date", value: "2026-12-31", "aria-label": "End date" });
  const includeEnd = checkbox("Include the end date", { checked: false });
  const days = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const weeks = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const calendar = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el(
    "div",
    { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" },
    kvRow("Total days", days),
    kvRow("Weeks", weeks),
    kvRow("Calendar gap", calendar)
  );
  const error = notice("error");
  let text = "";

  function clear() {
    days.textContent = "-";
    weeks.textContent = "-";
    calendar.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    const a = parseDate(start.value);
    const b = parseDate(end.value);
    if (!a || !b) {
      clear();
      error.write("Pick a valid start and end date.");
      return;
    }
    if (b < a) {
      clear();
      error.write("The end date is before the start date.");
      return;
    }
    const to = includeEnd.input.checked ? new Date(b.getFullYear(), b.getMonth(), b.getDate() + 1) : b;
    const total = Math.round((to - a) / DAY);
    const diff = calendarDiff(a, to);
    const weekCount = Math.floor(total / 7);
    const rest = total % 7;
    days.textContent = String(total);
    weeks.textContent = rest ? `${weekCount} weeks ${rest} days` : `${weekCount} weeks`;
    calendar.textContent = `${diff.years} years ${diff.months} months ${diff.days} days`;
    text = `${total} days`;
  }

  for (const input of [start, end]) input.addEventListener("input", run);
  includeEnd.input.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Start", start), panel("End", end), includeEnd, error),
      stack(panel("Difference", kv))
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
