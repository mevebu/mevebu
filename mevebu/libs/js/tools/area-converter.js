// Converts an area between metric and imperial units, with the factor used.
import { el, bench, stack, panel, numberInput, selectInput, notice, copyButton, button, actions, toolcard } from "../core.js";

const UNITS = [
  { value: "mm2", label: "Square millimeter", factor: 0.000001 },
  { value: "cm2", label: "Square centimeter", factor: 0.0001 },
  { value: "m2", label: "Square meter", factor: 1 },
  { value: "ha", label: "Hectare", factor: 10000 },
  { value: "km2", label: "Square kilometer", factor: 1000000 },
  { value: "in2", label: "Square inch", factor: 0.00064516 },
  { value: "ft2", label: "Square foot", factor: 0.09290304 },
  { value: "yd2", label: "Square yard", factor: 0.83612736 },
  { value: "acre", label: "Acre", factor: 4046.8564224 },
];

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
  const from = selectInput(options, { value: "m2", "aria-label": "From unit" });
  const to = selectInput(options, { value: "ft2", "aria-label": "To unit" });
  const result = el("span", { class: "mvb-stat__v" }, "-");
  const stats = el("div", { class: "mvb-stats" }, el("div", { class: "mvb-stat" }, el("span", { class: "mvb-stat__k" }, "Result"), result));
  const factor = el("p", { class: "mvb-note" });
  const error = notice("error");
  const scroll = el("div", { class: "mvb-scroll" });
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
    scroll.replaceChildren(el("table", { class: "mvb-ttable" },
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
    foot: actions(swap, copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
