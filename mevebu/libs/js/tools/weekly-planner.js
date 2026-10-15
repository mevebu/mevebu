// Plans seven days at once: pick a day, add targets, tick them off.
import { el, toast, blank, bench, stack, panel, textInput, checkbox, button, chipRow, copyButton, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function mount(slot) {
  const PIN = "weekly-planner";
  const saved = readPin(PIN, { day: 0, days: [] });
  const days = Array.from({ length: 7 }, (_, i) => (Array.isArray(saved.days?.[i]) ? saved.days[i] : []));
  let day = Number.isInteger(saved.day) && saved.day >= 0 && saved.day < 7 ? saved.day : 0;

  const entry = textInput({ placeholder: "New item", "aria-label": "New item" });
  const listWrap = el("div", { class: "mvb-scroll" });
  const stats = el("div", { class: "mvb-stats" });

  const dayChips = chipRow(DAYS.map((label, value) => ({ value, label })), {
    value: day,
    label: "Day",
    onChange: (next) => {
      day = next;
      save();
      render();
    },
  });

  const addButton = button("Add", { icon: "plus", kind: "fill" });
  const copyWeek = copyButton(() => weekText(), "Copy week");

  const tile = (key, value) => el("div", { class: "mvb-stat" },
    el("span", { class: "mvb-stat__v" }, String(value)),
    el("span", { class: "mvb-stat__k" }, key));

  const save = () => writePin(PIN, { day, days });

  function weekText() {
    return DAYS.map((label, i) => {
      const lines = days[i].map((item) => `${item.done ? "[x]" : "[ ]"} ${item.text}`);
      return lines.length ? `${label}\n${lines.join("\n")}` : label;
    }).join("\n\n");
  }

  function itemNode(item) {
    const box = checkbox(item.text, { checked: item.done });
    box.input.addEventListener("change", () => {
      item.done = box.input.checked;
      save();
      renderStats();
    });
    const remove = button("", { icon: "trash", "aria-label": `Remove ${item.text}` });
    remove.addEventListener("click", () => {
      days[day] = days[day].filter((entry) => entry.id !== item.id);
      save();
      render();
    });
    return el("div", { class: "mvb-row" }, box, remove);
  }

  function renderStats() {
    const todayDone = days[day].filter((item) => item.done).length;
    const weekDone = days.reduce((sum, list) => sum + list.filter((item) => item.done).length, 0);
    stats.replaceChildren(tile("Done today", todayDone), tile("Done this week", weekDone));
    copyWeek.disabled = days.every((list) => list.length === 0);
  }

  function render() {
    listWrap.replaceChildren(
      days[day].length ? stack(...days[day].map(itemNode)) : blank("calendar-range", `Nothing on ${DAYS[day]}.`)
    );
    renderStats();
  }

  function add() {
    const text = entry.value.trim();
    if (!text) return toast("Type an item first");
    days[day].push({ id: uid(), text, done: false });
    entry.value = "";
    entry.focus();
    save();
    render();
  }

  entry.addEventListener("keydown", (event) => {
    if (event.key === "Enter") add();
  });
  addButton.addEventListener("click", add);

  const card = toolcard({
    body: bench(
      stack(panel("Day", dayChips), panel("New item", entry)),
      stack(stats, panel("Items", listWrap))
    ),
    foot: actions(copyWeek, addButton),
  });
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
