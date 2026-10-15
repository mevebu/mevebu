// Check the contrast between text and background against WCAG.
import { el, bench, stack, panel, colorInput, button, copyButton, actions, toolcard } from "../core.js";

function hexToRgb(hex) {
  const clean = String(hex).trim().replace(/^#/, "");
  let value;
  if (/^[0-9a-f]{3}$/i.test(clean)) value = parseInt(clean.split("").map((c) => c + c).join(""), 16);
  else if (/^[0-9a-f]{6}$/i.test(clean)) value = parseInt(clean, 16);
  else return null;
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function luminance({ r, g, b }) {
  const step = (value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * step(r) + 0.7152 * step(g) + 0.0722 * step(b);
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export function mount(slot) {
  const textPicker = colorInput({ value: "#111111", "aria-label": "Text color" });
  const bgPicker = colorInput({ value: "#ffffff", "aria-label": "Background color" });

  const kvRow = (key) => {
    const value = el("span", { class: "mvb-kv__v" }, "-");
    return { v: value, node: el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), value) };
  };
  const ratioRow = kvRow("Contrast ratio");
  const normalAA = kvRow("Normal text AA");
  const normalAAA = kvRow("Normal text AAA");
  const largeAA = kvRow("Large text AA");
  const largeAAA = kvRow("Large text AAA");
  const list = el("div", { class: "mvb-kv" }, ratioRow.node, normalAA.node, normalAAA.node, largeAA.node, largeAAA.node);

  const sample = el(
    "div",
    { class: "mvb-preview__sample" },
    el("p", { style: "margin:0 0 8px;font-size:20px;font-weight:700" }, "Large text sample"),
    el("p", { style: "margin:0;font-size:15px" }, "Normal text sample for the contrast reading.")
  );

  let reading = "";

  const pass = (ok) => (ok ? "Pass" : "Fail");

  function update() {
    const text = hexToRgb(textPicker.value);
    const bg = hexToRgb(bgPicker.value);
    const value = ratio(text, bg);
    ratioRow.v.textContent = `${value.toFixed(2)}:1`;
    normalAA.v.textContent = pass(value >= 4.5);
    normalAAA.v.textContent = pass(value >= 7);
    largeAA.v.textContent = pass(value >= 3);
    largeAAA.v.textContent = pass(value >= 4.5);
    sample.style.color = textPicker.value;
    sample.style.background = bgPicker.value;
    reading = `Contrast ${value.toFixed(2)}:1\nNormal text: AA ${pass(value >= 4.5)}, AAA ${pass(value >= 7)}\nLarge text: AA ${pass(value >= 3)}, AAA ${pass(value >= 4.5)}`;
  }

  textPicker.addEventListener("input", update);
  bgPicker.addEventListener("input", update);

  const swap = button("Swap", { icon: "arrow-left-right" });
  swap.addEventListener("click", () => {
    const text = textPicker.value;
    textPicker.value = bgPicker.value;
    bgPicker.value = text;
    update();
  });

  const card = toolcard({
    body: bench(
      stack(panel("Text color", textPicker), panel("Background color", bgPicker)),
      stack(sample, list)
    ),
    foot: actions(swap, copyButton(() => reading, "Copy result", "fill")),
  });
  slot.append(card.node);
  update();

  return {};
}

export default { mount };
