// Builds a cron expression and reads it back in plain words.
import { el, bench, stack, panel, textInput, notice, button, copyButton, actions, toolcard } from "../core.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const pad = (value) => String(value).padStart(2, "0");

function nameList(value, names, offset) {
  return value.split(",").map((part) => {
    if (/^\d+$/.test(part)) return names[(Number(part) - offset + names.length) % names.length] ?? part;
    if (part.includes("-")) {
      const [a, b] = part.split("-");
      const from = names[(Number(a) - offset + names.length) % names.length] ?? a;
      const to = names[(Number(b) - offset + names.length) % names.length] ?? b;
      return `${from} through ${to}`;
    }
    return part;
  }).join(", ");
}

function describe([minute, hour, day, month, weekday]) {
  const parts = [];
  const step = (value) => (value.startsWith("*/") ? value.slice(2) : null);
  if (minute === "*" && hour === "*") parts.push("Every minute");
  else if (step(minute) && hour === "*") parts.push(`Every ${step(minute)} minutes`);
  else if (/^\d+$/.test(minute) && hour === "*") parts.push(`Every hour at minute ${Number(minute)}`);
  else if (/^\d+$/.test(minute) && /^\d+$/.test(hour)) parts.push(`At ${pad(hour)}:${pad(minute)}`);
  else parts.push(`Minute ${minute}, hour ${hour}`);
  if (weekday !== "*") parts.push(`on ${nameList(weekday, WEEKDAYS, 0)}`);
  else if (day !== "*") parts.push(`on day ${day} of the month`);
  if (month !== "*") parts.push(`in ${nameList(month, MONTHS, 1)}`);
  return `${parts.join(" ")}.`;
}

const FIELDS = [
  ["minute", "Minute", "0-59", "*"],
  ["hour", "Hour", "0-23", "*"],
  ["day", "Day of month", "1-31", "*"],
  ["month", "Month", "1-12", "*"],
  ["weekday", "Day of week", "0-6", "*"]];

export function mount(slot) {
  const inputs = {};
  const controls = FIELDS.map(([key, label, hint, value]) => {
    const input = textInput({ value, "aria-label": label, spellcheck: "false" });
    inputs[key] = input;
    return panel(label, input, hint);
  });

  const expression = textInput({ readonly: true, mono: true, "aria-label": "Cron expression" });
  const reading = el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" });
  const error = notice("error");

  function run() {
    error.write("");
    const values = FIELDS.map(([key]) => inputs[key].value.trim() || "*");
    const invalid = values.find((value) => !/^[\d*,/\-\s]+$/.test(value));
    if (invalid) {
      error.write("Fields accept numbers, *, lists with commas, ranges with a hyphen and steps with a slash.");
      expression.value = "";
      reading.textContent = "";
      return;
    }
    expression.value = values.join(" ");
    reading.textContent = describe(values);
  }

  for (const key of Object.keys(inputs)) inputs[key].addEventListener("input", run);

  const reset = button("Reset to every minute", { icon: "refresh-cw" });
  reset.addEventListener("click", () => {
    for (const [key, , , value] of FIELDS) inputs[key].value = value;
    run();
  });

  const card = toolcard({
    body: bench(
      stack(...controls, error),
      stack(panel("Expression", expression), panel("Reading", reading))
    ),
    foot: actions(reset, copyButton(() => expression.value, "Copy expression", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
