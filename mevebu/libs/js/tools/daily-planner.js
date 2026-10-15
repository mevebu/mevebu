// Plans a day by the clock, sorting activities and flagging overlaps.
import { el, toast, blank, bench, stack, row, panel, textInput, button, notice, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const toMin = (time) => {
  const [h, m] = String(time).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

function fmtDur(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function mount(slot) {
  const PIN = "daily-planner";
  const saved = readPin(PIN, []);
  let list = Array.isArray(saved) ? saved : [];

  const title = textInput({ placeholder: "Activity", "aria-label": "Activity" });
  const start = el("input", { class: "min-w-0 rounded-r1 border border-orbit bg-deck text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 hover:border-orbit-hard focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft w-full min-h-[var(--ctl)] px-3 py-2.5 text-base", type: "time", value: "09:00", "aria-label": "Start time" });
  const end = el("input", { class: "min-w-0 rounded-r1 border border-orbit bg-deck text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 hover:border-orbit-hard focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft w-full min-h-[var(--ctl)] px-3 py-2.5 text-base", type: "time", value: "10:00", "aria-label": "End time" });

  const listWrap = el("div", { class: "max-h-80 overflow-auto" });
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" });
  const overlapNote = notice("error");
  const error = notice("error");

  const addButton = button("Add", { icon: "plus", kind: "fill" });
  const clearButton = button("Clear day", { icon: "trash" });

  const tile = (key, value) => el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
    el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, String(value)),
    el("span", { class: "text-2xs font-semibold text-ink-3" }, key));

  const save = () => writePin(PIN, list);

  function removeButton(item) {
    const node = button("", { icon: "trash", "aria-label": `Remove ${item.text}` });
    node.addEventListener("click", () => {
      list = list.filter((entry) => entry.id !== item.id);
      save();
      render();
    });
    return node;
  }

  function render() {
    const sorted = list.slice().sort((a, b) => toMin(a.start) - toMin(b.start));
    const flagged = new Set();
    for (let i = 0; i < sorted.length - 1; i++) {
      if (toMin(sorted[i].end) > toMin(sorted[i + 1].start)) {
        flagged.add(sorted[i].id);
        flagged.add(sorted[i + 1].id);
      }
    }

    if (!sorted.length) {
      listWrap.replaceChildren(blank("calendar-check", "No activities yet."));
    } else {
      const rows = sorted.map((item) => el("tr", {},
        el("th", {}, item.start),
        el("td", {}, item.end),
        el("td", {}, item.text),
        el("td", {}, fmtDur(Math.max(0, toMin(item.end) - toMin(item.start)))),
        el("td", {}, flagged.has(item.id) ? "Overlap" : ""),
        el("td", {}, removeButton(item))
      ));
      listWrap.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
        el("thead", {}, el("tr", {},
          el("th", {}, "Start"), el("th", {}, "End"), el("th", {}, "Activity"),
          el("th", {}, "Length"), el("th", {}, "Note"), el("th", {}, ""))),
        el("tbody", {}, ...rows)
      ));
    }

    const planned = sorted.reduce((sum, item) => sum + Math.max(0, toMin(item.end) - toMin(item.start)), 0);
    stats.replaceChildren(tile("Activities", sorted.length), tile("Planned", fmtDur(planned)));
    overlapNote.write(flagged.size ? `${flagged.size} activities overlap.` : "");
    clearButton.disabled = list.length === 0;
  }

  function add() {
    const text = title.value.trim();
    if (!text) return toast("Add an activity name");
    if (!start.value || !end.value || toMin(end.value) <= toMin(start.value)) {
      error.write("End time must be after the start.");
      return;
    }
    error.write("");
    list.push({ id: uid(), text, start: start.value, end: end.value });
    title.value = "";
    save();
    render();
  }

  addButton.addEventListener("click", add);
  clearButton.addEventListener("click", () => {
    list = [];
    save();
    render();
  });

  const card = toolcard({
    body: bench(
      stack(
        panel("Activity", title),
        row(panel("Start", start), panel("End", end)),
        error
      ),
      stack(stats, panel("Day", listWrap), overlapNote)
    ),
    foot: actions(clearButton, addButton)});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
