// Adds tax to an amount or takes it out of a tax-inclusive price.
import { el, bench, stack, panel, numberInput, chipRow, notice, copyButton, actions, toolcard } from "../core.js";

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "-");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const amount = numberInput({ value: "100", min: "0", "aria-label": "Amount" });
  const rate = numberInput({ value: "11", "aria-label": "Tax rate" });
  let mode = "add";
  const chips = chipRow(
    [{ value: "add", label: "Add tax" }, { value: "included", label: "Tax included" }],
    { value: "add", label: "Amount type", onChange: (next) => { mode = next; run(); } }
  );
  const taxTile = tile("Tax");
  const netTile = tile("Net");
  const grossTile = tile("Total");
  const stats = el("div", { class: "mvb-stats" }, taxTile, netTile, grossTile);
  const error = notice("error");
  const note = notice("note");
  note.write("You set the rate. No official rule is applied.");
  let text = "";

  function clear() {
    taxTile.set("-");
    netTile.set("-");
    grossTile.set("-");
    text = "";
  }

  function run() {
    error.write("");
    const a = Number(amount.value);
    const r = Number(rate.value);
    if (amount.value.trim() === "" || rate.value.trim() === "" || !Number.isFinite(a) || !Number.isFinite(r)) {
      clear();
      return;
    }
    if (a < 0) { clear(); error.write("The amount cannot be negative."); return; }
    if (r <= -100) { clear(); error.write("The rate must be above -100%."); return; }

    let net;
    let tax;
    let gross;
    if (mode === "included") {
      net = a / (1 + r / 100);
      tax = a - net;
      gross = a;
    } else {
      net = a;
      tax = (a * r) / 100;
      gross = a + tax;
    }
    taxTile.set(fmt(tax));
    netTile.set(fmt(net));
    grossTile.set(fmt(gross));
    text = `Net ${fmt(net)}, tax ${fmt(tax)}, total ${fmt(gross)}`;
  }

  amount.addEventListener("input", run);
  rate.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Amount", amount), panel("Amount type", chips), panel("Tax rate %", rate), error),
      stack(stats, note)
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
