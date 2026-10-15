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
  const scroll = el("div", { class: "mvb-scroll" });
  const count = el("span", { class: "mvb-stat__v" }, "0");
  const stats = el("div", { class: "mvb-stats" }, el("div", { class: "mvb-stat" }, count, el("span", { class: "mvb-stat__k" }, "Problems")));
  let problems = [];

  function run() {
    problems = check(source.value);
    count.textContent = String(problems.length);
    if (!problems.length) {
      scroll.replaceChildren(el("p", { class: "mvb-note" }, "No problems."));
      return;
    }
    scroll.replaceChildren(el(
      "table",
      { class: "mvb-ttable" },
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
    foot: actions(copyButton(() => problems.map((entry) => `${entry.line}: ${entry.message}`).join("\n"), "Copy problems", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
