// Credit weighted GPA from courses, on a grade scale you pick.
import { el, toast, blank, bench, stack, row, panel, textInput, numberInput, selectInput, button, copyButton, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const SCALE = [
  ["A+", 4.0], ["A", 4.0], ["A-", 3.7],
  ["B+", 3.3], ["B", 3.0], ["B-", 2.7],
  ["C+", 2.3], ["C", 2.0], ["C-", 1.7],
  ["D+", 1.3], ["D", 1.0], ["F", 0.0]];
const POINTS = new Map(SCALE);

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function mount(slot) {
  const PIN = "gpa-calculator";
  const saved = readPin(PIN, []);
  let list = Array.isArray(saved) ? saved : [];

  const name = textInput({ placeholder: "Course", "aria-label": "Course" });
  const credits = numberInput({ min: "0", step: "0.5", placeholder: "Credits", "aria-label": "Credits" });
  const grade = selectInput(SCALE.map(([label]) => ({ value: label, label })), { value: "A", "aria-label": "Grade" });
  const listWrap = el("div", { class: "max-h-80 overflow-auto" });
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" });

  const addButton = button("Add", { icon: "plus", kind: "fill" });

  const save = () => writePin(PIN, list);
  const tile = (key, value) => el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
    el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, String(value)),
    el("span", { class: "text-2xs font-semibold text-ink-3" }, key));

  const totals = () => {
    const totalCredits = list.reduce((sum, item) => sum + item.credits, 0);
    const points = list.reduce((sum, item) => sum + item.credits * (POINTS.get(item.grade) ?? 0), 0);
    return { totalCredits, gpa: totalCredits ? points / totalCredits : null };
  };

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
      listWrap.replaceChildren(blank("graduation-cap", "No courses yet."));
    } else {
      listWrap.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
        el("thead", {}, el("tr", {}, el("th", {}, "Course"), el("th", {}, "Credits"), el("th", {}, "Grade"), el("th", {}, ""))),
        el("tbody", {}, ...list.map((item) => el("tr", {},
          el("th", {}, item.name),
          el("td", {}, fmt(item.credits)),
          el("td", {}, item.grade),
          el("td", {}, removeButton(item)))))));
    }
    const { totalCredits, gpa } = totals();
    stats.replaceChildren(tile("GPA", gpa == null ? "-" : fmt(gpa)), tile("Credits", fmt(totalCredits)));
  }

  function add() {
    const text = name.value.trim();
    if (!text) return toast("Name the course first");
    const c = Number(credits.value);
    if (credits.value.trim() === "" || !Number.isFinite(c) || c < 0) return toast("Add the credits");
    list.push({ id: uid(), name: text, credits: c, grade: grade.value });
    name.value = "";
    credits.value = "";
    name.focus();
    save();
    render();
  }

  name.addEventListener("keydown", (event) => { if (event.key === "Enter") add(); });
  addButton.addEventListener("click", add);

  const card = toolcard({
    body: bench(
      stack(panel("Course", name), row(panel("Credits", credits), panel("Grade", grade))),
      stack(stats, panel("Courses", listWrap))
    ),
    foot: actions(copyButton(() => {
      const { totalCredits, gpa } = totals();
      return gpa == null ? "" : `GPA ${fmt(gpa)}, credits ${fmt(totalCredits)}`;
    }, "Copy result"), addButton)});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
