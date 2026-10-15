// A date typed in one format, written out in the others.
import { el, bench, stack, panel, textInput, selectInput, notice, copyButton, actions, toolcard } from "../core.js";

const FORMATS = [
  { value: "iso", label: "ISO (yyyy-mm-dd)" },
  { value: "dmy", label: "Day first (dd/mm/yyyy)" },
  { value: "mdy", label: "Month first (mm/dd/yyyy)" },
];

const pad = (n) => String(n).padStart(2, "0");

function parseDate(text, format) {
  const raw = text.trim();
  let year;
  let month;
  let day;
  if (format === "iso") {
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
    if (!match) return null;
    [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    const match = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/.exec(raw);
    if (!match) return null;
    const first = Number(match[1]);
    const second = Number(match[2]);
    let rest = Number(match[3]);
    if (rest < 100) rest += rest < 70 ? 2000 : 1900;
    if (format === "dmy") [day, month, year] = [first, second, rest];
    else [month, day, year] = [first, second, rest];
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function intlFormat(date, options, fallback) {
  try {
    return new Intl.DateTimeFormat(undefined, options).format(date);
  } catch {
    return fallback;
  }
}

const kvRow = (key, value) => el("div", { class: "mvb-kv__row" },
  el("span", { class: "mvb-kv__k" }, key),
  el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const format = selectInput(FORMATS, { value: "iso", "aria-label": "Input format" });
  const entry = textInput({ placeholder: "2026-10-15", "aria-label": "Date" });

  const iso = el("span", { class: "mvb-kv__v" }, "-");
  const long = el("span", { class: "mvb-kv__v" }, "-");
  const medium = el("span", { class: "mvb-kv__v" }, "-");
  const weekday = el("span", { class: "mvb-kv__v" }, "-");
  const unix = el("span", { class: "mvb-kv__v" }, "-");
  const out = el("div", { class: "mvb-kv" },
    kvRow("ISO", iso),
    kvRow("Long", long),
    kvRow("Medium", medium),
    kvRow("Weekday", weekday),
    kvRow("Unix seconds", unix));

  const error = notice("error");
  const note = notice("note");
  note.write("Pick the input format so the date is read the way you meant.");

  let isoText = "";

  function run() {
    const date = parseDate(entry.value, format.value);
    if (!date) {
      iso.textContent = "-";
      long.textContent = "-";
      medium.textContent = "-";
      weekday.textContent = "-";
      unix.textContent = "-";
      isoText = "";
      error.write(entry.value.trim() ? "That date does not match the chosen format." : "");
      return;
    }
    error.write("");
    isoText = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    iso.textContent = isoText;
    long.textContent = intlFormat(date, { dateStyle: "long" }, date.toDateString());
    medium.textContent = intlFormat(date, { dateStyle: "medium" }, date.toDateString());
    weekday.textContent = intlFormat(date, { weekday: "long" }, "");
    unix.textContent = String(Math.floor(date.getTime() / 1000));
  }

  format.addEventListener("change", run);
  entry.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Input format", format), panel("Date", entry), error),
      stack(out, note)
    ),
    foot: actions(copyButton(() => isoText, "Copy ISO date", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
