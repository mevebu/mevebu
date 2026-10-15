// Builds a common git command from a few fields and marks the destructive ones.
import { el, bench, stack, panel, textInput, selectInput, notice, output, copyButton, actions, toolcard } from "../core.js";

const quote = (value) => (/^[A-Za-z0-9._/@:~^+=-]+$/.test(value) ? value : JSON.stringify(value));

const OPERATIONS = {
  clone: {
    label: "Clone a repository",
    fields: [["url", "Repository URL", "https://github.com/user/repo.git"], ["directory", "Directory (optional)", ""]],
    build: (v) => `git clone ${quote(v.url)}${v.directory ? ` ${quote(v.directory)}` : ""}`},
  switch: {
    label: "Switch branch",
    fields: [["branch", "Branch", "main"]],
    build: (v) => `git switch ${quote(v.branch)}`},
  pull: {
    label: "Pull",
    fields: [["remote", "Remote", "origin"], ["branch", "Branch (optional)", ""]],
    build: (v) => `git pull ${quote(v.remote)}${v.branch ? ` ${quote(v.branch)}` : ""}`},
  commit: {
    label: "Commit",
    fields: [["message", "Message", "Fix the thing"], ["files", "Paths (optional)", ""]],
    build: (v) => `git commit -m ${quote(v.message)}${v.files ? ` ${v.files}` : ""}`},
  push: {
    label: "Push",
    fields: [["remote", "Remote", "origin"], ["branch", "Branch", "main"]],
    build: (v) => `git push ${quote(v.remote)} ${quote(v.branch)}`},
  "push-force": {
    label: "Force push",
    fields: [["remote", "Remote", "origin"], ["branch", "Branch", "main"]],
    build: (v) => `git push --force-with-lease ${quote(v.remote)} ${quote(v.branch)}`,
    destructive: "Force push can overwrite commits on the remote."},
  merge: {
    label: "Merge",
    fields: [["branch", "Branch", "feature"]],
    build: (v) => `git merge ${quote(v.branch)}`},
  rebase: {
    label: "Rebase",
    fields: [["branch", "Branch", "main"]],
    build: (v) => `git rebase ${quote(v.branch)}`},
  reset: {
    label: "Reset hard",
    fields: [["ref", "Commit or ref", "HEAD~1"]],
    build: (v) => `git reset --hard ${quote(v.ref)}`,
    destructive: "Reset hard discards uncommitted work."}};

export function mount(slot) {
  const options = Object.entries(OPERATIONS).map(([value, config]) => ({ value, label: config.label }));
  const operationSelect = selectInput(options, { value: "clone", "aria-label": "Operation" });
  const fieldsHost = el("div", { class: "grid content-start gap-4" });
  const result = output({ rows: 4 });
  const warn = notice("warn");
  const values = {};
  let inputs = [];

  function paintFields() {
    const config = OPERATIONS[operationSelect.value];
    fieldsHost.replaceChildren();
    inputs = [];
    for (const [key, label, placeholder] of config.fields) {
      if (!(key in values)) values[key] = "";
      const input = textInput({ value: values[key], placeholder, "aria-label": label, spellcheck: "false" });
      input.addEventListener("input", () => { values[key] = input.value; run(); });
      inputs.push(input);
      fieldsHost.append(panel(label, input));
    }
    run();
  }

  function run() {
    const config = OPERATIONS[operationSelect.value];
    warn.write(config.destructive ?? "");
    result.write(config.build(values));
  }

  operationSelect.addEventListener("change", paintFields);

  const card = toolcard({
    body: bench(
      stack(panel("Operation", operationSelect), fieldsHost, warn),
      stack(panel("Command", result))
    ),
    foot: actions(copyButton(() => result.textContent, "Copy command", "fill"))});
  slot.append(card.node);
  paintFields();

  return {};
}

export default { mount };
