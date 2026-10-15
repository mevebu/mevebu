// Build a fluid size with the CSS clamp function.
import { el, bench, stack, rangeInput, output, copyButton, actions, toolcard } from "../core.js";

function slider(label, { min, max, step, value, unit }) {
  const input = rangeInput({ min, max, step, value, "aria-label": label });
  const val = el("span", { class: "mvb-slider__val" }, `${value}${unit}`);
  const node = el(
    "div",
    { class: "mvb-slider" },
    el("span", { class: "mvb-slider__label" }, label),
    input,
    val
  );
  node.input = input;
  node.value = () => parseFloat(input.value) || 0;
  node.setVal = (text) => { val.textContent = text; };
  return node;
}

export function mount(slot) {
  const min = slider("Minimum", { min: 8, max: 96, step: 1, value: 16, unit: "px" });
  const preferred = slider("Preferred", { min: 1, max: 10, step: 0.1, value: 2.5, unit: "vw" });
  const max = slider("Maximum", { min: 8, max: 160, step: 1, value: 48, unit: "px" });

  const sample = el(
    "div",
    { class: "mvb-preview__sample" },
    el("p", { style: "margin:0" }, "The quick brown fox jumps over the lazy dog.")
  );
  const code = output();

  function clampValue() {
    let lo = min.value();
    let hi = max.value();
    if (lo > hi) [lo, hi] = [hi, lo];
    return `clamp(${lo}px, ${preferred.value()}vw, ${hi}px)`;
  }

  function update() {
    const value = clampValue();
    sample.style.fontSize = value;
    code.write(`font-size: ${value};`);
  }

  for (const control of [min, preferred, max]) {
    const unit = control === preferred ? "vw" : "px";
    control.input.addEventListener("input", () => {
      control.setVal(`${control.value()}${unit}`);
      update();
    });
  }

  const card = toolcard({
    body: bench(
      stack(min, preferred, max),
      stack(sample, code)
    ),
    foot: actions(copyButton(() => `font-size: ${clampValue()};`, "Copy CSS", "fill")),
  });
  slot.append(card.node);
  update();

  return {};
}

export default { mount };
