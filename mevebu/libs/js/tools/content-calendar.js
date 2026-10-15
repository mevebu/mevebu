// Posts on a calendar, kept in local storage, exportable as CSV or Markdown.
import { el, toast, blank, bench, stack, row, panel, textInput, chipRow, button, downloadButton, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const STATUS = ["Idea", "Draft", "Scheduled", "Published"];

export function mount(slot) {
  const PIN = "content-calendar";
  const saved = readPin(PIN, { entries: [] });
  let entries = Array.isArray(saved.entries) ? saved.entries : [];

  const date = textInput({ type: "date", "aria-label": "Date" });
  const topic = textInput({ placeholder: "Topic", "aria-label": "Topic" });
  const platform = textInput({ placeholder: "Platform", "aria-label": "Platform" });
  let status = "Idea";
  const statusChips = chipRow(
    STATUS.map((value) => ({ value, label: value })),
    { value: "Idea", label: "Status", onChange: (next) => { status = next; } }
  );

  const listWrap = el("div", { class: "max-h-80 overflow-auto" });
  const addButton = button("Add", { icon: "plus", kind: "fill" });

  const save = () => writePin(PIN, { entries });

  function removeButton(entry) {
    const node = button("", { icon: "trash", "aria-label": `Remove ${entry.topic}` });
    node.addEventListener("click", () => {
      entries = entries.filter((item) => item.id !== entry.id);
      save();
      render();
    });
    return node;
  }

  function render() {
    if (!entries.length) {
      listWrap.replaceChildren(blank("calendar-days", "No posts planned yet."));
      return;
    }
    const sorted = entries.slice().sort((a, b) => a.date.localeCompare(b.date));
    const rows = sorted.map((entry) => el("tr", {},
      el("th", {}, entry.date || "-"),
      el("td", {}, entry.topic),
      el("td", {}, entry.platform || ""),
      el("td", {}, entry.status),
      el("td", {}, removeButton(entry))));
    listWrap.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
      el("thead", {}, el("tr", {},
        el("th", {}, "Date"), el("th", {}, "Topic"), el("th", {}, "Platform"), el("th", {}, "Status"), el("th", {}, ""))),
      el("tbody", {}, ...rows)));
  }

  function add() {
    const when = date.value.trim();
    const text = topic.value.trim();
    if (!when) return toast("Pick a date");
    if (!text) return toast("Add a topic");
    entries.push({ id: uid(), date: when, topic: text, platform: platform.value.trim(), status });
    topic.value = "";
    platform.value = "";
    topic.focus();
    save();
    render();
  }

  addButton.addEventListener("click", add);

  function csv() {
    const rows = [["Date", "Topic", "Platform", "Status"]];
    for (const entry of entries) rows.push([entry.date, entry.topic, entry.platform, entry.status]);
    return rows.map((cells) => cells.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  }

  function markdown() {
    const sorted = entries.slice().sort((a, b) => a.date.localeCompare(b.date));
    const lines = ["# Content calendar", ""];
    let current = null;
    for (const entry of sorted) {
      if (entry.date !== current) {
        current = entry.date;
        lines.push(`## ${entry.date}`);
      }
      lines.push(`- ${entry.topic}${entry.platform ? ` (${entry.platform})` : ""} - ${entry.status}`);
    }
    return lines.join("\n");
  }

  const card = toolcard({
    body: bench(
      stack(
        panel("Date", date),
        panel("Topic", topic),
        row(panel("Platform", platform), panel("Status", statusChips))
      ),
      stack(panel("Plan", listWrap))
    ),
    foot: actions(
      downloadButton(() => csv(), "content-calendar.csv", "Save CSV", "text/csv"),
      downloadButton(() => markdown(), "content-calendar.md", "Save Markdown", "text/markdown"),
      addButton
    )});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
