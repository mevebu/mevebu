// Checks a small YAML subset for indentation and key spacing problems.
import { el, bench, stack, panel, textArea, copyButton, actions, toolcard } from "../core.js";

function check(source) {
  const problems = [];
  const lines = source.split(/\r?\n/);
  let step = 0;

  lines.forEach((raw, index) => {
    const line = index + 1;
    if (!raw.trim()) return;

    const lead = raw.match(/^[ \t]*/)[0];
    if (lead.includes("\t")) {
      problems.push({ line, message: "Tab used for indentation." });
    } else if (lead.length) {
      if (step === 0) step = lead.length;
      else if (lead.length % step !== 0) problems.push({ line, message: `Indentation is not a multiple of ${step}.` });
    }

    const body = raw.trim().replace(/^-\s+/, "");
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(body)) return;
    const match = body.match(/^([^:#]+?)(\s*):(\s*)(.*)$/);
    if (!match) return;
    if (match[2]) problems.push({ line, message: "Remove the space before the colon." });
    if (match[4] && !match[3]) problems.push({ line, message: "Add a space after the colon." });
  });

  return problems;
}

export function mount(slot) {
  const source = textArea({ rows: 11, value: "name: mevebu\ntools:\n  - unicode\n  - json", "aria-label": "YAML" });
  const scroll = el("div", { class: "max-h-80 overflow-auto" });
  const count = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, count, el("span", { class: "text-2xs font-semibold text-ink-3" }, "Problems")));
  let problems = [];

  function run() {
    problems = check(source.value);
    count.textContent = String(problems.length);
    if (!problems.length) {
      scroll.replaceChildren(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "No problems."));
      return;
    }
    scroll.replaceChildren(el(
      "table",
      { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
      el("thead", {}, el("tr", {}, el("th", {}, "Line"), el("th", {}, "Problem"))),
      el("tbody", {}, ...problems.map((entry) => el("tr", {},
        el("th", {}, String(entry.line)),
        el("td", {}, entry.message))))
    ));
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("YAML", source)),
      stack(stats, panel("Problems", scroll))
    ),
    foot: actions(copyButton(() => problems.map((entry) => `${entry.line}: ${entry.message}`).join("\n"), "Copy problems", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
