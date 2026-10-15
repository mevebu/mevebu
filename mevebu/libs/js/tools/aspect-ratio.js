// Simplify an aspect ratio and find a missing width or height.
import { el, bench, stack, panel, numberInput, output, copyButton, actions, toolcard } from "../core.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const round2 = (n) => Math.round(n * 100) / 100;

export function mount(slot) {
  const width = numberInput({ value: 1920, min: "1", "aria-label": "Width" });
  const height = numberInput({ value: 1080, min: "1", "aria-label": "Height" });

  const ratioValue = el("span", { class: "mvb-kv__v" }, "-");
  const decimalValue = el("span", { class: "mvb-kv__v" }, "-");
  const list = el(
    "div",
    { class: "mvb-kv" },
    el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, "Ratio"), ratioValue),
    el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, "Decimal"), decimalValue)
  );

  const newWidth = numberInput({ value: 800, min: "1", "aria-label": "New width" });
  const newHeight = numberInput({ value: 450, min: "1", "aria-label": "New height" });
  const box = el("div", { class: "mvb-preview__box" });
  const code = output();
  let ratioText = "16 / 9";

  function readSides() {
    const w = parseFloat(width.value) || 0;
    const h = parseFloat(height.value) || 0;
    return { w, h };
  }

  function update() {
    const { w, h } = readSides();
    if (w > 0 && h > 0) {
      const g = gcd(Math.round(w), Math.round(h)) || 1;
      const sw = Math.round(w) / g;
      const sh = Math.round(h) / g;
      ratioText = `${sw} / ${sh}`;
      ratioValue.textContent = `${sw}:${sh}`;
      decimalValue.textContent = (w / h).toFixed(2);
      box.style.height = "auto";
      box.style.aspectRatio = `${w} / ${h}`;
      box.textContent = `${sw}:${sh}`;
      code.write(`aspect-ratio: ${ratioText};`);
      const nw = parseFloat(newWidth.value) || 0;
      if (nw > 0) newHeight.value = round2((nw * h) / w);
    } else {
      ratioValue.textContent = "-";
      decimalValue.textContent = "-";
      code.write("");
    }
  }

  width.addEventListener("input", update);
  height.addEventListener("input", update);

  newWidth.addEventListener("input", () => {
    const { w, h } = readSides();
    const nw = parseFloat(newWidth.value) || 0;
    if (w > 0 && nw > 0) newHeight.value = round2((nw * h) / w);
  });
  newHeight.addEventListener("input", () => {
    const { w, h } = readSides();
    const nh = parseFloat(newHeight.value) || 0;
    if (h > 0 && nh > 0) newWidth.value = round2((nh * w) / h);
  });

  const card = toolcard({
    body: bench(
      stack(panel("Width", width), panel("Height", height), list),
      stack(el("div", { class: "mvb-preview" }, box), panel("New width", newWidth), panel("New height", newHeight), code)
    ),
    foot: actions(copyButton(() => `aspect-ratio: ${ratioText};`, "Copy CSS", "fill")),
  });
  slot.append(card.node);
  update();

  return {};
}

export default { mount };
