// Age in years, months and days on any date, plus the next birthday.
import { el, bench, stack, panel, textInput, notice, copyButton, actions, toolcard } from "../core.js";

const DAY = 86400000;

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
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const today = new Date();
  const birth = textInput({ type: "date", value: "1990-01-01", "aria-label": "Birth date" });
  const at = textInput({ type: "date", value: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`, "aria-label": "Age at date" });

  const age = el("span", { class: "mvb-kv__v" }, "-");
  const totalDays = el("span", { class: "mvb-kv__v" }, "-");
  const nextDate = el("span", { class: "mvb-kv__v" }, "-");
  const nextIn = el("span", { class: "mvb-kv__v" }, "-");
  const kv = el(
    "div",
    { class: "mvb-kv" },
    kvRow("Age", age),
    kvRow("Total days", totalDays),
    kvRow("Next birthday", nextDate),
    kvRow("Until next birthday", nextIn)
  );
  const error = notice("error");
  let text = "";

  function clear() {
    age.textContent = "-";
    totalDays.textContent = "-";
    nextDate.textContent = "-";
    nextIn.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    const born = parseDate(birth.value);
    const measure = parseDate(at.value);
    if (!born || !measure) {
      clear();
      error.write("Enter a valid birth date and measure date.");
      return;
    }
    if (measure < born) {
      clear();
      error.write("The measure date is before the birth date.");
      return;
    }
    const diff = calendarDiff(born, measure);
    const total = Math.round((measure - born) / DAY);

    let next = new Date(measure.getFullYear(), born.getMonth(), born.getDate());
    if (next < measure) next = new Date(measure.getFullYear() + 1, born.getMonth(), born.getDate());
    const untilNext = Math.round((next - measure) / DAY);

    age.textContent = `${diff.years} years ${diff.months} months ${diff.days} days`;
    totalDays.textContent = String(total);
    nextDate.textContent = next.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    nextIn.textContent = untilNext === 0 ? "Today" : `${untilNext} days`;
    text = `${diff.years} years ${diff.months} months ${diff.days} days`;
  }

  for (const input of [birth, at]) input.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Birth date", birth), panel("Age at", at), error),
      stack(panel("Result", kv))
    ),
    foot: actions(copyButton(() => text, "Copy age", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
