// One number shown in several locales, with decimal and grouping options.
import { el, bench, stack, panel, textInput, numberInput, switchControl, notice, copyButton, actions, toolcard } from "../core.js";

const LOCALES = [
  ["en-US", "English (US)"],
  ["en-GB", "English (UK)"],
  ["de-DE", "German"],
  ["fr-FR", "French"],
  ["es-ES", "Spanish"],
  ["id-ID", "Indonesian"],
  ["hi-IN", "Hindi"],
  ["ar-EG", "Arabic"],
  ["ja-JP", "Japanese"],
];

function format(locale, value, options) {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return String(value);
  }
}

export function mount(slot) {
  const value = textInput({ value: "1234567.89", inputmode: "decimal", "aria-label": "Number" });
  const decimals = numberInput({ min: "0", max: "20", value: "2", "aria-label": "Fraction digits" });
  const grouping = switchControl("Group thousands", { checked: true });

  const table = el("table", { class: "mvb-ttable" });
  const tableWrap = el("div", { class: "mvb-scroll" }, table);
  const note = notice("note");
  note.write("Formatting only. The number is not converted.");

  let tableText = "";

  function run() {
    const raw = value.value.trim();
    const parsed = Number(raw);
    const digits = Math.min(20, Math.max(0, parseInt(decimals.value, 10) || 0));
    const options = {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: grouping.input.checked,
    };
    const rows = LOCALES.map(([code, name]) => {
      const shown = raw === "" || !Number.isFinite(parsed) ? "-" : format(code, parsed, options);
      return el("tr", {}, el("th", {}, name), el("td", {}, shown));
    });
    table.replaceChildren(
      el("thead", {}, el("tr", {}, el("th", {}, "Locale"), el("th", {}, "Number"))),
      el("tbody", {}, ...rows));
    tableText = LOCALES.map(([code, name]) => {
      const shown = raw === "" || !Number.isFinite(parsed) ? "-" : format(code, parsed, options);
      return `${name}: ${shown}`;
    }).join("\n");
  }

  value.addEventListener("input", run);
  decimals.addEventListener("input", run);
  grouping.input.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Number", value),
        panel("Fraction digits", decimals),
        panel("Grouping", grouping)
      ),
      stack(note, panel("By locale", tableWrap))
    ),
    foot: actions(copyButton(() => tableText, "Copy list", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
