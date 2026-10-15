// Variance and standard deviation for a population or a sample.
import { el, bench, stack, panel, textArea, notice, copyButton, chipRow, actions, toolcard } from "../core.js";

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function parseNumbers(text) {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  const nums = tokens.map(Number);
  return { nums, invalid: nums.some((n) => !Number.isFinite(n)) };
}

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "-");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 8, value: "2, 4, 4, 4, 5, 5, 7, 9", "aria-label": "Numbers", placeholder: "2, 4, 4, 4, 5, 5, 7, 9" });
  const mean = tile("Mean");
  const variance = tile("Variance");
  const deviation = tile("Std deviation");
  const count = tile("Count");
  const stats = el("div", { class: "mvb-stats" }, mean, variance, deviation, count);
  const error = notice("error");
  let kind = "population";
  let text = "";

  function clear() {
    for (const item of [mean, variance, deviation, count]) item.set("-");
    text = "";
  }

  function run() {
    error.write("");
    const { nums, invalid } = parseNumbers(source.value);
    if (!nums.length) {
      clear();
      return;
    }
    if (invalid) {
      clear();
      error.write("Use numbers only, separated by spaces, commas or new lines.");
      return;
    }
    const n = nums.length;
    if (kind === "sample" && n < 2) {
      clear();
      error.write("A sample needs at least two values.");
      return;
    }
    const average = nums.reduce((acc, value) => acc + value, 0) / n;
    const squares = nums.reduce((acc, value) => acc + (value - average) ** 2, 0);
    const divisor = kind === "sample" ? n - 1 : n;
    const spread = squares / divisor;
    mean.set(fmt(average));
    variance.set(fmt(spread));
    deviation.set(fmt(Math.sqrt(spread)));
    count.set(String(n));
    text = `${kind === "sample" ? "Sample" : "Population"} of ${n}: mean ${fmt(average)}, variance ${fmt(spread)}, standard deviation ${fmt(Math.sqrt(spread))}`;
  }

  const chips = chipRow(
    [
      { value: "population", label: "Population" },
      { value: "sample", label: "Sample" },
    ],
    {
      value: kind,
      label: "Data set",
      onChange: (value) => {
        kind = value;
        run();
      },
    }
  );

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Numbers", source), panel("Data set", chips), error),
      stack(stats)
    ),
    foot: actions(copyButton(() => text, "Copy summary", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
