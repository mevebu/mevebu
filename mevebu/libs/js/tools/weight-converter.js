// Converts a mass between metric and imperial units, with the factor used.
import { el, bench, stack, panel, numberInput, selectInput, notice, copyButton, button, actions, toolcard } from "../core.js";

const UNITS = [
  { value: "mg", label: "Milligram", factor: 0.001 },
  { value: "g", label: "Gram", factor: 1 },
  { value: "kg", label: "Kilogram", factor: 1000 },
  { value: "t", label: "Tonne", factor: 1000000 },
  { value: "oz", label: "Ounce", factor: 28.349523125 },
  { value: "lb", label: "Pound", factor: 453.59237 },
  { value: "st", label: "Stone", factor: 6350.29318 }];

const byId = Object.fromEntries(UNITS.map((unit) => [unit.value, unit]));
const options = UNITS.map(({ value, label }) => ({ value, label }));

function fmt(value) {
  if (!Number.isFinite(value)) return "-";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e-6 && abs < 1e15) return String(Number(value.toPrecision(8)));
  return value.toExponential(4);
}

export function mount(slot) {
  const value = numberInput({ value: "1", step: "any", "aria-label": "Value" });
  const from = selectInput(options, { value: "kg", "aria-label": "From unit" });
  const to = selectInput(options, { value: "lb", "aria-label": "To unit" });
  const result = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "-");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, el("span", { class: "text-2xs font-semibold text-ink-3" }, "Result"), result));
  const factor = el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" });
  const error = notice("error");
  const scroll = el("div", { class: "max-h-80 overflow-auto" });
  let text = "";

  function run() {
    error.write("");
    const raw = value.value.trim();
    const n = Number(raw);
    if (!raw || !Number.isFinite(n)) {
      result.textContent = "-";
      factor.textContent = "";
      scroll.replaceChildren();
      text = "";
      error.write("Enter a number.");
      return;
    }
    const a = byId[from.value];
    const b = byId[to.value];
    const out = (n * a.factor) / b.factor;
    result.textContent = `${fmt(out)} ${b.value}`;
    factor.textContent = `1 ${a.value} = ${fmt(a.factor / b.factor)} ${b.value}`;
    scroll.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
      el("thead", {}, el("tr", {}, el("th", {}, "Unit"), el("th", {}, "Value"))),
      el("tbody", {}, ...UNITS.map((unit) => el("tr", {},
        el("td", {}, unit.label),
        el("td", {}, fmt((n * a.factor) / unit.factor)))))));
    text = `${fmt(out)} ${b.value}`;
  }

  value.addEventListener("input", run);
  from.addEventListener("change", run);
  to.addEventListener("change", run);

  const swap = button("Swap", { icon: "arrow-left-right", onclick: () => {
    const held = from.value;
    from.value = to.value;
    to.value = held;
    run();
  }});

  const card = toolcard({
    body: bench(
      stack(panel("Value", value), panel("From", from), panel("To", to), error),
      stack(panel("Result", stats), factor, panel("All units", scroll))
    ),
    foot: actions(swap, copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
