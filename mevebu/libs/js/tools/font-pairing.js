// Preview a heading and body font pair, then copy the CSS font stacks.
import { el, bench, stack, panel, selectInput, rangeInput, chipRow, output, copyButton, actions, toolcard } from "../core.js";

const FONTS = [
  { value: "system-ui, sans-serif", label: "System UI" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: "Tahoma, Verdana, sans-serif", label: "Tahoma" },
  { value: '"Trebuchet MS", sans-serif', label: "Trebuchet MS" },
  { value: "Georgia, \"Times New Roman\", serif", label: "Georgia" },
  { value: '"Times New Roman", Times, serif', label: "Times New Roman" },
  { value: 'Palatino, "Palatino Linotype", serif', label: "Palatino" },
  { value: "Garamond, Georgia, serif", label: "Garamond" },
  { value: '"Courier New", Courier, monospace', label: "Courier New" },
  { value: "ui-monospace, SFMono-Regular, Menlo, monospace", label: "Mono" },
];

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
  const headingFont = selectInput(FONTS, { value: "Georgia, \"Times New Roman\", serif", "aria-label": "Heading font" });
  const bodyFont = selectInput(FONTS, { value: "system-ui, sans-serif", "aria-label": "Body font" });
  const headingSize = slider("Heading size", { min: 20, max: 72, step: 1, value: 40, unit: "px" });
  const bodySize = slider("Body size", { min: 12, max: 24, step: 1, value: 16, unit: "px" });
  const lineHeight = slider("Line height", { min: 1, max: 2, step: 0.05, value: 1.5, unit: "" });
  let weight = 700;

  const weightChips = chipRow(
    [400, 500, 600, 700, 800].map((n) => ({ value: n, label: String(n) })),
    { value: weight, label: "Heading weight", onChange: (value) => { weight = value; update(); } }
  );

  const heading = el("h2", { style: "margin:0 0 8px" }, "Heading sample");
  const para = el("p", { style: "margin:0" }, "Body text sample. The quick brown fox jumps over the lazy dog.");
  const sample = el("div", { class: "mvb-preview__sample" }, heading, para);
  const code = output();

  function css() {
    const hs = headingSize.value();
    const bs = bodySize.value();
    const lh = lineHeight.value();
    return `h1 {\n  font-family: ${headingFont.value};\n  font-size: ${hs}px;\n  font-weight: ${weight};\n}\nbody {\n  font-family: ${bodyFont.value};\n  font-size: ${bs}px;\n  line-height: ${lh};\n}`;
  }

  function update() {
    heading.style.fontFamily = headingFont.value;
    heading.style.fontSize = `${headingSize.value()}px`;
    heading.style.fontWeight = String(weight);
    para.style.fontFamily = bodyFont.value;
    para.style.fontSize = `${bodySize.value()}px`;
    para.style.lineHeight = String(lineHeight.value());
    code.write(css());
  }

  headingFont.addEventListener("change", update);
  bodyFont.addEventListener("change", update);
  headingSize.input.addEventListener("input", () => { headingSize.setVal(`${headingSize.value()}px`); update(); });
  bodySize.input.addEventListener("input", () => { bodySize.setVal(`${bodySize.value()}px`); update(); });
  lineHeight.input.addEventListener("input", () => { lineHeight.setVal(`${lineHeight.value()}`); update(); });

  const card = toolcard({
    body: bench(
      stack(panel("Heading font", headingFont), panel("Body font", bodyFont), headingSize, bodySize, lineHeight, panel("Heading weight", weightChips)),
      stack(sample, code)
    ),
    foot: actions(copyButton(css, "Copy CSS", "fill")),
  });
  slot.append(card.node);
  update();

  return {};
}

export default { mount };
