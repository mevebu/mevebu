// Sorts tasks into four boxes by urgency and importance.
import { el, toast, bench, stack, row, panel, textInput, selectInput, button, copyButton, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const QUADRANTS = [
  { id: "do", name: "Do now" },
  { id: "schedule", name: "Schedule" },
  { id: "delegate", name: "Delegate" },
  { id: "drop", name: "Drop" }];

export function mount(slot) {
  const PIN = "priority-matrix";
  const saved = readPin(PIN, []);
  let list = Array.isArray(saved) ? saved : [];

  const task = textInput({ placeholder: "Task", "aria-label": "Task" });
  const quadrant = selectInput(QUADRANTS.map((q) => ({ value: q.id, label: q.name })), {
    value: "do",
    "aria-label": "Quadrant"});

  const matrix = stack();

  const addButton = button("Add", { icon: "plus", kind: "fill" });
  const copyMatrix = copyButton(() => matrixText(), "Copy matrix");

  const save = () => writePin(PIN, list);

  function matrixText() {
    return QUADRANTS.map((q) => {
      const items = list.filter((item) => item.q === q.id);
      const lines = items.map((item) => `- ${item.text}`);
      return lines.length ? `${q.name}\n${lines.join("\n")}` : q.name;
    }).join("\n\n");
  }

  function taskRow(item) {
    const text = el("span", {}, item.text);
    const move = selectInput(QUADRANTS.map((q) => ({ value: q.id, label: q.name })), {
      value: item.q,
      "aria-label": `Move ${item.text}`});
    move.addEventListener("change", () => {
      item.q = move.value;
      save();
      render();
    });
    const remove = button("", { icon: "trash", "aria-label": `Remove ${item.text}` });
    remove.addEventListener("click", () => {
      list = list.filter((entry) => entry.id !== item.id);
      save();
      render();
    });
    return el("div", { class: "flex min-w-0 flex-wrap items-center gap-2" }, text, move, remove);
  }

  function quadrantBox(q) {
    const items = list.filter((item) => item.q === q.id);
    const body = items.length ? stack(...items.map(taskRow)) : el("span", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "Empty");
    return panel(`${q.name} (${items.length})`, body);
  }

  function render() {
    matrix.replaceChildren(
      row(quadrantBox(QUADRANTS[0]), quadrantBox(QUADRANTS[1])),
      row(quadrantBox(QUADRANTS[2]), quadrantBox(QUADRANTS[3]))
    );
    copyMatrix.disabled = list.length === 0;
  }

  function add() {
    const text = task.value.trim();
    if (!text) return toast("Type a task first");
    list.push({ id: uid(), text, q: quadrant.value });
    task.value = "";
    task.focus();
    save();
    render();
  }

  task.addEventListener("keydown", (event) => {
    if (event.key === "Enter") add();
  });
  addButton.addEventListener("click", add);

  const card = toolcard({
    body: bench(
      stack(panel("Task", task), panel("Quadrant", quadrant)),
      matrix
    ),
    foot: actions(copyMatrix, addButton)});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
