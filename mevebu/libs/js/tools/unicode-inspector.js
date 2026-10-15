// Lists each character with its code point, decimal value and UTF-8 bytes.
import { el, bench, stack, panel, textArea, copyButton, actions, toolcard } from "../core.js";

const hex = (value, width) => value.toString(16).toUpperCase().padStart(width, "0");

function describe(char) {
  const point = char.codePointAt(0);
  const bytes = [...new TextEncoder().encode(char)].map((byte) => hex(byte, 2)).join(" ");
  return { char, point: `U+${hex(point, 4)}`, decimal: String(point), bytes };
}

export function mount(slot) {
  const source = textArea({ rows: 8, value: "mevebu", "aria-label": "Text" });
  const scroll = el("div", { class: "max-h-80 overflow-auto" });
  let rows = [];

  function run() {
    rows = Array.from(source.value).map(describe);
    if (!rows.length) {
      scroll.replaceChildren(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "Type or paste text."));
      return;
    }
    scroll.replaceChildren(el(
      "table",
      { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
      el("thead", {}, el("tr", {},
        el("th", {}, "Character"),
        el("th", {}, "Code point"),
        el("th", {}, "Decimal"),
        el("th", {}, "UTF-8"))),
      el("tbody", {}, ...rows.map((entry) => el("tr", {},
        el("td", {}, entry.char),
        el("td", {}, entry.point),
        el("td", {}, entry.decimal),
        el("td", {}, entry.bytes))))
    ));
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source)),
      stack(panel("Characters", scroll))
    ),
    foot: actions(copyButton(
      () => rows.map((entry) => `${entry.char}\t${entry.point}\t${entry.decimal}\t${entry.bytes}`).join("\n"),
      "Copy table",
      "fill"
    ))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
