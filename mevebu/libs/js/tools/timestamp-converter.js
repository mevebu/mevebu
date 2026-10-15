// Converts between Unix time and dates. Reads seconds or milliseconds.
import { el, bench, stack, panel, textInput, notice, button, copyButton, actions, toolcard } from "../core.js";

function relative(date) {
  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);
  const units = [
    ["year", 31536000000], ["month", 2592000000], ["day", 86400000],
    ["hour", 3600000], ["minute", 60000], ["second", 1000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) {
      const value = Math.round(abs / ms);
      const word = `${value} ${unit}${value === 1 ? "" : "s"}`;
      return diff >= 0 ? `${word} ago` : `in ${word}`;
    }
  }
  return "now";
}

function parse(text) {
  const value = text.trim();
  if (!value) return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const num = Number(value);
    const ms = Math.abs(num) < 1e11 ? num * 1000 : num;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const row = (key, value) =>
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const source = textInput({ value: "1700000000", "aria-label": "Timestamp or date", placeholder: "1700000000 or 2026-01-01T00:00:00Z" });
  const kv = el("div", { class: "mvb-kv" });
  const error = notice("error");
  let iso = "";

  function run() {
    error.write("");
    kv.replaceChildren();
    iso = "";
    if (!source.value.trim()) return;
    const date = parse(source.value);
    if (!date) {
      error.write("That is not a timestamp or a date this browser can read.");
      return;
    }
    iso = date.toISOString();
    kv.append(
      row("ISO 8601", iso),
      row("Unix seconds", String(Math.floor(date.getTime() / 1000))),
      row("Unix milliseconds", String(date.getTime())),
      row("UTC", date.toUTCString()),
      row("Local", date.toLocaleString()),
      row("Relative", relative(date))
    );
  }

  source.addEventListener("input", run);

  const nowButton = button("Use current time", { icon: "clock" });
  nowButton.addEventListener("click", () => {
    source.value = String(Math.floor(Date.now() / 1000));
    run();
  });

  const card = toolcard({
    body: bench(
      stack(panel("Timestamp or date", source), error),
      stack(panel("Reading", kv))
    ),
    foot: actions(nowButton, copyButton(() => iso, "Copy ISO 8601", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
