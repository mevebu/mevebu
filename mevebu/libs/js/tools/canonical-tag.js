// Builds a canonical link tag and shows the normalized address the tag points
// to.
import { el, bench, stack, panel, textInput, output, notice, copyButton, actions, toolcard } from "../core.js";

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const source = textInput({ value: "https://example.com/blog/post/?utm_source=news#comments", "aria-label": "Page URL" });
  const result = output({ rows: 2 });
  const error = notice("error");
  const normalized = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const length = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" }, kvRow("Canonical URL", normalized), kvRow("Length", length));
  let canonical = "";

  function clear() {
    canonical = "";
    result.write("");
    normalized.textContent = "-";
    length.textContent = "-";
  }

  function run() {
    error.write("");
    const raw = source.value.trim();
    if (!raw) return clear();
    let url;
    try {
      url = new URL(raw);
    } catch {
      error.write("That is not a valid URL.");
      return clear();
    }
    url.hash = "";
    canonical = url.href;
    result.write(`<link rel="canonical" href="${esc(canonical)}" />`);
    normalized.textContent = canonical;
    length.textContent = String(canonical.length);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Page URL", source), error),
      stack(panel("Canonical tag", result), kv)
    ),
    foot: actions(
      copyButton(() => canonical, "Copy URL"),
      copyButton(() => result.textContent, "Copy tag", "fill")
    )});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
