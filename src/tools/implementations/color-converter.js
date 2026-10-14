// Color Converter — HEX ⇄ RGB ⇄ HSL with live swatch
import { el, icon, toast, copyText } from "../../lib/dom.js";

function parseColor(str) {
  str = str.trim().toLowerCase();
  let m;
  if ((m = /^#?([0-9a-f]{3})$/.exec(str))) {
    const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16));
    return { r, g, b, a: 1 };
  }
  if ((m = /^#?([0-9a-f]{6})$/.exec(str))) {
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  if ((m = /^#?([0-9a-f]{8})$/.exec(str))) {
    const n = parseInt(m[1].slice(0, 6), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: parseInt(m[1].slice(6, 8), 16) / 255 };
  }
  if ((m = /^rgba?\(([^)]+)\)$/.exec(str))) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  return null;
}
const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
const toHex = ({ r, g, b }) => "#" + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, "0")).join("");
function toHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function luminance({ r, g, b }) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function mount(container) {
  const picker = el("input", { class: "tpicker", type: "color", value: "#f5b942" });
  const hexIn = el("input", { class: "tinput code", value: "#F5B942" });
  const swatch = el("div", { class: "swatch" });
  const contrast = el("div", { class: "tnote" }, "");

  const mk = (label) => {
    const inp = el("input", { class: "tinput tout code", readonly: true });
    inp.addEventListener("click", async () => ((await copyText(inp.value)) && toast(`${label} copied ✓`)));
    return el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, `${label} (click to copy)`), inp);
  };
  const rgbRow = mk("RGB"), hslRow = mk("HSL"), cssRow = mk("CSS var");
  const rgbInput = rgbRow.querySelector("input"), hslInput = hslRow.querySelector("input"), cssInput = cssRow.querySelector("input");

  function apply(str, fromPicker) {
    const c = parseColor(str);
    if (!c) { contrast.textContent = "⚠ Unrecognized color format"; return; }
    const hex = toHex(c);
    if (!fromPicker) { hexIn.value = hex.toUpperCase(); picker.value = hex; }
    else hexIn.value = hex.toUpperCase();
    const { h, s, l } = toHsl(c);
    rgbInput.value = c.a < 1 ? `rgba(${clamp255(c.r)}, ${clamp255(c.g)}, ${clamp255(c.b)}, ${+c.a.toFixed(2)})` : `rgb(${clamp255(c.r)}, ${clamp255(c.g)}, ${clamp255(c.b)})`;
    hslInput.value = `hsl(${h}, ${s}%, ${l}%)`;
    cssInput.value = `--color: ${hex.toLowerCase()};`;
    swatch.style.background = hex;
    const lum = luminance(c);
    const ratioWhite = (1.05) / (lum + 0.05), ratioBlack = (lum + 0.05) / 0.05;
    contrast.textContent = `Contrast on white ${ratioWhite.toFixed(2)}:1 · on black ${ratioBlack.toFixed(2)}:1`;
  }

  hexIn.addEventListener("input", () => apply(hexIn.value, false));
  picker.addEventListener("input", () => { picker.value = picker.value; apply(picker.value, true); swatch.style.background = picker.value; hexIn.value = picker.value.toUpperCase(); const c = parseColor(picker.value); if (c) { const { h, s, l } = toHsl(c); rgbInput.value = `rgb(${c.r}, ${c.g}, ${c.b})`; hslInput.value = `hsl(${h}, ${s}%, ${l}%)`; cssInput.value = `--color: ${picker.value.toLowerCase()};` } });

  container.append(el("div", { class: "split" },
    el("div", { class: "tstack" },
      el("div", { class: "trow" },
        el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Picker"), picker),
        el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "HEX / rgb() / hsl() input"), hexIn)),
      swatch, contrast),
    el("div", { class: "tstack" }, rgbRow, hslRow, cssRow)));
  apply("#F5B942", false);
  return {};
}
export default { mount };
