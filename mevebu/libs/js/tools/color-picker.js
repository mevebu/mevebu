// Pick a color and read its hex, rgb and hsl codes.
import { el, toast, copyText, bench, stack, panel, row, textInput, colorInput, notice, copyButton, actions, toolcard } from "../core.js";

function hexToRgb(hex) {
  const clean = String(hex).trim().replace(/^#/, "");
  let value;
  if (/^[0-9a-f]{3}$/i.test(clean)) value = parseInt(clean.split("").map((c) => c + c).join(""), 16);
  else if (/^[0-9a-f]{6}$/i.test(clean)) value = parseInt(clean, 16);
  else return null;
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
const toHex = ({ r, g, b }) => `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;

function toHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: Math.round(h * 60), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function mount(slot) {
  const picker = colorInput({ value: "#f5b942", "aria-label": "Pick a color" });
  const hexInput = textInput({ value: "#F5B942", class: "mvb-in mvb-in--mono", "aria-label": "Hex value" });
  const swatch = el("div", { class: "mvb-swatch" });
  const error = notice("error");
  let current = "#f5b942";

  const readonly = (label) => {
    const field = textInput({ readonly: true, class: "mvb-in mvb-in--mono", "aria-label": `${label}, press to copy` });
    const wrap = panel(label, field);
    wrap.style.cursor = "pointer";
    wrap.addEventListener("click", async () => {
      if (!field.value) return;
      field.select();
      toast((await copyText(field.value)) ? "Copied" : "Copy failed");
    });
    return wrap;
  };
  const hexField = readonly("Hex");
  const rgbField = readonly("RGB");
  const hslField = readonly("HSL");

  function show(text, fromPicker) {
    const rgb = hexToRgb(text);
    if (!rgb) return false;
    current = toHex(rgb);
    const { h, s, l } = toHsl(rgb);
    hexField.querySelector("input").value = current.toUpperCase();
    rgbField.querySelector("input").value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    hslField.querySelector("input").value = `hsl(${h}, ${s}%, ${l}%)`;
    swatch.style.background = current;
    if (fromPicker) hexInput.value = current.toUpperCase();
    else picker.value = current;
    return true;
  }

  function read(text, fromPicker) {
    if (show(text, fromPicker)) error.write("");
    else error.write("That color was not recognized.");
  }

  hexInput.addEventListener("input", () => read(hexInput.value, false));
  picker.addEventListener("input", () => read(picker.value, true));

  const card = toolcard({
    body: bench(
      stack(panel("Color", row(picker, hexInput)), error, panel(null, swatch)),
      stack(hexField, rgbField, hslField)
    ),
    foot: actions(
      copyButton(() => `--color: ${current};`, "Copy CSS"),
      copyButton(() => current, "Copy hex", "fill")
    ),
  });
  slot.append(card.node);
  read("#F5B942", false);

  return {};
}

export default { mount };
