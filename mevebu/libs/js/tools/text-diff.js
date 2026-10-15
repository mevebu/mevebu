// Line by line comparison of two texts, marking added and removed lines.
import { el, bench, stack, panel, textArea, toggleRow, notice, button, copyButton, actions, toolcard } from "../core.js";

const MAX_LINES = 800;

export function mount(slot) {
  const left = textArea({ rows: 9, "aria-label": "First text", placeholder: "First text" });
  const right = textArea({ rows: 9, "aria-label": "Second text", placeholder: "Second text" });
  const options = toggleRow([
    { value: "ignore", label: "Ignore case", checked: false },
    { value: "spaces", label: "Ignore spaces", checked: false }]);
  const diffBox = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" });
  const note = notice("note");
  let rows = [];

  function normalize(line) {
    let text = line;
    if (options.values().includes("spaces")) text = text.replace(/\s+/g, " ").trim();
    if (options.values().includes("ignore")) text = text.toLowerCase();
    return text;
  }

  function diffLines(aNorm, bNorm, aRaw, bRaw) {
    const n = aNorm.length;
    const m = bNorm.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = aNorm[i] === bNorm[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (aNorm[i] === bNorm[j]) { out.push(["same", aRaw[i]]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push(["del", aRaw[i]]); i++; }
      else { out.push(["add", bRaw[j]]); j++; }
    }
    while (i < n) { out.push(["del", aRaw[i]]); i++; }
    while (j < m) { out.push(["add", bRaw[j]]); j++; }
    return out;
  }

  function diffText() {
    return rows.map(([type, raw]) => `${type === "add" ? "+ " : type === "del" ? "- " : "  "}${raw}`).join("\n");
  }

  function run() {
    const aRaw = left.value === "" ? [] : left.value.split("\n");
    const bRaw = right.value === "" ? [] : right.value.split("\n");
    if (!aRaw.length && !bRaw.length) {
      diffBox.replaceChildren();
      rows = [];
      note.write("Paste two texts to compare.");
      return;
    }
    const truncated = aRaw.length > MAX_LINES || bRaw.length > MAX_LINES;
    const a = aRaw.slice(0, MAX_LINES).map(normalize);
    const b = bRaw.slice(0, MAX_LINES).map(normalize);
    rows = diffLines(a, b, aRaw.slice(0, MAX_LINES), bRaw.slice(0, MAX_LINES));
    const added = rows.filter(([type]) => type === "add").length;
    const removed = rows.filter(([type]) => type === "del").length;
    diffBox.replaceChildren(...rows.map(([type, raw]) => el(
      "div",
      {
        // One row skin. The add/del tint and the sign colour hang off the data
        // attribute, so a row never carries two competing background utilities.
        class:
          "grid bg-deck font-mono text-2xs [grid-template-columns:34px_minmax(0,1fr)] [&>span]:wrap-anywhere [&>span]:px-2.5 [&>span]:py-[3px] [&>span]:whitespace-pre-wrap data-[kind=add]:bg-[var(--add)] data-[kind=add]:[&>span:first-child]:text-jade data-[kind=del]:bg-[var(--del)] data-[kind=del]:[&>span:first-child]:text-danger",
        dataset: { kind: type },
      },
      el("span", { class: "border-e border-orbit text-center text-ink-3 select-none" }, type === "add" ? "+" : type === "del" ? "-" : " "),
      el("span", {}, raw)
    )));
    const counts = !added && !removed
      ? "The texts are identical."
      : `${added} added, ${removed} removed.`;
    note.write(truncated ? `${counts} Compared the first ${MAX_LINES} lines.` : counts);
  }

  const swapButton = button("Swap texts", { icon: "arrow-left-right" });
  swapButton.addEventListener("click", () => {
    const value = left.value;
    left.value = right.value;
    right.value = value;
    run();
  });

  left.addEventListener("input", run);
  right.addEventListener("input", run);
  options.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("First text", left), panel("Second text", right), options, note),
      stack(panel("Difference", diffBox))
    ),
    foot: actions(swapButton, copyButton(diffText, "Copy diff", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
