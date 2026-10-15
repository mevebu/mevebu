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
  ["ja-JP", "Japanese"]];

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

  const table = el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" });
  const tableWrap = el("div", { class: "max-h-80 overflow-auto" }, table);
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
      useGrouping: grouping.input.checked};
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
    foot: actions(copyButton(() => tableText, "Copy list", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
