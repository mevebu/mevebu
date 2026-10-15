// Topics with a session date each, ticked off as you go.
import { el, toast, blank, bench, stack, panel, textInput, checkbox, button, copyButton, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function mount(slot) {
  const PIN = "study-schedule";
  const saved = readPin(PIN, []);
  let list = Array.isArray(saved) ? saved : [];

  const name = textInput({ placeholder: "Topic", "aria-label": "Topic" });
  const date = el("input", { class: "mvb-in", type: "date", "aria-label": "Session date" });
  const listWrap = el("div", { class: "mvb-scroll" });
  const stats = el("div", { class: "mvb-stats" });

  const addButton = button("Add", { icon: "plus", kind: "fill" });

  const save = () => writePin(PIN, list);
  const tile = (key, value) => el("div", { class: "mvb-stat" },
    el("span", { class: "mvb-stat__v" }, String(value)),
    el("span", { class: "mvb-stat__k" }, key));

  const sorted = () => list.slice().sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  function removeButton(item) {
    const node = button("", { icon: "trash", "aria-label": `Remove ${item.name}` });
    node.addEventListener("click", () => {
      list = list.filter((entry) => entry.id !== item.id);
      save();
      render();
    });
    return node;
  }

  function rowNode(item) {
    const box = checkbox(item.name, { checked: item.done });
    box.input.addEventListener("change", () => {
      item.done = box.input.checked;
      save();
      render();
    });
    return el("tr", {},
      el("td", {}, box),
      el("td", {}, item.date || "No date"),
      el("td", {}, removeButton(item)));
  }

  function render() {
    const rows = sorted();
    if (!rows.length) {
      listWrap.replaceChildren(blank("calendar-days", "No topics yet."));
    } else {
      listWrap.replaceChildren(el("table", { class: "mvb-ttable" },
        el("thead", {}, el("tr", {}, el("th", {}, "Topic"), el("th", {}, "Date"), el("th", {}, ""))),
        el("tbody", {}, ...rows.map(rowNode))));
    }
    const done = list.filter((item) => item.done).length;
    stats.replaceChildren(tile("Topics", list.length), tile("Done", done), tile("Left", list.length - done));
  }

  function add() {
    const text = name.value.trim();
    if (!text) return toast("Add a topic first");
    list.push({ id: uid(), name: text, date: date.value, done: false });
    name.value = "";
    date.value = "";
    name.focus();
    save();
    render();
  }

  name.addEventListener("keydown", (event) => { if (event.key === "Enter") add(); });
  addButton.addEventListener("click", add);

  const card = toolcard({
    body: bench(
      stack(panel("Topic", name), panel("Session date", date)),
      stack(stats, panel("Plan", listWrap))
    ),
    foot: actions(copyButton(() => sorted().map((item) => `${item.date || "No date"}  ${item.done ? "[x]" : "[ ]"} ${item.name}`).join("\n"), "Copy plan"), addButton),
  });
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
