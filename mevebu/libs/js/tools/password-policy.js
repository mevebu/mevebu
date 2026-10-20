// Turns a written password rule into the three things a team needs: the rule in
// plain words, a regex that enforces it, and a checklist that tests a sample.
// The regex is built from the same settings as the text, so the two never drift.
import {
  el, toast, bench, stack, panel, numberInput, checkbox, textInput, button,
  actions, toolcard, notice, copyButton, output,
} from "../core.js";

function escapeClass(chars) {
  return chars.replace(/[\]\\^-]/g, "\\$&");
}

export function mount(slot) {
  const minimum = numberInput({ min: "1", max: "128", step: "1", value: "12", "aria-label": "Minimum length" });
  const maximum = numberInput({ min: "0", max: "512", step: "1", value: "0", "aria-label": "Maximum length, 0 for none" });
  const lower = checkbox("Lowercase letters", { checked: true });
  const upper = checkbox("Uppercase letters", { checked: true });
  const digits = checkbox("Digits", { checked: true });
  const symbols = checkbox("Symbols", { checked: false });
  const noSpaces = checkbox("No spaces", { checked: true });
  const noRepeat = numberInput({ min: "0", max: "10", step: "1", value: "0", "aria-label": "Max repeats in a row, 0 for none" });
  const symbolSet = textInput({ value: "!@#$%^&*()-_=+[]{};:,.?", "aria-label": "Allowed symbols", class: "font-mono text-sm" });
  const sample = textInput({ placeholder: "Type a password to test it", "aria-label": "Sample password", class: "font-mono", autocomplete: "off" });

  const error = notice("warn");
  const rule = el("p", { class: "m-0 text-sm leading-[1.6] text-ink" });
  const pattern = output({ rows: 2 });
  const checks = el("div", { class: "grid gap-1.5" });
  const verdict = el("p", { class: "m-0 text-sm font-semibold" });

  function classes() {
    const out = [];
    if (lower.input.checked) out.push({ label: "lowercase letter", test: (s) => /[a-z]/.test(s), rx: "(?=.*[a-z])" });
    if (upper.input.checked) out.push({ label: "uppercase letter", test: (s) => /[A-Z]/.test(s), rx: "(?=.*[A-Z])" });
    if (digits.input.checked) out.push({ label: "digit", test: (s) => /\d/.test(s), rx: "(?=.*\\d)" });
    if (symbols.input.checked) {
      const set = symbolSet.value;
      const safe = escapeClass(set);
      out.push({
        label: `symbol from ${set || "the set"}`,
        test: (s) => [...s].some((char) => set.includes(char)),
        rx: `(?=.*[${safe}])`,
      });
    }
    return out;
  }

  function build() {
    error.write("");
    const min = Math.max(1, Number(minimum.value) || 1);
    const max = Number(maximum.value) || 0;
    const kinds = classes();
    const repeat = Number(noRepeat.value) || 0;

    if (max && max < min) error.write("The maximum is below the minimum, so no password can pass.");
    if (!kinds.length && !noSpaces.input.checked) error.write("Pick at least one character class, or the rule accepts anything.");

    const parts = [`at least ${min} characters`];
    if (max) parts.push(`at most ${max} characters`);
    for (const kind of kinds) parts.push(`at least one ${kind.label}`);
    if (noSpaces.input.checked) parts.push("no spaces");
    if (repeat) parts.push(`no more than ${repeat} identical characters in a row`);
    rule.textContent = `A password needs ${listSentence(parts)}.`;

    const lookaheads = kinds.map((kind) => kind.rx).join("");
    const length = max ? `{${min},${max}}` : `{${min},}`;
    const space = noSpaces.input.checked ? "(?!.*\\s)" : "";
    const repeats = repeat ? `(?!.*(.)\\1{${repeat}})` : "";
    const regex = `^${lookaheads}${space}${repeats}.${length}$`;
    pattern.write(regex);

    checks.replaceChildren();
    const samples = sample.value;
    const lengthOk = samples.length >= min && (!max || samples.length <= max);
    const rows = [
      { label: `${min}${max ? `–${max}` : "+"} characters`, ok: samples.length > 0 ? lengthOk : null },
      ...kinds.map((kind) => ({ label: kind.label, ok: samples ? kind.test(samples) : null })),
    ];
    if (noSpaces.input.checked) rows.push({ label: "no spaces", ok: samples ? !/\s/.test(samples) : null });
    if (repeat) rows.push({ label: `no more than ${repeat} repeats in a row`, ok: samples ? !new RegExp(`(.)\\1{${repeat}}`).test(samples) : null });

    checks.replaceChildren(
      ...rows.map((row) =>
        el("div", { class: "flex items-center gap-2 text-sm" },
          el("span", {
            class: `inline-flex size-5 flex-none items-center justify-center rounded-full text-2xs font-bold ${row.ok === null ? "bg-deck-2 text-ink-3" : row.ok ? "bg-jade-soft text-jade" : "bg-danger/15 text-danger"}`,
          }, row.ok === null ? "·" : row.ok ? "✓" : "×"),
          el("span", { class: row.ok === false ? "text-danger" : "text-ink-2" }, row.label)))
    );

    if (!samples) verdict.textContent = "";
    else {
      const failed = rows.filter((row) => row.ok === false).length;
      verdict.textContent = failed === 0 ? "This password passes the rule." : `This password fails ${failed} part${failed === 1 ? "" : "s"} of the rule.`;
      verdict.className = `m-0 text-sm font-semibold ${failed === 0 ? "text-jade" : "text-danger"}`;
    }
  }

  function listSentence(items) {
    if (items.length <= 1) return items.join("");
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  }

  for (const node of [minimum, maximum, noRepeat, symbolSet, sample]) node.addEventListener("input", build);
  for (const node of [lower, upper, digits, symbols, noSpaces]) node.input.addEventListener("change", build);

  const copyRule = copyButton(() => `${rule.textContent}\nRegex: ${pattern.textContent}`, "Copy policy");

  build();

  const shell = toolcard({
    body: bench(
      stack(
        el("div", { class: "grid grid-cols-2 gap-3" }, panel("Minimum", minimum), panel("Maximum", maximum)),
        el("div", { class: "grid gap-1.5" },
          el("span", { class: "text-sm font-semibold text-ink-2" }, "Character classes"),
          el("div", { class: "grid grid-cols-2 gap-2" }, lower, upper, digits, symbols),
          noSpaces),
        panel("Allowed symbols", symbolSet),
        panel("Max repeats in a row", noRepeat, "0 means no limit."),
        error
      ),
      stack(
        el("div", { class: "grid gap-2 rounded-r2 border border-orbit bg-deck-2 p-4" }, rule),
        panel("Regex", pattern),
        panel("Test a password", sample, "Shown in the page only. Nothing is sent."),
        checks,
        verdict
      )
    ),
    foot: actions(copyRule),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
