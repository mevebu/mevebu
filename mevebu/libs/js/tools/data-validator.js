// Checks each value against a rule and lists the rows that fail.
import { el, bench, stack, panel, textArea, selectInput, textInput, notice, copyButton, actions, toolcard } from "../core.js";

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Values, one per line", placeholder: "One value per line" });
  const rule = selectInput([
    { value: "notempty", label: "Not empty" },
    { value: "email", label: "Email" },
    { value: "url", label: "URL" },
    { value: "number", label: "Number" },
    { value: "minlength", label: "Minimum length" },
    { value: "maxlength", label: "Maximum length" },
    { value: "regex", label: "Regex" },
  ], { value: "email", "aria-label": "Rule" });
  const setting = textInput({ "aria-label": "Rule setting", placeholder: "Number" });
  const settingField = panel("Setting", setting);

  const tableWrap = el("div", { class: "mvb-scroll" });
  const totalTile = tile("Total");
  const validTile = tile("Valid");
  const invalidTile = tile("Invalid");
  const stats = el("div", { class: "mvb-stats" }, totalTile, validTile, invalidTile);
  const error = notice("error");
  let failing = [];

  function needsSetting() {
    return ["minlength", "maxlength", "regex"].includes(rule.value);
  }

  function check(value) {
    switch (rule.value) {
      case "notempty":
        return value.trim() ? null : "Empty";
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Not an email";
      case "url":
        try { new URL(value); return null; } catch { return "Not a URL"; }
      case "number":
        return value.trim() !== "" && !Number.isNaN(Number(value)) ? null : "Not a number";
      case "minlength":
        return value.length >= Number(setting.value) ? null : `Shorter than ${setting.value}`;
      case "maxlength":
        return value.length <= Number(setting.value) ? null : `Longer than ${setting.value}`;
      case "regex":
        try { return new RegExp(setting.value).test(value) ? null : "No match"; } catch { return "Invalid pattern"; }
      default:
        return null;
    }
  }

  function run() {
    error.write("");
    settingField.hidden = !needsSetting();
    setting.placeholder = rule.value === "regex" ? "Pattern" : "Number";

    const raw = source.value.split(/\r?\n/);
    if (raw.length && raw[raw.length - 1] === "") raw.pop();
    const values = raw;

    const failures = [];
    values.forEach((value, i) => {
      const reason = check(value);
      if (reason) failures.push({ line: i + 1, value, reason });
    });
    failing = failures;

    if (!values.length) {
      tableWrap.replaceChildren(el("p", { class: "mvb-note" }, "Paste one value per line."));
    } else if (!failures.length) {
      tableWrap.replaceChildren(el("p", { class: "mvb-note" }, "Every value passes."));
    } else {
      tableWrap.replaceChildren(el("table", { class: "mvb-ttable" },
        el("thead", {}, el("tr", {}, el("th", {}, "#"), el("th", {}, "Value"), el("th", {}, "Reason"))),
        el("tbody", {}, ...failures.map((row) => el("tr", {},
          el("th", {}, String(row.line)),
          el("td", {}, row.value),
          el("td", {}, row.reason)
        )))
      ));
    }

    totalTile.set(String(values.length));
    validTile.set(String(values.length - failures.length));
    invalidTile.set(String(failures.length));
  }

  source.addEventListener("input", run);
  rule.addEventListener("change", run);
  setting.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Values", source), panel("Rule", rule), settingField, error),
      stack(stats, panel("Failed rows", tableWrap))
    ),
    foot: actions(copyButton(() => failing.map((row) => row.value).join("\n"), "Copy failing values", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
