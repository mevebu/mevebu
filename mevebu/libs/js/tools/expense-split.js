// Splits a total between people, equally or by custom shares.
import { el, bench, stack, panel, textArea, numberInput, chipRow, notice, copyButton, actions, toolcard, readPin, writePin } from "../core.js";

function fmt(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function mount(slot) {
  const PIN = "expense-split";
  const saved = readPin(PIN, { total: "120", people: "", shares: "", mode: "equal" });
  let mode = saved.mode === "custom" ? "custom" : "equal";

  const total = numberInput({ value: saved.total ?? "", min: "0", "aria-label": "Total" });
  const people = textArea({ rows: 6, value: saved.people ?? "", "aria-label": "People", placeholder: "One name per line" });
  const shares = textArea({ rows: 6, value: saved.shares ?? "", "aria-label": "Shares", placeholder: "One number per line" });
  const modeChips = chipRow(
    [{ value: "equal", label: "Equal" }, { value: "custom", label: "Custom" }],
    { value: mode, label: "Mode", onChange: (next) => { mode = next; save(); run(); } }
  );
  const sharesField = panel("Shares", shares);
  const result = el("div", { class: "max-h-80 overflow-auto" });
  const error = notice("error");
  const remainder = notice("warn");
  let text = "";

  const save = () => writePin(PIN, { total: total.value, people: people.value, shares: shares.value, mode });

  function run() {
    error.write("");
    remainder.write("");
    text = "";
    sharesField.hidden = mode !== "custom";

    const names = people.value.split("\n").map((line) => line.trim()).filter(Boolean);
    const amount = Number(total.value);
    if (!names.length || total.value.trim() === "" || !Number.isFinite(amount) || amount < 0) {
      result.replaceChildren(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "Add a total and one name per line."));
      return;
    }

    let weights;
    if (mode === "custom") {
      weights = shares.value.split("\n").map((line) => line.trim()).filter(Boolean).map(Number);
      if (weights.length !== names.length || weights.some((w) => !Number.isFinite(w) || w < 0)) {
        result.replaceChildren(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "Add one share for each name."));
        error.write("Add one share for each name.");
        return;
      }
      if (weights.reduce((a, b) => a + b, 0) <= 0) {
        result.replaceChildren(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "Add one share for each name."));
        error.write("The shares add up to zero.");
        return;
      }
    } else {
      weights = names.map(() => 1);
    }

    const weightSum = weights.reduce((a, b) => a + b, 0);
    const rounded = weights.map((w) => Math.round(((amount * w) / weightSum) * 100) / 100);
    const paid = rounded.reduce((a, b) => a + b, 0);
    const leftover = Math.round((amount - paid) * 100) / 100;

    result.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
      el("thead", {}, el("tr", {}, el("th", {}, "Person"), el("th", {}, "Amount"))),
      el("tbody", {}, ...names.map((name, i) => el("tr", {},
        el("th", {}, name),
        el("td", {}, fmt(rounded[i])))))));

    if (Math.abs(leftover) >= 0.01) remainder.write(`Rounding leaves ${fmt(leftover)} unassigned.`);
    text = names.map((name, i) => `${name}: ${fmt(rounded[i])}`).join("\n");
  }

  total.addEventListener("input", () => { save(); run(); });
  people.addEventListener("input", () => { save(); run(); });
  shares.addEventListener("input", () => { save(); run(); });

  const card = toolcard({
    body: bench(
      stack(panel("Total", total), panel("Mode", modeChips), panel("People", people), sharesField, error),
      stack(panel("Each person", result), remainder)
    ),
    foot: actions(copyButton(() => text, "Copy split", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
