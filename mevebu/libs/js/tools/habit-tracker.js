// Tracks a week of habits and shows the count and the current streak.
import { el, toast, bench, stack, panel, textInput, checkbox, button, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const todayIndex = () => (new Date().getDay() + 6) % 7;

export function mount(slot) {
  const PIN = "habit-tracker";
  const saved = readPin(PIN, []);
  let list = Array.isArray(saved) ? saved : [];

  const name = textInput({ placeholder: "Habit", "aria-label": "Habit" });
  const tableWrap = el("div", { class: "max-h-80 overflow-auto" });
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" });

  const addButton = button("Add", { icon: "plus", kind: "fill" });
  const clearWeek = button("Clear week", { icon: "trash" });

  const tile = (key, value) => el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
    el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, String(value)),
    el("span", { class: "text-2xs font-semibold text-ink-3" }, key));

  const save = () => writePin(PIN, list);
  const today = todayIndex();

  function streak(habit) {
    let i = today;
    if (!habit.days[i]) i -= 1;
    let count = 0;
    while (i >= 0 && habit.days[i]) {
      count++;
      i--;
    }
    return count;
  }

  function removeButton(habit) {
    const node = button("", { icon: "trash", "aria-label": `Remove ${habit.name}` });
    node.addEventListener("click", () => {
      list = list.filter((entry) => entry.id !== habit.id);
      save();
      render();
    });
    return node;
  }

  function dayCell(habit, i) {
    const box = checkbox("", { checked: habit.days[i], "aria-label": `${habit.name} ${DAYS[i]}` });
    box.input.addEventListener("change", () => {
      habit.days[i] = box.input.checked;
      save();
      render();
    });
    return el("td", {}, box);
  }

  function render() {
    if (!list.length) {
      tableWrap.replaceChildren(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "No habits yet."));
    } else {
      const head = el("tr", {},
        el("th", {}, "Habit"),
        ...DAYS.map((label) => el("th", {}, label)),
        el("th", {}, "Done"),
        el("th", {}, "Streak"),
        el("th", {}, "")
      );
      const rows = list.map((habit) => el("tr", {},
        el("th", {}, habit.name),
        ...habit.days.map((_, i) => dayCell(habit, i)),
        el("td", {}, String(habit.days.filter(Boolean).length)),
        el("td", {}, String(streak(habit))),
        el("td", {}, removeButton(habit))
      ));
      tableWrap.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
        el("thead", {}, head),
        el("tbody", {}, ...rows)
      ));
    }

    const doneToday = list.filter((habit) => habit.days[today]).length;
    stats.replaceChildren(tile("Habits", list.length), tile("Done today", doneToday));
    clearWeek.disabled = !list.some((habit) => habit.days.some(Boolean));
  }

  function add() {
    const text = name.value.trim();
    if (!text) return toast("Type a habit first");
    list.push({ id: uid(), name: text, days: [false, false, false, false, false, false, false] });
    name.value = "";
    name.focus();
    save();
    render();
  }

  name.addEventListener("keydown", (event) => {
    if (event.key === "Enter") add();
  });
  addButton.addEventListener("click", add);
  clearWeek.addEventListener("click", () => {
    for (const habit of list) habit.days = [false, false, false, false, false, false, false];
    save();
    render();
  });

  const card = toolcard({
    body: bench(
      stack(panel("Habit", name)),
      stack(stats, panel("Week", tableWrap))
    ),
    foot: actions(clearWeek, addButton)});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
