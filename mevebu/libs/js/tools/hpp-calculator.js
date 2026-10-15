// Total production cost and the cost to make one unit.
import { el, bench, stack, panel, numberInput, notice, copyButton, actions, toolcard } from "../core.js";

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "-");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const material = numberInput({ value: "0", min: "0", "aria-label": "Material cost" });
  const labour = numberInput({ value: "0", min: "0", "aria-label": "Labour cost" });
  const overhead = numberInput({ value: "0", min: "0", "aria-label": "Overhead cost" });
  const units = numberInput({ value: "1", min: "1", "aria-label": "Units made" });
  const total = tile("Total cost");
  const perUnit = tile("Cost per unit");
  const stats = el("div", { class: "mvb-stats" }, total, perUnit);
  const error = notice("error");
  let text = "";

  function clear() {
    total.set("-");
    perUnit.set("-");
    text = "";
  }

  function run() {
    error.write("");
    const inputs = [material, labour, overhead, units];
    const values = inputs.map((input) => Number(input.value));
    if (inputs.some((input) => input.value.trim() === "") || !values.every(Number.isFinite)) {
      clear();
      return;
    }
    const [m, l, o, u] = values;
    if (m < 0 || l < 0 || o < 0) { clear(); error.write("The costs cannot be negative."); return; }
    if (u <= 0) { clear(); error.write("The units must be above zero."); return; }
    const sum = m + l + o;
    total.set(fmt(sum));
    perUnit.set(fmt(sum / u));
    text = `Total cost ${fmt(sum)}, cost per unit ${fmt(sum / u)}`;
  }

  for (const input of [material, labour, overhead, units]) input.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Material cost", material),
        panel("Labour cost", labour),
        panel("Overhead cost", overhead),
        panel("Units made", units),
        error
      ),
      stack(stats)
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
