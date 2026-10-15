// Percent change between two values, with the direction and the difference.
import { el, bench, stack, panel, numberInput, notice, copyButton, actions, toolcard } from "../core.js";

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "-");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const start = numberInput({ value: "80", "aria-label": "Starting value" });
  const end = numberInput({ value: "100", "aria-label": "Ending value" });
  const change = tile("Change");
  const difference = tile("Difference");
  const direction = tile("Direction");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, change, difference, direction);
  const error = notice("error");
  let text = "";

  function clear() {
    change.set("-");
    difference.set("-");
    direction.set("-");
    text = "";
  }

  function run() {
    error.write("");
    const a = Number(start.value);
    const b = Number(end.value);
    if (start.value.trim() === "" || end.value.trim() === "" || !Number.isFinite(a) || !Number.isFinite(b)) {
      clear();
      return;
    }
    if (a === 0) {
      clear();
      error.write("The starting value cannot be zero.");
      return;
    }
    const diff = b - a;
    const pct = (diff / Math.abs(a)) * 100;
    const label = pct > 0 ? "Increase" : pct < 0 ? "Decrease" : "No change";
    change.set(`${fmt(pct)}%`);
    difference.set(fmt(diff));
    direction.set(label);
    text = `${fmt(a)} to ${fmt(b)}: ${label.toLowerCase()} of ${fmt(Math.abs(pct))}%, difference ${fmt(diff)}`;
  }

  start.addEventListener("input", run);
  end.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Starting value", start), panel("Ending value", end), error),
      stack(stats)
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
