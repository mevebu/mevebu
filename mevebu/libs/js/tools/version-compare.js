// Compares two versions and says which is newer and where they differ.
import { bench, stack, panel, textInput, notice, output, copyButton, actions, toolcard } from "../core.js";

function parse(text) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(text.trim());
  if (!match) return null;
  return { core: match.slice(1, 4).map(Number), pre: match[4] || "" };
}

export function mount(slot) {
  const left = textInput({ value: "1.2.0", mono: true, "aria-label": "First version" });
  const right = textInput({ value: "1.1.5", mono: true, "aria-label": "Second version" });
  const error = notice("error");
  const out = output({ rows: 8 });
  let text = "";

  function run() {
    error.write("");
    const a = parse(left.value);
    const b = parse(right.value);
    if (!a || !b) {
      text = "";
      out.write("");
      error.write("Enter two versions like 1.2.3.");
      return;
    }
    const names = ["major", "minor", "patch"];
    const lines = [];
    let verdict = "equal";
    for (let i = 0; i < 3; i++) {
      const sign = a.core[i] === b.core[i] ? "=" : a.core[i] > b.core[i] ? ">" : "<";
      if (sign !== "=" && verdict === "equal") verdict = sign === ">" ? "a" : "b";
      lines.push(`${names[i]} ${a.core[i]} ${sign} ${b.core[i]}`);
    }
    if (a.core.every((part, i) => part === b.core[i])) {
      if (a.pre === b.pre) verdict = "equal";
      else if (!a.pre) verdict = "a";
      else if (!b.pre) verdict = "b";
      else verdict = a.pre > b.pre ? "a" : "b";
      lines.push(`prerelease ${a.pre || "none"} ${a.pre === b.pre ? "=" : a.pre > b.pre ? ">" : "<"} ${b.pre || "none"}`);
    }
    const av = left.value.trim();
    const bv = right.value.trim();
    const head =
      verdict === "equal"
        ? `${av} and ${bv} are the same version.`
        : verdict === "a"
          ? `${av} is newer than ${bv}.`
          : `${bv} is newer than ${av}.`;
    text = `${[head, "", ...lines].join("\n")}\n`;
    out.write(text);
  }

  left.addEventListener("input", run);
  right.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("First version", left), panel("Second version", right), error),
      stack(panel("Comparison", out))
    ),
    foot: actions(copyButton(() => text, "Copy comparison", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
