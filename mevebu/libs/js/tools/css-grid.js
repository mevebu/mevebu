// Lay out a CSS grid: columns, rows and gaps with a live preview.
import { el, bench, stack, panel, numberInput, rangeInput, output, copyButton, actions, toolcard } from "../core.js";

const CELL = "min-height:32px;background:var(--mvb-nebula);border:1px solid var(--mvb-comet);border-radius:6px";

function slider(label, value) {
  const input = rangeInput({ min: 0, max: 48, value, "aria-label": label });
  const val = el("span", { class: "mvb-slider__val" }, `${value}px`);
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

const clampInt = (value, min, max) => Math.max(min, Math.min(max, parseInt(value, 10) || min));

export function mount(slot) {
  const columns = numberInput({ value: 3, min: "1", max: "8", "aria-label": "Columns" });
  const rows = numberInput({ value: 2, min: "1", max: "8", "aria-label": "Rows" });
  const columnGap = slider("Column gap", 12);
  const rowGap = slider("Row gap", 12);

  const grid = el("div");
  const code = output();

  function declarations() {
    const c = clampInt(columns.value, 1, 8);
    const r = clampInt(rows.value, 1, 8);
    const cg = columnGap.value();
    const rg = rowGap.value();
    const gap = cg === rg ? `gap: ${cg}px;` : `gap: ${rg}px ${cg}px;`;
    return { c, r, cg, rg, gap };
  }

  function update() {
    const { c, r, cg, rg, gap } = declarations();
    grid.style.display = "grid";
    grid.style.width = "100%";
    grid.style.gridTemplateColumns = `repeat(${c}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${r}, 1fr)`;
    grid.style.gap = `${rg}px ${cg}px`;
    grid.replaceChildren(...Array.from({ length: c * r }, () => el("div", { style: CELL })));
    code.write(`display: grid;\ngrid-template-columns: repeat(${c}, 1fr);\ngrid-template-rows: repeat(${r}, 1fr);\n${gap}`);
  }

  columns.addEventListener("input", update);
  rows.addEventListener("input", update);
  for (const control of [columnGap, rowGap]) {
    control.input.addEventListener("input", () => {
      control.setVal(`${control.value()}px`);
      update();
    });
  }

  const card = toolcard({
    body: bench(
      stack(panel("Columns", columns), panel("Rows", rows), columnGap, rowGap),
      stack(el("div", { class: "mvb-preview" }, grid), code)
    ),
    foot: actions(copyButton(() => code.textContent, "Copy CSS", "fill")),
  });
  slot.append(card.node);
  update();

  return {};
}

export default { mount };
