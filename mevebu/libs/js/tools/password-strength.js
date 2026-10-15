// Estimates password strength from length and patterns, all in this tab.
import { el, icon, passwordInput, button, bench, stack, panel, notice, copyButton, actions, toolcard } from "../core.js";

const COMMON = new Set([
  "password", "123456", "123456789", "qwerty", "letmein", "admin", "welcome",
  "iloveyou", "monkey", "dragon", "abc123", "111111", "000000", "passw0rd",
]);

const GROUPS = [
  { test: (value) => /[a-z]/.test(value) },
  { test: (value) => /[A-Z]/.test(value) },
  { test: (value) => /[0-9]/.test(value) },
  { test: (value) => /[^A-Za-z0-9]/.test(value) },
];

const LEVELS = [
  { name: "Very weak", cls: "mvb-weak" },
  { name: "Weak", cls: "mvb-weak" },
  { name: "Fair", cls: "mvb-ok" },
  { name: "Good", cls: "mvb-ok" },
  { name: "Strong", cls: "mvb-strong" },
  { name: "Very strong", cls: "mvb-strong" },
];

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
  if (/(.)\1{2,}/.test(value)) {
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
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const field = passwordInput({ autocomplete: "off", "aria-label": "Password", placeholder: "Type a password" });
  const showButton = button("Show", { icon: "eye" });
  const meter = el("div", { class: "mvb-meter", role: "img", "aria-label": "Strength" }, el("div", { class: "mvb-meter__fill" }));
  const label = el("p", { class: "mvb-note text-[1.0625rem] font-bold text-ink" });
  const lengthValue = el("span", { class: "mvb-kv__v" }, "-");
  const groupsValue = el("span", { class: "mvb-kv__v" }, "-");
  const kv = el("div", { class: "mvb-kv" }, kvRow("Length", lengthValue), kvRow("Character groups", groupsValue));
  const hints = el("div", { class: "mvb-stack" });
  const status = notice("note");
  let report = "";

  showButton.addEventListener("click", () => {
    const visible = field.type === "text";
    field.type = visible ? "password" : "text";
    showButton.replaceChildren(icon(visible ? "eye" : "eye-off"), el("span", {}, visible ? "Show" : "Hide"));
  });

  function run() {
    const value = field.value;
    const fill = meter.querySelector(".mvb-meter__fill");
    hints.replaceChildren();
    if (!value) {
      fill.style.width = "0%";
      fill.className = "mvb-meter__fill";
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
    fill.className = `mvb-meter__fill ${level.cls}`;
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
      stack(panel("Password", el("div", { class: "mvb-secret" }, field, showButton))),
      stack(meter, label, kv, hints, status)
    ),
    foot: actions(copyButton(() => report, "Copy report", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
