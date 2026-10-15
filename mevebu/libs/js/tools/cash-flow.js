// Money in and out from an opening balance, with a running total.
import { el, toast, blank, bench, stack, row, panel, textInput, numberInput, chipRow, button, copyButton, downloadButton, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function fmt(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function mount(slot) {
  const PIN = "cash-flow";
  const saved = readPin(PIN, { opening: 0, entries: [] });
  let entries = Array.isArray(saved.entries) ? saved.entries : [];

  const opening = numberInput({ value: String(saved.opening ?? 0), "aria-label": "Opening balance" });
  const label = textInput({ placeholder: "Label", "aria-label": "Label" });
  const amount = numberInput({ min: "0", placeholder: "Amount", "aria-label": "Amount" });
  let type = "in";
  const typeChips = chipRow(
    [{ value: "in", label: "In" }, { value: "out", label: "Out" }],
    { value: "in", label: "Direction", onChange: (next) => { type = next; } }
  );
  const listWrap = el("div", { class: "max-h-80 overflow-auto" });
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" });

  const addButton = button("Add", { icon: "plus", kind: "fill" });

  const save = () => writePin(PIN, { opening: Number(opening.value) || 0, entries });
  const tile = (key, value) => el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
    el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, String(value)),
    el("span", { class: "text-2xs font-semibold text-ink-3" }, key));

  function totals() {
    let balance = Number(opening.value) || 0;
    let moneyIn = 0;
    let moneyOut = 0;
    const lines = [`Opening ${fmt(balance)}`];
    for (const entry of entries) {
      if (entry.type === "in") { balance += entry.amount; moneyIn += entry.amount; }
      else { balance -= entry.amount; moneyOut += entry.amount; }
      lines.push(`${entry.type === "in" ? "+" : "-"} ${fmt(entry.amount)}  ${entry.label}  balance ${fmt(balance)}`);
    }
    lines.push(`Closing ${fmt(balance)}`);
    return { lines, moneyIn, moneyOut, closing: balance };
  }

  function removeButton(entry) {
    const node = button("", { icon: "trash", "aria-label": `Remove ${entry.label}` });
    node.addEventListener("click", () => {
      entries = entries.filter((item) => item.id !== entry.id);
      save();
      render();
    });
    return node;
  }

  function render() {
    if (!entries.length) {
      listWrap.replaceChildren(blank("banknote", "No entries yet."));
    } else {
      let balance = Number(opening.value) || 0;
      const rows = entries.map((entry) => {
        if (entry.type === "in") balance += entry.amount;
        else balance -= entry.amount;
        return el("tr", {},
          el("th", {}, entry.label),
          el("td", {}, entry.type === "in" ? fmt(entry.amount) : ""),
          el("td", {}, entry.type === "out" ? fmt(entry.amount) : ""),
          el("td", {}, fmt(balance)),
          el("td", {}, removeButton(entry)));
      });
      listWrap.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
        el("thead", {}, el("tr", {}, el("th", {}, "Label"), el("th", {}, "In"), el("th", {}, "Out"), el("th", {}, "Balance"), el("th", {}, ""))),
        el("tbody", {}, ...rows)));
    }
    const { moneyIn, moneyOut, closing } = totals();
    stats.replaceChildren(tile("In", fmt(moneyIn)), tile("Out", fmt(moneyOut)), tile("Closing", fmt(closing)));
  }

  function add() {
    const text = label.value.trim();
    const value = Number(amount.value);
    if (!text) return toast("Add a label first");
    if (amount.value.trim() === "" || !Number.isFinite(value) || value < 0) return toast("Add an amount");
    entries.push({ id: uid(), label: text, type, amount: value });
    label.value = "";
    amount.value = "";
    label.focus();
    save();
    render();
  }

  label.addEventListener("keydown", (event) => { if (event.key === "Enter") add(); });
  addButton.addEventListener("click", add);
  opening.addEventListener("input", () => { save(); render(); });

  function csv() {
    const rows = [["Label", "Type", "Amount"]];
    for (const entry of entries) rows.push([entry.label, entry.type, String(entry.amount)]);
    return rows.map((cells) => cells.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  }

  const card = toolcard({
    body: bench(
      stack(
        panel("Opening balance", opening),
        panel("Label", label),
        row(panel("Direction", typeChips), panel("Amount", amount))
      ),
      stack(stats, panel("Entries", listWrap))
    ),
    foot: actions(
      copyButton(() => totals().lines.join("\n"), "Copy summary"),
      downloadButton(() => csv(), "cash-flow.csv", "Save CSV", "text/csv"),
      addButton
    )});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
