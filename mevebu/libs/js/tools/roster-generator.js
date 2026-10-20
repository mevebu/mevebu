// A rotating duty roster. Names take turns across a date range, with a fixed
// number of slots per day, an optional weekend skip, and pinned dates.
import {
  el, toast, download, bench, stack, panel, textArea, numberInput, button,
  actions, toolcard, blank, notice, checkbox, selectInput,
} from "../core.js";

function parseNames(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function parsePins(text) {
  const pins = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = /^(\d{4}-\d{2}-\d{2})\s*[:|,]\s*(.+)$/.exec(line.trim());
    if (match) pins.set(match[1], match[2].split(/\s*(?:,|\|)\s*/).map((name) => name.trim()).filter(Boolean));
  }
  return pins;
}

function iso(date) {
  // Local date parts, not toISOString: a browser east or west of UTC would
  // otherwise show yesterday or tomorrow in the date field.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function mount(slot) {
  const names = textArea({ rows: 7, placeholder: "Ani\nBudi\nCitra\nDewi", "aria-label": "Names" });
  const start = el("input", {
    class: "w-full min-h-[var(--ctl)] rounded-r1 border border-orbit bg-deck px-3 py-2.5 text-base focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft",
    type: "date",
    value: iso(new Date()),
    "aria-label": "Start date",
  });
  const end = el("input", {
    class: "w-full min-h-[var(--ctl)] rounded-r1 border border-orbit bg-deck px-3 py-2.5 text-base focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft",
    type: "date",
    value: iso(new Date(Date.now() + 13 * 86400000)),
    "aria-label": "End date",
  });
  const perDay = numberInput({ min: "1", max: "20", step: "1", value: "1", "aria-label": "People per day" });
  const skipWeekend = checkbox("Skip weekends", { checked: true });
  const pins = textArea({ rows: 3, placeholder: "2026-10-25: Ani", "aria-label": "Pinned dates" });
  const order = selectInput(
    [
      { value: "forward", label: "Forward" },
      { value: "reverse", label: "Reverse" },
    ],
    { value: "forward", "aria-label": "Rotation direction" }
  );

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const table = el("div", { class: "overflow-x-auto rounded-r2 border border-orbit" });
  const empty = blank("calendar-check", "Add names and a date range.");

  let rows = [];

  function build() {
    const list = parseNames(names.value);
    const pinned = parsePins(pins.value);
    error.write("");
    rows = [];
    if (!list.length) return;

    const from = new Date(`${start.value}T00:00:00`);
    const to = new Date(`${end.value}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      error.write("Pick a start and an end date.");
      return;
    }
    if (to < from) {
      error.write("The end date is before the start date.");
      return;
    }

    const slots = Math.max(1, Math.min(Number(perDay.value) || 1, list.length));
    const sequence = order.value === "reverse" ? [...list].reverse() : [...list];
    let cursor = 0;
    let guard = 0;

    for (let day = new Date(from); day <= to && guard < 400; day.setDate(day.getDate() + 1), guard++) {
      const weekday = day.getDay();
      if (skipWeekend.input.checked && (weekday === 0 || weekday === 6)) continue;
      const key = iso(day);
      if (pinned.has(key)) {
        rows.push({ date: key, people: pinned.get(key), pinned: true });
        continue;
      }
      const people = [];
      for (let i = 0; i < slots; i++) {
        people.push(sequence[cursor % sequence.length]);
        cursor++;
      }
      rows.push({ date: key, people, pinned: false });
    }
    if (guard >= 400) error.write("That range is very long, so it stops at 400 days.");
  }

  function render() {
    empty.hidden = rows.length > 0;
    table.hidden = rows.length === 0;
    if (!rows.length) {
      summary.textContent = "";
      table.replaceChildren();
      return;
    }
    const counts = new Map();
    for (const row of rows) for (const name of row.people) counts.set(name, (counts.get(name) ?? 0) + 1);
    const spread = [...counts.values()];
    const even = spread.length ? `${Math.min(...spread)} to ${Math.max(...spread)} turns each` : "";
    summary.textContent = `${rows.length} day${rows.length === 1 ? "" : "s"} · ${counts.size} people · ${even}`;

    const head = el("div", {
      class: "grid gap-3 border-b border-orbit bg-deck-2 px-3 py-2 text-2xs font-bold tracking-[0.06em] text-ink-3 uppercase [grid-template-columns:minmax(110px,150px)_minmax(0,1fr)]",
    }, el("span", {}, "Date"), el("span", {}, "On duty"));

    const body = rows.map((row) =>
      el("div", {
        class: "grid gap-3 border-b border-orbit px-3 py-2 text-sm last:border-b-0 [grid-template-columns:minmax(110px,150px)_minmax(0,1fr)]",
      },
        el("span", { class: "font-mono text-2xs text-ink-3 tabular-nums" }, row.date),
        el("span", { class: "wrap-anywhere" }, row.people.join(", "),
          row.pinned ? el("span", { class: "ms-2 rounded-full bg-jade-soft px-1.5 py-0.5 text-2xs font-semibold text-jade" }, "pinned") : null))
    );

    table.replaceChildren(head, ...body);
  }

  function run() {
    build();
    render();
  }

  names.addEventListener("input", run);
  start.addEventListener("change", run);
  end.addEventListener("change", run);
  perDay.addEventListener("input", run);
  skipWeekend.input.addEventListener("change", run);
  pins.addEventListener("input", run);
  order.addEventListener("change", run);

  const copyButton = button("Copy roster", {
    icon: "copy",
    onclick: async () => {
      if (!rows.length) return;
      const text = rows.map((row) => `${row.date}\t${row.people.join(", ")}`).join("\n");
      try {
        await navigator.clipboard.writeText(text);
        toast("Roster copied");
      } catch {
        error.write("The clipboard is blocked here. Download the CSV instead.");
      }
    },
  });

  const downloadButton = button("Download CSV", {
    icon: "download",
    kind: "fill",
    onclick: () => {
      if (!rows.length) return;
      const csv = [["date", "people"], ...rows.map((row) => [row.date, row.people.join("; ")])]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      download("roster.csv", csv, "text/csv");
    },
  });

  run();

  const shell = toolcard({
    body: bench(
      stack(
        panel("Names", names, "One per line. The rotation continues in this order."),
        el("div", { class: "grid grid-cols-2 gap-3" }, panel("From", start), panel("To", end)),
        panel("People per day", perDay),
        panel("Direction", order),
        skipWeekend,
        panel("Pinned dates", pins, "One per line, like 2026-10-25: Ani."),
        error
      ),
      stack(summary, empty, table)
    ),
    foot: actions(copyButton, downloadButton),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
