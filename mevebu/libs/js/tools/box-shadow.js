// Build a CSS box-shadow with a live preview.
import { el, bench, stack, panel, rangeInput, colorInput, switchControl, output, copyButton, actions, toolcard } from "../core.js";

function hexToRgb(hex) {
  const clean = String(hex).trim().replace(/^#/, "");
  const value = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function slider(label, { min, max, value, unit = "px" }) {
  const input = rangeInput({ min, max, value, "aria-label": label });
  const val = el("span", { class: "text-end font-mono text-2xs text-ink-2" }, `${value}${unit}`);
  const node = el(
    "div",
    { class: "grid items-center gap-2.5 [grid-template-columns:88px_minmax(0,1fr)_62px] max-[45rem]:[grid-template-columns:minmax(0,1fr)_62px]" },
    el("span", { class: "text-2xs font-semibold text-ink-2 max-[45rem]:col-span-2" }, label),
    input,
    val
  );
  node.input = input;
  node.value = () => parseFloat(input.value) || 0;
  node.setVal = (text) => { val.textContent = text; };
  return node;
}

export function mount(slot) {
  const x = slider("X offset", { min: -50, max: 50, value: 0 });
  const y = slider("Y offset", { min: -50, max: 50, value: 8 });
  const blur = slider("Blur", { min: 0, max: 100, value: 24 });
  const spread = slider("Spread", { min: -50, max: 50, value: 0 });
  const opacity = slider("Opacity", { min: 0, max: 100, value: 35, unit: "%" });
  const picker = colorInput({ value: "#1b1b1f", "aria-label": "Shadow color" });
  const inset = switchControl("Inset", {});
  const previewBox = el("div", { class: "grid h-[120px] w-[min(200px,100%)] place-items-center bg-jade text-2xs text-on-jade" });
  const code = output();

  function css() {
    const { r, g, b } = hexToRgb(picker.value);
    const a = (opacity.value() / 100).toFixed(2);
    return `${inset.input.checked ? "inset " : ""}${x.value()}px ${y.value()}px ${blur.value()}px ${spread.value()}px rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function update() {
    previewBox.style.boxShadow = css();
    code.write(`box-shadow: ${css()};`);
  }

  for (const control of [x, y, blur, spread, opacity]) {
    control.input.addEventListener("input", () => {
      const unit = control === opacity ? "%" : "px";
      control.setVal(`${control.value()}${unit}`);
      update();
    });
  }
  picker.addEventListener("input", update);
  inset.input.addEventListener("change", update);

  const card = toolcard({
    body: bench(
      stack(x, y, blur, spread, opacity, panel("Color", picker), inset),
      stack(el("div", { class: "grid min-h-40 place-items-center overflow-hidden rounded-r1 border border-orbit bg-deck-2 p-[22px]" }, previewBox), code)
    ),
    foot: actions(copyButton(() => `box-shadow: ${css()};`, "Copy CSS", "fill"))});
  slot.append(card.node);
  update();

  return {};
}

export default { mount };
