// Tests a pattern against sample text, highlighting matches and listing groups.
import { el, bench, stack, panel, textInput, textArea, notice, copyButton, actions, toolcard } from "../core.js";

const MAX_MATCHES = 1000;

export function mount(slot) {
  const patternInput = textInput({ value: "\\b(\\w+)@(\\w+)\\.com\\b", "aria-label": "Pattern", spellcheck: "false" });
  const flagsInput = textInput({ value: "g", "aria-label": "Flags", spellcheck: "false", placeholder: "g i m s u y" });
  const source = textArea({
    rows: 8,
    "aria-label": "Text to test",
    value: "Contact ada@example.com or grace@navy.com for details."});
  const pane = el("div", { class: "min-h-[120px] max-h-[380px] overflow-auto wrap-anywhere rounded-r1 border border-orbit bg-deck-2 px-4 py-3.5 leading-normal" });
  const listWrap = el("div", { class: "max-h-80 overflow-auto" });
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
      nodes.push(el("span", { class: "rounded-[3px] bg-star/40" }, match[0] || "\u200b"));
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
      listWrap.append(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "No matches."));
      return;
    }
    const table = el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
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
    foot: actions(copyButton(() => lines.join("\n"), "Copy matches", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
