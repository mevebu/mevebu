// Lays out a meeting with owners and time budgets, totalled for you.
import { el, toast, blank, bench, stack, row, panel, textInput, numberInput, button, copyButton, notice, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function hhmm(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fmtDur(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function mount(slot) {
  const PIN = "meeting-agenda";
  const saved = readPin(PIN, { start: "09:00", items: [] });
  let list = Array.isArray(saved.items) ? saved.items : [];

  const startInput = el("input", { class: "min-w-0 rounded-r1 border border-orbit bg-deck text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 hover:border-orbit-hard focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft w-full min-h-[var(--ctl)] px-3 py-2.5 text-base", type: "time", value: saved.start || "09:00", "aria-label": "Meeting start" });
  const topic = textInput({ placeholder: "Topic", "aria-label": "Topic" });
  const owner = textInput({ placeholder: "Owner", "aria-label": "Owner" });
  const minutes = numberInput({ min: 1, max: 600, value: 10, "aria-label": "Minutes" });

  const listWrap = el("div", { class: "max-h-80 overflow-auto" });
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" });
  const error = notice("error");

  const addButton = button("Add", { icon: "plus", kind: "fill" });
  const copyAgenda = copyButton(() => agendaText(), "Copy agenda");

  const tile = (key, value) => el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
    el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, String(value)),
    el("span", { class: "text-2xs font-semibold text-ink-3" }, key));

  const base = () => {
    const [h, m] = String(startInput.value || "00:00").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const save = () => writePin(PIN, { start: startInput.value, items: list });

  function startTimes() {
    const out = [];
    let cursor = base();
    for (const item of list) {
      out.push(hhmm(cursor));
      cursor += Math.max(0, Number(item.minutes) || 0);
    }
    return out;
  }

  function agendaText() {
    const starts = startTimes();
    return list.map((item, i) =>
      `${starts[i]} ${item.topic}${item.owner ? ` (${item.owner})` : ""} ${item.minutes} min`
    ).join("\n");
  }

  function removeButton(item) {
    const node = button("", { icon: "trash", "aria-label": `Remove ${item.topic}` });
    node.addEventListener("click", () => {
      list = list.filter((entry) => entry.id !== item.id);
      save();
      render();
    });
    return node;
  }

  function render() {
    const starts = startTimes();
    if (!list.length) {
      listWrap.replaceChildren(blank("clipboard-list", "No topics yet."));
    } else {
      const rows = list.map((item, i) => el("tr", {},
        el("th", {}, starts[i]),
        el("td", {}, item.topic),
        el("td", {}, item.owner),
        el("td", {}, `${item.minutes} min`),
        el("td", {}, removeButton(item))
      ));
      listWrap.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
        el("thead", {}, el("tr", {},
          el("th", {}, "Start"), el("th", {}, "Topic"), el("th", {}, "Owner"),
          el("th", {}, "Time"), el("th", {}, ""))),
        el("tbody", {}, ...rows)
      ));
    }
    const total = list.reduce((sum, item) => sum + Math.max(0, Number(item.minutes) || 0), 0);
    stats.replaceChildren(tile("Topics", list.length), tile("Total", fmtDur(total)));
    copyAgenda.disabled = list.length === 0;
  }

  function add() {
    const text = topic.value.trim();
    if (!text) return toast("Add a topic first");
    const value = Math.max(1, Number(minutes.value) || 0);
    error.write("");
    list.push({ id: uid(), topic: text, owner: owner.value.trim(), minutes: value });
    topic.value = "";
    owner.value = "";
    save();
    render();
  }

  topic.addEventListener("keydown", (event) => {
    if (event.key === "Enter") add();
  });
  startInput.addEventListener("change", () => {
    save();
    render();
  });
  addButton.addEventListener("click", add);

  const card = toolcard({
    body: bench(
      stack(
        panel("Meeting start", startInput),
        panel("Topic", topic),
        row(panel("Owner", owner), panel("Minutes", minutes)),
        error
      ),
      stack(stats, panel("Agenda", listWrap))
    ),
    foot: actions(copyAgenda, addButton)});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
