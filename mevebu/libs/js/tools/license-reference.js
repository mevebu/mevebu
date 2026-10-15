// Short summaries of common open source licenses. Not legal advice.
import { el, bench, stack, panel, chipRow, notice, copyButton, actions, toolcard } from "../core.js";

const LICENSES = [
  { value: "MIT", label: "MIT", can: "Use, modify and distribute, including commercially.", must: "Include the copyright notice and the license text.", cannot: "Hold the author liable." },
  { value: "Apache-2.0", label: "Apache-2.0", can: "Use, modify and distribute, including commercially.", must: "Include the license, state changes and keep the NOTICE file.", cannot: "Use the project trademarks without permission." },
  { value: "GPL-3.0", label: "GPL-3.0", can: "Use, modify and distribute.", must: "Release derivative works under the same license and share the source.", cannot: "Add restrictions beyond the license." },
  { value: "BSD-3-Clause", label: "BSD-3-Clause", can: "Use, modify and distribute, including commercially.", must: "Keep the copyright notice and disclaimer.", cannot: "Use contributor names to endorse derivatives." },
  { value: "MPL-2.0", label: "MPL-2.0", can: "Use, modify and distribute.", must: "Share changes to MPL-licensed files under MPL.", cannot: "Hold contributors liable." },
  { value: "Unlicense", label: "Unlicense", can: "Use, modify and distribute with no conditions.", must: "Nothing.", cannot: "Hold the author liable." }];

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const name = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, LICENSES[0].label);
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, el("span", { class: "text-2xs font-semibold text-ink-3" }, "License"), name));
  const can = el("span", { class: "wrap-anywhere font-mono text-2xs" });
  const must = el("span", { class: "wrap-anywhere font-mono text-2xs" });
  const cannot = el("span", { class: "wrap-anywhere font-mono text-2xs" });
  const kv = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" }, kvRow("Can", can), kvRow("Must", must), kvRow("Cannot", cannot));
  const disclaimer = notice("note");
  disclaimer.write("Short summary, not legal advice.");
  let current = LICENSES[0];
  let text = "";

  const chips = chipRow(LICENSES.map(({ value, label }) => ({ value, label })), {
    value: current.value,
    label: "License",
    onChange: (value) => {
      current = LICENSES.find((entry) => entry.value === value);
      run();
    }});

  function run() {
    name.textContent = current.label;
    can.textContent = current.can;
    must.textContent = current.must;
    cannot.textContent = current.cannot;
    text = `${current.label}\nCan: ${current.can}\nMust: ${current.must}\nCannot: ${current.cannot}`;
  }

  const card = toolcard({
    body: bench(
      stack(panel("License", chips), disclaimer),
      stack(panel("Summary", stats), panel("Terms", kv))
    ),
    foot: actions(copyButton(() => text, "Copy summary", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
