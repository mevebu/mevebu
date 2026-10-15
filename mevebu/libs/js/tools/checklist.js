// A list you can tick off, with the remaining count kept in view.
import { el, toast, blank, bench, stack, panel, textInput, checkbox, button, copyButton, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function mount(slot) {
  const PIN = "checklist";
  const saved = readPin(PIN, []);
  let list = Array.isArray(saved) ? saved : [];

  const entry = textInput({ placeholder: "New item", "aria-label": "New item" });
  const listWrap = el("div", { class: "mvb-scroll" });
  const stats = el("div", { class: "mvb-stats" });

  const addButton = button("Add", { icon: "plus", kind: "fill" });
  const clearDone = button("Clear finished", { icon: "trash" });
  const copyList = copyButton(() => listText(), "Copy list");

  const tile = (key, value) => el("div", { class: "mvb-stat" },
    el("span", { class: "mvb-stat__v" }, String(value)),
    el("span", { class: "mvb-stat__k" }, key));

  const save = () => writePin(PIN, list);

  function listText() {
    return list.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.text}`).join("\n");
  }

  function itemNode(item) {
    const box = checkbox(item.text, { checked: item.done });
    box.input.addEventListener("change", () => {
      item.done = box.input.checked;
      save();
      renderStats();
    });
    return box;
  }

  function renderStats() {
    const done = list.filter((item) => item.done).length;
    stats.replaceChildren(tile("Done", done), tile("Left", list.length - done));
    clearDone.disabled = done === 0;
    copyList.disabled = list.length === 0;
  }

  function renderList() {
    listWrap.replaceChildren(
      list.length ? stack(...list.map(itemNode)) : blank("list-checks", "No items yet.")
    );
    renderStats();
  }

  function add() {
    const text = entry.value.trim();
    if (!text) return toast("Type an item first");
    list.push({ id: uid(), text, done: false });
    entry.value = "";
    entry.focus();
    save();
    renderList();
  }

  entry.addEventListener("keydown", (event) => {
    if (event.key === "Enter") add();
  });
  addButton.addEventListener("click", add);
  clearDone.addEventListener("click", () => {
    list = list.filter((item) => !item.done);
    save();
    renderList();
  });

  const card = toolcard({
    body: bench(
      stack(panel("New item", entry)),
      stack(stats, panel("Items", listWrap))
    ),
    foot: actions(copyList, clearDone, addButton),
  });
  slot.append(card.node);
  renderList();

  return {};
}

export default { mount };
