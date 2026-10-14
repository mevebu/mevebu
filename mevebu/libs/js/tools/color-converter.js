// Hex, rgb and hsl that follow each other, with contrast against black and white.
import { el, toast, copyText, bench, stack, panel, textInput, notice, colorInput, toolcard } from "../core.js";

function parse(text) {
  const clean = text.trim().toLowerCase();
  let found;
  if ((found = /^#?([0-9a-f]{3})$/.exec(clean))) {
    const [r, g, b] = found[1].split("").map((char) => parseInt(char + char, 16));
    return { r, g, b, a: 1 };
  }
  if ((found = /^#?([0-9a-f]{6})$/.exec(clean))) {
    const value = parseInt(found[1], 16);
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255, a: 1 };
  }
  if ((found = /^rgba?\(([^)]+)\)$/.exec(clean))) {
    const parts = found[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  if ((found = /^hsla?\(([^)]+)\)$/.exec(clean))) {
    const parts = found[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    if ([h, s, l].some((part) => Number.isNaN(part))) return null;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r;
    let g;
    let b;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255), a: parts[3] ?? 1 };
  }
  return null;
}

const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
const hexOf = ({ r, g, b }) => `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;

function hslOf({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const light = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(light * 100) };
  const spread = max - min;
  const sat = light > 0.5 ? spread / (2 - max - min) : spread / (max + min);
  let hue = 0;
  if (max === rn) hue = (gn - bn) / spread + (gn < bn ? 6 : 0);
  else if (max === gn) hue = (bn - rn) / spread + 2;
  else hue = (rn - gn) / spread + 4;
  return { h: Math.round(hue * 60), s: Math.round(sat * 100), l: Math.round(light * 100) };
}

function luminance({ r, g, b }) {
  const step = (value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * step(r) + 0.7152 * step(g) + 0.0722 * step(b);
}

export function mount(slot) {
  const anyField = textInput({ value: "#F5B942", class: "mvb-in mvb-in--mono", "aria-label": "Any color" });
  const picker = colorInput({ value: "#f5b942", "aria-label": "Pick a color" });
  const swatch = el("div", { class: "mvb-swatch" });

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
  const cssField = readonly("CSS variable");

  const error = notice("error");
  const reading = el("p", { class: "note" });

  function show(color, keepPicker) {
    const hex = hexOf(color);
    if (!keepPicker) {
      anyField.value = hex.toUpperCase();
      picker.value = hex;
    }
    hexField.querySelector("input").value = hex.toUpperCase();
    const { h, s, l } = hslOf(color);
    rgbField.querySelector("input").value = color.a < 1
      ? `rgba(${clamp(color.r)}, ${clamp(color.g)}, ${clamp(color.b)}, ${+color.a.toFixed(2)})`
      : `rgb(${clamp(color.r)}, ${clamp(color.g)}, ${clamp(color.b)})`;
    hslField.querySelector("input").value = `hsl(${h}, ${s}%, ${l}%)`;
    cssField.querySelector("input").value = `--color: ${hex.toLowerCase()};`;
    swatch.style.background = hex;
    const glow = luminance(color);
    const onWhite = (1.05 / (glow + 0.05)).toFixed(2);
    const onBlack = ((glow + 0.05) / 0.05).toFixed(2);
    reading.textContent = `Contrast ${onWhite}:1 on white, ${onBlack}:1 on black.${Number(onWhite) >= 4.5 ? "" : " Low on white."}${Number(onBlack) >= 4.5 ? "" : " Low on black."}`;
  }

  function read(text, keepPicker) {
    const color = parse(text);
    if (!color) {
      error.write("That color was not recognized.");
      return;
    }
    error.write("");
    show(color, keepPicker);
  }

  anyField.addEventListener("input", () => read(anyField.value, false));
  picker.addEventListener("input", () => read(picker.value, true));

  const card = toolcard({
    body: bench(
      stack(
        panel("Color", el("div", { class: "mvb-row" }, picker, anyField)),
        error,
        panel(null, swatch),
        reading
      ),
      stack(hexField, rgbField, hslField, cssField)
    ),
  });
  slot.append(card.node);
  read("#F5B942", false);

  return {};
}

export default { mount };