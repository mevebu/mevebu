// Tests a pattern against sample text, highlighting matches and listing groups.
import { el, bench, stack, panel, textInput, textArea, notice, copyButton, actions, toolcard } from "../core.js";

const MAX_MATCHES = 1000;

export function mount(slot) {
  const patternInput = textInput({ value: "\\b(\\w+)@(\\w+)\\.com\\b", "aria-label": "Pattern", spellcheck: "false" });
  const flagsInput = textInput({ value: "g", "aria-label": "Flags", spellcheck: "false", placeholder: "g i m s u y" });
  const source = textArea({
    rows: 8,
    class: "mvb-in mvb-in--area mvb-in--mono",
    "aria-label": "Text to test",
    value: "Contact ada@example.com or grace@navy.com for details.",
  });
  const pane = el("div", { class: "mvb-pane" });
  const listWrap = el("div", { class: "mvb-scroll" });
  const error = notice("error");
  let lines = [];

  function run() {
    error.write("");
    pane.replaceChildren();
    listWrap.replaceChildren();
    lines = [];
    const pattern = patternInput.value;
    if (!pattern) return;
    let flags = flagsInput.value.replace(/[^gimsuy]/g, "");
    if (!flags.includes("g")) flags += "g";
    let re;
    try {
      re = new RegExp(pattern, flags);
    } catch (caught) {
      error.write(caught.message);
      return;
    }
    const text = source.value;
    const nodes = [];
    const rows = [];
    let last = 0;
    let count = 0;
    let match;
    while ((match = re.exec(text)) && count < MAX_MATCHES) {
      if (match.index === re.lastIndex) re.lastIndex++;
      nodes.push(document.createTextNode(text.slice(last, match.index)));
      nodes.push(el("span", { class: "mvb-hl" }, match[0] || "\u200b"));
      last = match.index + match[0].length;
      const groups = match.slice(1).map((group) => group ?? "").join(", ");
      rows.push(el("tr", {},
        el("th", {}, String(count + 1)),
        el("td", {}, match[0] || "(empty)"),
        el("td", {}, groups)
      ));
      lines.push(match[0]);
      count++;
    }
    nodes.push(document.createTextNode(text.slice(last)));
    pane.append(...nodes);
    if (!count) {
      listWrap.append(el("p", { class: "mvb-note" }, "No matches."));
      return;
    }
    const table = el("table", { class: "mvb-ttable" },
      el("thead", {}, el("tr", {}, el("th", {}, "#"), el("th", {}, "Match"), el("th", {}, "Groups"))),
      el("tbody", {}, ...rows)
    );
    listWrap.append(table);
  }

  patternInput.addEventListener("input", run);
  flagsInput.addEventListener("input", run);
  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Pattern", patternInput), panel("Flags", flagsInput), panel("Text", source), error),
      stack(panel("Matches", pane), panel("Groups", listWrap))
    ),
    foot: actions(copyButton(() => lines.join("\n"), "Copy matches", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
