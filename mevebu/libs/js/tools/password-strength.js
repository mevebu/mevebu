// Estimates password strength from length and patterns, all in this tab.
import { el, icon, passwordInput, button, bench, stack, panel, notice, copyButton, actions, toolcard } from "../core.js";

const COMMON = new Set([
  "password", "123456", "123456789", "qwerty", "letmein", "admin", "welcome",
  "iloveyou", "monkey", "dragon", "abc123", "111111", "000000", "passw0rd"]);

const GROUPS = [
  { test: (value) => /[a-z]/.test(value) },
  { test: (value) => /[A-Z]/.test(value) },
  { test: (value) => /[0-9]/.test(value) },
  { test: (value) => /[^A-Za-z0-9]/.test(value) }];

const LEVELS = [
  { name: "Very weak", key: "weak" },
  { name: "Weak", key: "weak" },
  { name: "Fair", key: "ok" },
  { name: "Good", key: "ok" },
  { name: "Strong", key: "strong" },
  { name: "Very strong", key: "strong" }];

function analyze(value) {
  const length = value.length;
  const groups = GROUPS.filter((group) => group.test(value)).length;
  let score = 0;
  if (length >= 8) score += 1;
  if (length >= 12) score += 1;
  if (length >= 16) score += 1;
  if (groups >= 3) score += 1;
  if (length >= 20 && groups === 4) score += 1;

  const hints = [];
  if (length < 12) hints.push("Use at least 12 characters.");
  if (groups < 3) hints.push("Mix upper case, lower case, digits and symbols.");
  if (/(.)\1{2}/.test(value)) {
    score -= 1;
    hints.push("Repeated characters are easy to guess.");
  }
  if (COMMON.has(value.toLowerCase())) {
    score = 0;
    hints.unshift("This is one of the most common passwords.");
  }
  return { score: Math.max(0, Math.min(5, score)), groups, length, hints };
}

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const field = passwordInput({ autocomplete: "off", "aria-label": "Password", placeholder: "Type a password" });
  const showButton = button("Show", { icon: "eye" });
  const meter = el("div", { class: "h-2 overflow-hidden rounded-full bg-deck-2", role: "img", "aria-label": "Strength" }, el("div", { class: "h-full w-0 rounded-full bg-orbit-hard transition-[width,background-color] duration-150 data-[level=weak]:bg-danger data-[level=ok]:bg-star data-[level=strong]:bg-jade" }));
  const label = el("p", { class: "border-s-[3px] border-transparent ps-2 text-md font-bold text-ink" });
  const lengthValue = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const groupsValue = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" }, kvRow("Length", lengthValue), kvRow("Character groups", groupsValue));
  const hints = el("div", { class: "grid content-start gap-4" });
  const status = notice("note");
  let report = "";

  showButton.addEventListener("click", () => {
    const visible = field.type === "text";
    field.type = visible ? "password" : "text";
    showButton.replaceChildren(icon(visible ? "eye" : "eye-off"), el("span", {}, visible ? "Show" : "Hide"));
  });

  function run() {
    const value = field.value;
    const fill = meter.firstElementChild;
    hints.replaceChildren();
    if (!value) {
      fill.style.width = "0%";
      delete fill.dataset.level;
      label.textContent = "";
      meter.setAttribute("aria-label", "Strength");
      lengthValue.textContent = "-";
      groupsValue.textContent = "-";
      status.write("");
      report = "";
      return;
    }
    const { score, groups, length, hints: why } = analyze(value);
    const level = LEVELS[score];
    fill.style.width = `${(score / 5) * 100}%`;
    fill.dataset.level = level.key;
    label.textContent = level.name;
    // The bar is colour only, so the reading it stands for also goes on the bar itself.
    meter.setAttribute("aria-label", `Strength: ${level.name}`);
    lengthValue.textContent = `${length} characters`;
    groupsValue.textContent = `${groups} of 4`;
    for (const text of why) {
      const node = notice("note");
      node.write(text);
      hints.append(node);
    }
    status.write("A score is not a guarantee. Length and randomness matter most.");
    report = [`Strength: ${level.name}`, `Length: ${length}`, `Character groups: ${groups} of 4`, ...why].join("\n");
  }

  field.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Password", el("div", { class: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2" }, field, showButton))),
      stack(meter, label, kv, hints, status)
    ),
    foot: actions(copyButton(() => report, "Copy report", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
