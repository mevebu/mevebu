// A percent of a value, or what percent one value is of another.
import { el, bench, stack, panel, numberInput, notice, copyButton, chipRow, actions, toolcard } from "../core.js";

function fmt(n) {
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function mount(slot) {
  const modes = [
    { value: "of", label: "Percent of a value" },
    { value: "is", label: "Value as a percent" }];
  const labelA = el("span", {}, "Percent");
  const labelB = el("span", {}, "Value");
  const a = numberInput({ value: "15", "aria-label": "First value" });
  const b = numberInput({ value: "200", "aria-label": "Second value" });
  const result = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "-");
  const stats = el(
    "div",
    { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" },
    el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, result, el("span", { class: "text-2xs font-semibold text-ink-3" }, "Result"))
  );
  const error = notice("error");
  let mode = "of";
  let text = "";

  function run() {
    error.write("");
    const x = Number(a.value);
    const y = Number(b.value);
    if (a.value.trim() === "" || b.value.trim() === "" || !Number.isFinite(x) || !Number.isFinite(y)) {
      result.textContent = "-";
      text = "";
      return;
    }
    if (mode === "of") {
      const value = (x / 100) * y;
      result.textContent = fmt(value);
      text = `${fmt(x)}% of ${fmt(y)} is ${fmt(value)}`;
      return;
    }
    if (y === 0) {
      result.textContent = "-";
      text = "";
      error.write("The total cannot be zero.");
      return;
    }
    const value = (x / y) * 100;
    result.textContent = `${fmt(value)}%`;
    text = `${fmt(x)} is ${fmt(value)}% of ${fmt(y)}`;
  }

  function relabel() {
    labelA.textContent = mode === "of" ? "Percent" : "Value";
    labelB.textContent = mode === "of" ? "Value" : "Total";
  }

  const chips = chipRow(modes, {
    value: mode,
    label: "Mode",
    onChange: (value) => {
      mode = value;
      relabel();
      run();
    }});

  a.addEventListener("input", run);
  b.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Mode", chips), panel(labelA, a), panel(labelB, b), error),
      stack(stats)
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  relabel();
  run();

  return {};
}

export default { mount };
