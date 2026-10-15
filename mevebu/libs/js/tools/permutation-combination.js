// Counts arrangements and selections with nPr and nCr.
import { el, bench, stack, panel, numberInput, notice, copyButton, chipRow, actions, toolcard } from "../core.js";

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
  const nInput = numberInput({ value: "5", min: "0", step: "1", "aria-label": "n" });
  const rInput = numberInput({ value: "3", min: "0", step: "1", "aria-label": "r" });
  const count = tile("Result");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, count);
  const formulaRow = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el(
    "div",
    { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" },
    el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, "Formula"), formulaRow)
  );
  const error = notice("error");
  let mode = "npr";
  let text = "";

  function permutations(n, r) {
    let value = 1;
    for (let i = 0; i < r; i++) value *= n - i;
    return value;
  }

  function run() {
    error.write("");
    const n = Number(nInput.value);
    const r = Number(rInput.value);
    if (nInput.value.trim() === "" || rInput.value.trim() === "" || !Number.isInteger(n) || !Number.isInteger(r)) {
      count.set("-");
      formulaRow.textContent = "-";
      text = "";
      return;
    }
    if (n < 0 || r < 0) {
      count.set("-");
      formulaRow.textContent = "-";
      text = "";
      error.write("n and r must be zero or more.");
      return;
    }
    if (r > n) {
      count.set("-");
      formulaRow.textContent = "-";
      text = "";
      error.write("r cannot be larger than n.");
      return;
    }
    const base = permutations(n, r);
    const value = mode === "npr" ? base : base / permutations(r, r);
    if (!Number.isFinite(value) || value > Number.MAX_SAFE_INTEGER) {
      count.set("-");
      formulaRow.textContent = "-";
      text = "";
      error.write("That result is too large to show exactly.");
      return;
    }
    const rounded = Math.round(value);
    count.set(fmt(rounded));
    formulaRow.textContent = mode === "npr" ? "n! / (n - r)!" : "n! / (r! (n - r)!)";
    text = `${mode === "npr" ? "P" : "C"}(${n}, ${r}) = ${fmt(rounded)}`;
  }

  const chips = chipRow(
    [
      { value: "npr", label: "Permutation nPr" },
      { value: "ncr", label: "Combination nCr" }],
    {
      value: mode,
      label: "Mode",
      onChange: (value) => {
        mode = value;
        run();
      }}
  );

  nInput.addEventListener("input", run);
  rInput.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("n", nInput), panel("r", rInput), panel("Mode", chips), error),
      stack(stats, panel("Working", kv))
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
