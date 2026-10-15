// Adds up notes and coins by denomination.
import { el, bench, stack, panel, numberInput, notice, copyButton, actions, toolcard, readPin, writePin } from "../core.js";

const DENOMINATIONS = [100, 50, 20, 10, 5, 2, 1];

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function mount(slot) {
  const PIN = "cash-denomination";
  const saved = readPin(PIN, {});
  const counts = new Map();

  const listWrap = el("div", { class: "max-h-80 overflow-auto" });
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" });
  const note = notice("note");
  note.write("Values are generic. Match them to your currency.");

  const tile = (key, value) => el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
    el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, String(value)),
    el("span", { class: "text-2xs font-semibold text-ink-3" }, key));

  const readCount = (value) => {
    const input = counts.get(value);
    const n = Number(input.value);
    return input.value.trim() === "" || !Number.isFinite(n) || n < 0 ? 0 : Math.floor(n);
  };

  const total = () => DENOMINATIONS.reduce((sum, value) => sum + value * readCount(value), 0);

  function save() {
    const data = {};
    for (const value of DENOMINATIONS) data[value] = counts.get(value).value;
    writePin(PIN, data);
  }

  function render() {
    const rows = DENOMINATIONS.map((value) => el("tr", {},
      el("th", {}, fmt(value)),
      el("td", {}, fmt(readCount(value))),
      el("td", {}, fmt(value * readCount(value)))));
    listWrap.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
      el("thead", {}, el("tr", {}, el("th", {}, "Value"), el("th", {}, "Count"), el("th", {}, "Subtotal"))),
      el("tbody", {}, ...rows)));
    const pieces = DENOMINATIONS.reduce((sum, value) => sum + readCount(value), 0);
    stats.replaceChildren(tile("Total", fmt(total())), tile("Pieces", String(pieces)));
  }

  const inputs = DENOMINATIONS.map((value) => {
    const input = numberInput({ value: String(saved[value] ?? ""), min: "0", "aria-label": fmt(value) });
    input.addEventListener("input", () => { save(); render(); });
    counts.set(value, input);
    return input;
  });

  const card = toolcard({
    body: bench(
      stack(...DENOMINATIONS.map((value, i) => panel(fmt(value), inputs[i])), note),
      stack(stats, panel("Subtotals", listWrap))
    ),
    foot: actions(copyButton(
      () => DENOMINATIONS.map((value) => `${fmt(value)} x ${readCount(value)} = ${fmt(value * readCount(value))}`).join("\n"),
      "Copy count",
      "fill"
    ))});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
