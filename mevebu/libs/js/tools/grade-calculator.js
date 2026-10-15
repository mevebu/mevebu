// Weighted components with a check that the weights add up to 100.
import { el, toast, blank, bench, stack, row, panel, textInput, numberInput, button, copyButton, notice, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function mount(slot) {
  const PIN = "grade-calculator";
  const saved = readPin(PIN, []);
  let list = Array.isArray(saved) ? saved : [];

  const name = textInput({ placeholder: "Component", "aria-label": "Component" });
  const score = numberInput({ min: "0", max: "100", placeholder: "Score", "aria-label": "Score" });
  const weight = numberInput({ min: "0", max: "100", placeholder: "Weight", "aria-label": "Weight" });
  const listWrap = el("div", { class: "max-h-80 overflow-auto" });
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" });
  const weightNote = notice("warn");

  const addButton = button("Add", { icon: "plus", kind: "fill" });

  const save = () => writePin(PIN, list);
  const tile = (key, value) => el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
    el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, String(value)),
    el("span", { class: "text-2xs font-semibold text-ink-3" }, key));

  const totalWeight = () => list.reduce((sum, item) => sum + item.weight, 0);
  const grade = () => {
    const weightSum = totalWeight();
    if (!weightSum) return null;
    return list.reduce((sum, item) => sum + item.score * item.weight, 0) / weightSum;
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
      listWrap.replaceChildren(blank("graduation-cap", "No components yet."));
    } else {
      listWrap.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
        el("thead", {}, el("tr", {}, el("th", {}, "Component"), el("th", {}, "Score"), el("th", {}, "Weight"), el("th", {}, ""))),
        el("tbody", {}, ...list.map((item) => el("tr", {},
          el("th", {}, item.name),
          el("td", {}, fmt(item.score)),
          el("td", {}, `${fmt(item.weight)}%`),
          el("td", {}, removeButton(item)))))));
    }
    const weightSum = totalWeight();
    const result = grade();
    stats.replaceChildren(tile("Grade", result == null ? "-" : fmt(result)), tile("Weight", `${fmt(weightSum)}%`));
    weightNote.write(list.length && Math.abs(weightSum - 100) > 0.001 ? `The weights add up to ${fmt(weightSum)}%, not 100.` : "");
  }

  function add() {
    const text = name.value.trim();
    if (!text) return toast("Name the component first");
    const s = Number(score.value);
    const w = Number(weight.value);
    if (score.value.trim() === "" || weight.value.trim() === "" || !Number.isFinite(s) || !Number.isFinite(w)) {
      return toast("Add a score and a weight");
    }
    if (s < 0 || w < 0) return toast("Score and weight cannot be negative");
    list.push({ id: uid(), name: text, score: s, weight: w });
    name.value = "";
    score.value = "";
    weight.value = "";
    name.focus();
    save();
    render();
  }

  name.addEventListener("keydown", (event) => { if (event.key === "Enter") add(); });
  addButton.addEventListener("click", add);

  const card = toolcard({
    body: bench(
      stack(panel("Component", name), row(panel("Score", score), panel("Weight", weight)), weightNote),
      stack(stats, panel("Components", listWrap))
    ),
    foot: actions(copyButton(() => {
      const result = grade();
      return result == null ? "" : `Grade ${fmt(result)}, total weight ${fmt(totalWeight())}%`;
    }, "Copy result"), addButton)});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
