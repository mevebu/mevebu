// Split a list into balanced groups. Two modes: a fixed number of groups, or a
// fixed size per group. Exclusion pairs keep two people apart, and leads are
// spread one per group.
import {
  el, toast, download, bench, stack, panel, textArea, numberInput, checkbox,
  button, actions, toolcard, blank, notice, chipRow, copyButton,
} from "../core.js";

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function parseNames(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parsePairs(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.split(/\s*(?:\||,|;|\+)\s*/).map((part) => part.trim()).filter(Boolean))
    .filter((pair) => pair.length === 2);
}

function violates(groups, pairs) {
  const where = new Map();
  groups.forEach((group, index) => group.forEach((name) => where.set(name, index)));
  return pairs.some(([a, b]) => where.has(a) && where.has(b) && where.get(a) === where.get(b));
}

function build(names, mode, value, pairs, leads, attempts = 400) {
  if (!names.length) return null;
  let best = null;
  for (let round = 0; round < attempts; round++) {
    const pool = shuffle(names);
    let groups;
    if (mode === "groups") {
      const count = Math.max(1, Math.min(value, names.length));
      groups = Array.from({ length: count }, () => []);
      pool.forEach((name, index) => groups[index % count].push(name));
    } else {
      const size = Math.max(1, value);
      groups = [];
      for (let i = 0; i < pool.length; i += size) groups.push(pool.slice(i, i + size));
    }
    if (pairs.length && violates(groups, pairs)) {
      best ??= groups;
      continue;
    }
    return groups;
  }
  return best;
}

function placeLeads(groups, leads) {
  if (!leads.length) return groups;
  const pool = [...leads];
  // One lead per group first, then any leftover leads join the smallest group.
  for (const group of groups) {
    if (!pool.length) break;
    const lead = pool.shift();
    if (group.includes(lead)) continue;
    const at = group.findIndex((name) => !leads.includes(name));
    if (at >= 0) group[at] = lead;
    else group.push(lead);
  }
  for (const lead of pool) {
    const smallest = groups.reduce((a, b) => (a.length <= b.length ? a : b));
    if (!smallest.includes(lead)) smallest.push(lead);
  }
  return groups;
}

export function mount(slot) {
  const names = textArea({ rows: 8, placeholder: "Ani\nBudi\nCitra\nDewi", "aria-label": "Names" });
  const leads = textArea({ rows: 3, placeholder: "Ani\nBudi", "aria-label": "Leads" });
  const exclusions = textArea({ rows: 3, placeholder: "Ani, Budi", "aria-label": "Exclusion pairs" });

  let mode = "groups";
  const modeRow = chipRow(
    [
      { value: "groups", label: "Number of groups" },
      { value: "size", label: "Size per group" },
    ],
    { value: "groups", label: "Split by", onChange: (value) => { mode = value; sync(); } }
  );
  const amount = numberInput({ min: "1", max: "200", step: "1", value: "4", "aria-label": "Group count or size" });
  const amountLabel = el("span", { class: "text-sm font-semibold text-ink-2" }, "Groups");
  const keepLeads = checkbox("One lead per group", { checked: true });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const output = el("div", { class: "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]" });
  const empty = blank("users-round", "Paste names to build the groups.");

  const generate = button("Generate", { icon: "shuffle", kind: "fill" });
  const copyAll = copyButton(() => summary.dataset.plain ?? "", "Copy groups");

  let groups = [];

  function sync() {
    amountLabel.textContent = mode === "groups" ? "Groups" : "People per group";
  }

  function render() {
    empty.hidden = groups.length > 0;
    output.hidden = groups.length === 0;
    copyAll.disabled = groups.length === 0;
    output.replaceChildren(
      ...groups.map((group, index) =>
        el(
          "section",
          { class: "grid content-start gap-2 rounded-r2 border border-orbit bg-deck-2 p-3.5" },
          el("h3", { class: "m-0 flex items-baseline justify-between gap-2 text-sm font-bold" },
            el("span", {}, `Group ${index + 1}`),
            el("span", { class: "text-2xs font-semibold text-ink-3 tabular-nums" }, `${group.length}`)),
          el("ul", { class: "m-0 grid list-none gap-1 p-0" },
            ...group.map((name) =>
              el("li", { class: "flex items-center gap-1.5 text-sm text-ink-2" },
                el("span", { class: "size-1.5 flex-none rounded-full bg-jade" }), name)))
        )
      )
    );
  }

  function run() {
    const list = parseNames(names.value);
    const leadList = keepLeads.input.checked ? parseNames(leads.value).filter((name) => list.includes(name)) : [];
    const pairs = parsePairs(exclusions.value).filter(([a, b]) => list.includes(a) && list.includes(b));
    error.write("");

    if (!list.length) {
      groups = [];
      summary.textContent = "";
      render();
      return;
    }
    if (list.length !== new Set(list).size) error.write("A name appears more than once, so the count is off.");
    if (leadList.length && mode === "groups" && leadList.length > Number(amount.value)) {
      error.write("There are more leads than groups, so some groups get two.");
    }

    groups = build(list, mode, Math.max(1, Number(amount.value) || 1), pairs, leadList) ?? [];
    if (keepLeads.input.checked) groups = placeLeads(groups, leadList);

    const sizes = groups.map((group) => group.length);
    const spread = sizes.length ? Math.max(...sizes) - Math.min(...sizes) : 0;
    summary.textContent = `${list.length} people · ${groups.length} group${groups.length === 1 ? "" : "s"} · ${Math.min(...sizes)} to ${Math.max(...sizes)} each${spread > 1 ? ", uneven because of the rules" : ""}`;
    summary.dataset.plain = groups.map((group, index) => `Group ${index + 1}: ${group.join(", ")}`).join("\n");
    render();
  }

  generate.addEventListener("click", () => {
    run();
    if (groups.length) toast("Groups ready");
  });
  amount.addEventListener("input", run);
  keepLeads.input.addEventListener("change", run);
  names.addEventListener("input", run);

  const downloadButton = button("Download CSV", {
    icon: "download",
    onclick: () => {
      if (!groups.length) return;
      const rows = [["group", "name"]];
      groups.forEach((group, index) => group.forEach((name) => rows.push([String(index + 1), name])));
      const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
      download("groups.csv", csv, "text/csv");
    },
  });

  sync();
  run();

  const shell = toolcard({
    body: bench(
      stack(
        panel("Names", names, "One per line."),
        el("div", { class: "grid gap-1.5" }, el("span", { class: "text-sm font-semibold text-ink-2" }, "Split by"), modeRow),
        panel(amountLabel, amount),
        panel("Leads", leads, "Optional. One per line."),
        keepLeads,
        panel("Keep apart", exclusions, "One pair per line, like Ani, Budi."),
        error
      ),
      stack(summary, empty, output)
    ),
    foot: actions(copyAll, downloadButton, generate),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
