// Counts working days between two dates, skipping weekends and listed holidays.
import { el, bench, stack, panel, textInput, textArea, checkbox, toggleRow, notice, copyButton, actions, toolcard } from "../core.js";

const DAY = 86400000;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const start = textInput({ type: "date", value: "2026-01-01", "aria-label": "Start date" });
  const end = textInput({ type: "date", value: "2026-01-31", "aria-label": "End date" });
  const includeEnd = checkbox("Count the end date", { checked: true });
  const weekdays = toggleRow(DAY_LABELS.map((label, index) => ({ value: index, label, checked: index >= 1 && index <= 5 })));
  const holidays = textArea({ rows: 4, placeholder: "2026-01-01", "aria-label": "Holidays, one per line" });

  const working = el("span", { class: "mvb-kv__v" }, "-");
  const calendar = el("span", { class: "mvb-kv__v" }, "-");
  const weekend = el("span", { class: "mvb-kv__v" }, "-");
  const holidayCount = el("span", { class: "mvb-kv__v" }, "-");
  const kv = el(
    "div",
    { class: "mvb-kv" },
    kvRow("Working days", working),
    kvRow("Calendar days", calendar),
    kvRow("Weekend days", weekend),
    kvRow("Holidays", holidayCount)
  );
  const error = notice("error");
  let text = "";

  function clear() {
    working.textContent = "-";
    calendar.textContent = "-";
    weekend.textContent = "-";
    holidayCount.textContent = "-";
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
    const rangeEnd = includeEnd.input.checked ? b : new Date(b.getFullYear(), b.getMonth(), b.getDate() - 1);
    const workingSet = new Set(weekdays.values().map(Number));
    const holidaySet = new Set();
    for (const line of holidays.value.split("\n")) {
      const date = parseDate(line.trim());
      if (date) holidaySet.add(iso(date));
    }

    let work = 0;
    let rest = 0;
    let off = 0;
    const cursor = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    while (cursor <= rangeEnd) {
      if (!workingSet.has(cursor.getDay())) rest += 1;
      else if (holidaySet.has(iso(cursor))) off += 1;
      else work += 1;
      cursor.setDate(cursor.getDate() + 1);
    }

    const total = rangeEnd < a ? 0 : Math.round((rangeEnd - a) / DAY) + 1;
    working.textContent = String(work);
    calendar.textContent = String(total);
    weekend.textContent = String(rest);
    holidayCount.textContent = String(off);
    text = `${work} working days`;
  }

  for (const input of [start, end]) input.addEventListener("input", run);
  includeEnd.input.addEventListener("change", run);
  holidays.addEventListener("input", run);
  weekdays.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Start", start),
        panel("End", end),
        includeEnd,
        weekdays,
        error
      ),
      stack(panel("Holidays", holidays), panel("Count", kv))
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
