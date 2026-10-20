// Lists the next ten times a five-field cron expression fires, in the browser
// timezone or UTC.
import { el, bench, stack, panel, textInput, notice, chipRow, copyButton, actions, toolcard } from "../core.js";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const SPECIAL = {
  "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0", "@daily": "0 0 * * *", "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

function valueOf(raw, names, min, max) {
  const text = raw.toUpperCase();
  if (names && names.includes(text)) return names.indexOf(text) + (names === MONTHS ? 1 : 0);
  if (!/^\d+$/.test(text)) throw new Error(`Unknown value ${raw}.`);
  const value = Number(text);
  if (value < min || value > max) {
    throw new Error(`Value ${raw} is out of range.`);
  }
  return value;
}

function parseField(raw, min, max, names = null) {
  if (raw === "*") {
    const set = new Set();
    for (let value = min; value <= max; value++) set.add(value);
    return { set, restricted: false };
  }
  const set = new Set();
  for (const part of raw.split(",")) {
    const [range, stepText] = part.split("/");
    const step = stepText === undefined ? 1 : Number(stepText);
    if (!Number.isInteger(step) || step < 1) throw new Error(`Bad step in ${part}.`);
    let from;
    let to;
    if (range === "*") {
      from = min;
      to = max;
    } else if (range.includes("-")) {
      const [a, b] = range.split("-");
      from = valueOf(a, names, min, max);
      to = valueOf(b, names, min, max);
    } else {
      from = valueOf(range, names, min, max);
      to = stepText === undefined ? from : max;
    }
    if (from > to) throw new Error(`Range ${range} runs backwards.`);
    for (let value = from; value <= to; value += step) {
      set.add(names === DAYS && value === 7 ? 0 : value);
    }
  }
  return { set, restricted: true };
}

function compile(expression) {
  const raw = SPECIAL[expression.trim().toLowerCase()] ?? expression.trim();
  const fields = raw.split(/\s+/);
  if (fields.length !== 5) throw new Error("A cron expression needs exactly five fields.");
  return {
    minute: parseField(fields[0], 0, 59),
    hour: parseField(fields[1], 0, 23),
    day: parseField(fields[2], 1, 31),
    month: parseField(fields[3], 1, 12, MONTHS),
    weekday: parseField(fields[4], 0, 6, DAYS),
  };
}

function nextRuns(expression, timezone, count = 10) {
  const cron = compile(expression);
  const utc = timezone === "utc";
  const get = (date, key) => date[utc ? `getUTC${key}` : `get${key}`]();
  const hours = [...cron.hour.set].sort((a, b) => a - b);
  const minutes = [...cron.minute.set].sort((a, b) => a - b);
  const results = [];
  const start = new Date();
  const cursor = new Date(start.getTime());
  if (utc) cursor.setUTCHours(0, 0, 0, 0);
  else cursor.setHours(0, 0, 0, 0);

  for (let day = 0; day < 3660 && results.length < count; day++) {
    const month = get(cursor, "Month") + 1;
    const dayOfMonth = get(cursor, "Date");
    const weekday = get(cursor, "Day");
    const dayMatch = cron.day.set.has(dayOfMonth);
    const weekdayMatch = cron.weekday.set.has(weekday);
    const dayOk = cron.day.restricted && cron.weekday.restricted
      ? dayMatch || weekdayMatch
      : dayMatch && weekdayMatch;
    if (dayOk && cron.month.set.has(month)) {
      const year = get(cursor, "FullYear");
      for (const hour of hours) {
        for (const minute of minutes) {
          const candidate = utc
            ? new Date(Date.UTC(year, month - 1, dayOfMonth, hour, minute))
            : new Date(year, month - 1, dayOfMonth, hour, minute);
          if (candidate <= start) continue;
          results.push(candidate);
          if (results.length === count) break;
        }
        if (results.length === count) break;
      }
    }
    if (utc) cursor.setUTCDate(cursor.getUTCDate() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  if (!results.length) throw new Error("No run found in the next ten years.");
  return results;
}

export function mount(slot) {
  const expression = textInput({ value: "*/15 9-17 * * 1-5", "aria-label": "Cron expression", class: "font-mono" });
  const error = notice("error");
  const list = el("div", { class: "grid gap-1.5" });
  let timezone = "local";

  const chips = chipRow(
    [{ value: "local", label: "Browser" }, { value: "utc", label: "UTC" }],
    { value: "local", label: "Timezone", onChange: (value) => { timezone = value; run(); } },
  );

  const presets = chipRow(
    [
      { value: "*/15 * * * *", label: "Every 15 min" },
      { value: "0 * * * *", label: "Hourly" },
      { value: "0 0 * * *", label: "Daily" },
      { value: "0 9 * * 1-5", label: "Weekdays 9:00" },
      { value: "0 0 * * 1", label: "Weekly" },
    ],
    { label: "Presets", onChange: (value) => { if (!value) return; expression.value = value; run(); } },
  );

  const formatter = () => new Intl.DateTimeFormat(undefined, {
    timeZone: timezone === "utc" ? "UTC" : undefined,
    weekday: "short", year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  let runs = [];

  function run() {
    error.write("");
    runs = [];
    if (!expression.value.trim()) {
      list.replaceChildren();
      return;
    }
    try {
      runs = nextRuns(expression.value, timezone);
    } catch (caught) {
      error.write(caught.message);
      list.replaceChildren();
      return;
    }
    const format = formatter();
    list.replaceChildren(...runs.map((date, index) =>
      el("div", { class: "flex items-baseline gap-3 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-2.5" },
        el("span", { class: "w-5 flex-none text-2xs font-bold tabular-nums text-ink-3" }, String(index + 1)),
        el("span", { class: "font-mono text-sm" }, format.format(date)))));
  }

  expression.addEventListener("input", () => { presets.select(""); run(); });

  const report = () => runs.map((date) => formatter().format(date)).join("\n");

  const card = toolcard({
    body: bench(
      stack(panel("Expression", expression), panel("Presets", presets), panel("Timezone", chips), error),
      stack(panel("Next runs", list)),
    ),
    foot: actions(copyButton(report, "Copy times", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
