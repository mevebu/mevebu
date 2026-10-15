// Commission per sale and the total, with an optional higher tier.
import { el, bench, stack, row, panel, textArea, numberInput, notice, copyButton, downloadButton, actions, toolcard } from "../core.js";

function fmt(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseNumbers(text) {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  const nums = tokens.map(Number);
  return { nums, invalid: nums.some((n) => !Number.isFinite(n)) };
}

export function mount(slot) {
  const sales = textArea({ rows: 8, value: "1000, 2500, 4000", "aria-label": "Sale amounts", placeholder: "One amount per line" });
  const rate = numberInput({ value: "5", min: "0", "aria-label": "Rate" });
  const threshold = numberInput({ placeholder: "Threshold", min: "0", "aria-label": "Tier threshold" });
  const higher = numberInput({ placeholder: "Higher rate", min: "0", "aria-label": "Higher rate" });
  const result = el("div", { class: "mvb-scroll" });
  const stats = el("div", { class: "mvb-stats" });
  const error = notice("error");
  let text = "";

  const tile = (key, value) => el("div", { class: "mvb-stat" },
    el("span", { class: "mvb-stat__v" }, String(value)),
    el("span", { class: "mvb-stat__k" }, key));

  const tiered = () => threshold.value.trim() !== "" && higher.value.trim() !== "";

  function commissionFor(amount) {
    const base = Number(rate.value) || 0;
    if (tiered()) {
      const t = Number(threshold.value) || 0;
      const h = Number(higher.value) || 0;
      if (amount > t) return (t * base + (amount - t) * h) / 100;
    }
    return (amount * base) / 100;
  }

  function run() {
    error.write("");
    text = "";
    const { nums, invalid } = parseNumbers(sales.value);
    const r = Number(rate.value);
    if (!sales.value.trim()) {
      result.replaceChildren(el("p", { class: "mvb-note" }, "Add one sale amount per line."));
      stats.replaceChildren();
      return;
    }
    if (invalid || !Number.isFinite(r) || r < 0) {
      error.write("Use numbers only for the sales and a rate of zero or more.");
      result.replaceChildren();
      stats.replaceChildren();
      return;
    }
    result.replaceChildren(el("table", { class: "mvb-ttable" },
      el("thead", {}, el("tr", {}, el("th", {}, "Sale"), el("th", {}, "Commission"))),
      el("tbody", {}, ...nums.map((amount) => el("tr", {},
        el("th", {}, fmt(amount)),
        el("td", {}, fmt(commissionFor(amount))))))));
    const totalSales = nums.reduce((a, b) => a + b, 0);
    const totalCommission = nums.reduce((sum, amount) => sum + commissionFor(amount), 0);
    stats.replaceChildren(tile("Sales", String(nums.length)), tile("Total sales", fmt(totalSales)), tile("Commission", fmt(totalCommission)));
    text = `${nums.map((amount) => `${fmt(amount)}: ${fmt(commissionFor(amount))}`).join("\n")}\nTotal ${fmt(totalCommission)}`;
  }

  for (const input of [sales, rate, threshold, higher]) input.addEventListener("input", run);

  function csv() {
    const { nums } = parseNumbers(sales.value);
    const rows = [["Sale", "Commission"], ...nums.map((amount) => [String(amount), commissionFor(amount).toFixed(2)])];
    return rows.map((cells) => cells.map((cell) => `"${cell}"`).join(",")).join("\n");
  }

  const card = toolcard({
    body: bench(
      stack(
        panel("Sale amounts", sales),
        panel("Rate %", rate),
        row(panel("Tier threshold", threshold), panel("Higher rate %", higher)),
        error
      ),
      stack(stats, panel("Per sale", result))
    ),
    foot: actions(
      downloadButton(() => csv(), "commission.csv", "Save CSV", "text/csv"),
      copyButton(() => text, "Copy commission", "fill")
    ),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
