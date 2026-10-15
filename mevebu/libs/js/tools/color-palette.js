// A matching palette from one base color: analogous, complementary or monochrome.
import { el, toast, copyText, bench, stack, panel, chipRow, colorInput, copyButton, actions, toolcard } from "../core.js";

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
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r;
  let g;
  let b;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

const hslToHex = (h, s, l) => toHex(hslToRgb(h, s / 100, Math.max(0.06, Math.min(0.94, l / 100))));

function palette(hex, scheme) {
  const { h, s, l } = toHsl(hexToRgb(hex));
  const mix = (dh, dl) => hslToHex(h + dh, s * 100, l * 100 + dl);
  if (scheme === "monochrome") return [-30, -15, 0, 15, 30].map((d) => mix(0, d));
  if (scheme === "complementary") return [mix(0, 0), mix(180, 0), mix(0, -22), mix(180, -22), mix(0, 22)];
  return [-40, -20, 0, 20, 40].map((d) => mix(d, 0));
}

export function mount(slot) {
  const picker = colorInput({ value: "#f5b942", "aria-label": "Base color" });
  const swatches = el("div", { class: "grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(96px,1fr))]" });
  let colors = [];
  let scheme = "analogous";

  const chips = chipRow(
    [
      { value: "analogous", label: "Analogous" },
      { value: "complementary", label: "Complementary" },
      { value: "monochrome", label: "Monochrome" }],
    { value: scheme, label: "Scheme", onChange: (value) => { scheme = value; paint(); } }
  );

  async function copyOne(hex) {
    toast((await copyText(hex)) ? "Copied" : "Copy failed");
  }

  function paint() {
    colors = palette(picker.value, scheme);
    swatches.replaceChildren(
      ...colors.map((hex) =>
        el(
          "button",
          { class: "grid cursor-pointer gap-1.5 rounded-r1 border border-orbit bg-deck p-2 text-start transition-colors duration-150 hover:border-jade", type: "button", onclick: () => copyOne(hex) },
          el("span", { class: "h-[52px] rounded-lg border border-orbit-hard", style: `background:${hex}` }),
          el("span", { class: "font-mono text-2xs text-ink-2" }, hex)
        )
      )
    );
  }

  picker.addEventListener("input", paint);

  const card = toolcard({
    body: bench(
      stack(panel("Base color", picker), panel("Scheme", chips)),
      stack(swatches)
    ),
    foot: actions(
      copyButton(() => colors.map((hex, i) => `--color-${i + 1}: ${hex};`).join("\n"), "Copy CSS variables", "fill")
    )});
  slot.append(card.node);
  paint();

  return {};
}

export default { mount };
