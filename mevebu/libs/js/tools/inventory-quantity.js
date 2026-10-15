// Closing stock per item from opening stock, stock in and stock out.
import { el, toast, blank, bench, stack, row, panel, textInput, numberInput, button, copyButton, notice, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function mount(slot) {
  const PIN = "inventory-quantity";
  const saved = readPin(PIN, []);
  let list = Array.isArray(saved) ? saved : [];

  const name = textInput({ placeholder: "Item", "aria-label": "Item" });
  const opening = numberInput({ value: "0", min: "0", "aria-label": "Opening stock" });
  const stockIn = numberInput({ value: "0", min: "0", "aria-label": "Stock in" });
  const stockOut = numberInput({ value: "0", min: "0", "aria-label": "Stock out" });
  const listWrap = el("div", { class: "mvb-scroll" });
  const stats = el("div", { class: "mvb-stats" });
  const warn = notice("warn");

  const addButton = button("Add", { icon: "plus", kind: "fill" });

  const save = () => writePin(PIN, list);
  const tile = (key, value) => el("div", { class: "mvb-stat" },
    el("span", { class: "mvb-stat__v" }, String(value)),
    el("span", { class: "mvb-stat__k" }, key));

  const closing = (item) => item.opening + item.in - item.out;

  function removeButton(item) {
    const node = button("", { icon: "trash", "aria-label": `Remove ${item.name}` });
    node.addEventListener("click", () => {
      list = list.filter((entry) => entry.id !== item.id);
      save();
      render();
    });
    return node;
  }

  function render() {
    if (!list.length) {
      listWrap.replaceChildren(blank("package", "No items yet."));
    } else {
      listWrap.replaceChildren(el("table", { class: "mvb-ttable" },
        el("thead", {}, el("tr", {},
          el("th", {}, "Item"), el("th", {}, "Opening"), el("th", {}, "In"),
          el("th", {}, "Out"), el("th", {}, "Closing"), el("th", {}, ""))),
        el("tbody", {}, ...list.map((item) => el("tr", {},
          el("th", {}, item.name),
          el("td", {}, fmt(item.opening)),
          el("td", {}, fmt(item.in)),
          el("td", {}, fmt(item.out)),
          el("td", {}, fmt(closing(item))),
          el("td", {}, removeButton(item)))))));
    }
    const negative = list.filter((item) => closing(item) < 0).length;
    const totalClosing = list.reduce((sum, item) => sum + closing(item), 0);
    stats.replaceChildren(tile("Items", String(list.length)), tile("Closing", fmt(totalClosing)));
    warn.write(negative ? `${negative} ${negative === 1 ? "item closes" : "items close"} below zero.` : "");
  }

  function add() {
    const text = name.value.trim();
    if (!text) return toast("Name the item first");
    const o = Number(opening.value);
    const i = Number(stockIn.value);
    const out = Number(stockOut.value);
    if ([opening, stockIn, stockOut].some((input) => input.value.trim() === "") || ![o, i, out].every(Number.isFinite)) {
      return toast("Add the opening, in and out amounts");
    }
    if (o < 0 || i < 0 || out < 0) return toast("The amounts cannot be negative");
    list.push({ id: uid(), name: text, opening: o, in: i, out });
    name.value = "";
    opening.value = "0";
    stockIn.value = "0";
    stockOut.value = "0";
    name.focus();
    save();
    render();
  }

  name.addEventListener("keydown", (event) => { if (event.key === "Enter") add(); });
  addButton.addEventListener("click", add);

  const card = toolcard({
    body: bench(
      stack(panel("Item", name), row(panel("Opening", opening), panel("In", stockIn), panel("Out", stockOut)), warn),
      stack(stats, panel("Stock", listWrap))
    ),
    foot: actions(
      copyButton(() => list.map((item) => `${item.name}: opening ${fmt(item.opening)}, in ${fmt(item.in)}, out ${fmt(item.out)}, closing ${fmt(closing(item))}`).join("\n"), "Copy stock"),
      addButton
    ),
  });
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
