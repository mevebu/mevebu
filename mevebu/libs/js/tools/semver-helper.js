// Bumps a semantic version by major, minor or patch, with an optional prerelease tag.
import { bench, stack, panel, textInput, chipRow, output, notice, copyButton, actions, toolcard } from "../core.js";

const BUMPS = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "patch", label: "Patch" }];

export function mount(slot) {
  const version = textInput({ value: "1.2.3", mono: true, "aria-label": "Current version" });
  const prerelease = textInput({ value: "", placeholder: "rc.1", "aria-label": "Prerelease tag" });
  const error = notice("error");
  const out = output({ rows: 1 });
  let bump = "patch";
  let text = "";

  const chips = chipRow(BUMPS, { value: bump, label: "Bump", onChange: (value) => { bump = value; run(); } });

  function run() {
    error.write("");
    const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version.value.trim());
    if (!match) {
      text = "";
      out.write("");
      error.write("Enter a version like 1.2.3.");
      return;
    }
    let [major, minor, patch] = match.slice(1).map(Number);
    if (bump === "major") { major += 1; minor = 0; patch = 0; }
    else if (bump === "minor") { minor += 1; patch = 0; }
    else patch += 1;
    const tag = prerelease.value.trim().replace(/^-/, "");
    text = `${major}.${minor}.${patch}${tag ? `-${tag}` : ""}`;
    out.write(text);
  }

  version.addEventListener("input", run);
  prerelease.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Current version", version), panel("Bump", chips), panel("Prerelease", prerelease), error),
      stack(panel("New version", out))
    ),
    foot: actions(copyButton(() => text, "Copy version", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
