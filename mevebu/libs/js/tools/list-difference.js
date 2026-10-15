// Compares two lists and shows what is only in each and what they share.
import { el, bench, stack, panel, textArea, checkbox, output, copyButton, actions, toolcard } from "../core.js";

const linesOf = (text) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

function uniqueLines(text, ignoreCase) {
  const seen = new Set();
  const out = [];
  for (const line of linesOf(text)) {
    const key = ignoreCase ? line.toLowerCase() : line;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const first = textArea({ rows: 8, "aria-label": "List A", placeholder: "One entry per line" });
  const second = textArea({ rows: 8, "aria-label": "List B", placeholder: "One entry per line" });
  const caseBox = checkbox("Ignore case");

  const onlyAOut = output({ rows: 5 });
  const onlyBOut = output({ rows: 5 });
  const bothOut = output({ rows: 5 });
  const onlyATile = tile("Only in A");
  const onlyBTile = tile("Only in B");
  const bothTile = tile("In both");
  const stats = el("div", { class: "mvb-stats" }, onlyATile, onlyBTile, bothTile);
  let report = "";

  function run() {
    const ignoreCase = caseBox.input.checked;
    const key = (line) => (ignoreCase ? line.toLowerCase() : line);
    const a = uniqueLines(first.value, ignoreCase);
    const b = uniqueLines(second.value, ignoreCase);
    const keyB = new Set(b.map(key));
    const keyA = new Set(a.map(key));
    const onlyA = a.filter((line) => !keyB.has(key(line)));
    const onlyB = b.filter((line) => !keyA.has(key(line)));
    const both = a.filter((line) => keyB.has(key(line)));

    onlyAOut.write(onlyA.join("\n"));
    onlyBOut.write(onlyB.join("\n"));
    bothOut.write(both.join("\n"));
    onlyATile.set(String(onlyA.length));
    onlyBTile.set(String(onlyB.length));
    bothTile.set(String(both.length));

    report = [
      `Only in A (${onlyA.length}):`,
      onlyA.join("\n"),
      "",
      `Only in B (${onlyB.length}):`,
      onlyB.join("\n"),
      "",
      `In both (${both.length}):`,
      both.join("\n"),
    ].join("\n");
  }

  first.addEventListener("input", run);
  second.addEventListener("input", run);
  caseBox.input.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("List A", first), panel("List B", second), panel(null, caseBox)),
      stack(stats, panel("Only in A", onlyAOut), panel("Only in B", onlyBOut), panel("In both", bothOut))
    ),
    foot: actions(copyButton(() => report, "Copy report", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
