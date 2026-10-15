// Converts between Celsius, Fahrenheit and Kelvin, with the formula shown.
import { el, bench, stack, panel, numberInput, selectInput, notice, copyButton, button, actions, toolcard } from "../core.js";

const SCALES = [
  { value: "c", label: "Celsius" },
  { value: "f", label: "Fahrenheit" },
  { value: "k", label: "Kelvin" },
];

const byId = Object.fromEntries(SCALES.map((scale) => [scale.value, scale]));
const options = SCALES.map(({ value, label }) => ({ value, label }));

const toCelsius = (n, scale) => (scale === "c" ? n : scale === "f" ? ((n - 32) * 5) / 9 : n - 273.15);
const fromCelsius = (c, scale) => (scale === "c" ? c : scale === "f" ? (c * 9) / 5 + 32 : c + 273.15);

const FORMULAS = {
  "c-f": "F = C x 9/5 + 32",
  "c-k": "K = C + 273.15",
  "f-c": "C = (F - 32) x 5/9",
  "f-k": "K = (F - 32) x 5/9 + 273.15",
  "k-c": "C = K - 273.15",
  "k-f": "F = (K - 273.15) x 9/5 + 32",
};

function fmt(value) {
  if (!Number.isFinite(value)) return "-";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e-6 && abs < 1e15) return String(Number(value.toPrecision(8)));
  return value.toExponential(4);
}

export function mount(slot) {
  const value = numberInput({ value: "0", step: "any", "aria-label": "Value" });
  const from = selectInput(options, { value: "c", "aria-label": "From scale" });
  const to = selectInput(options, { value: "f", "aria-label": "To scale" });
  const result = el("span", { class: "mvb-stat__v" }, "-");
  const stats = el("div", { class: "mvb-stats" }, el("div", { class: "mvb-stat" }, el("span", { class: "mvb-stat__k" }, "Result"), result));
  const formula = el("p", { class: "mvb-note" });
  const error = notice("error");
  const scroll = el("div", { class: "mvb-scroll" });
  let text = "";

  function run() {
    error.write("");
    const raw = value.value.trim();
    const n = Number(raw);
    if (!raw || !Number.isFinite(n)) {
      result.textContent = "-";
      formula.textContent = "";
      scroll.replaceChildren();
      text = "";
      error.write("Enter a number.");
      return;
    }
    const a = byId[from.value];
    const b = byId[to.value];
    const celsius = toCelsius(n, a.value);
    const out = fromCelsius(celsius, b.value);
    result.textContent = `${fmt(out)} ${b.value === "k" ? "K" : `°${b.value.toUpperCase()}`}`;
    formula.textContent = a.value === b.value ? "" : FORMULAS[`${a.value}-${b.value}`];
    scroll.replaceChildren(el("table", { class: "mvb-ttable" },
      el("thead", {}, el("tr", {}, el("th", {}, "Scale"), el("th", {}, "Value"))),
      el("tbody", {}, ...SCALES.map((scale) => el("tr", {},
        el("td", {}, scale.label),
        el("td", {}, fmt(fromCelsius(celsius, scale.value))))))));
    text = `${fmt(out)} ${b.label}`;
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
      stack(panel("Result", stats), formula, panel("All scales", scroll))
    ),
    foot: actions(swap, copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
