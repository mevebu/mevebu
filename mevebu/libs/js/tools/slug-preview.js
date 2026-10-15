// Turns a title into a slug and shows the full address and the slug length.
import { el, bench, stack, panel, textInput, notice, copyButton, actions, toolcard } from "../core.js";

const isUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const title = textInput({ value: "Best running shoes", "aria-label": "Title" });
  const base = textInput({ value: "https://example.com", "aria-label": "Base URL" });
  const error = notice("error");

  const slugValue = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const urlValue = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const lengthValue = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el(
    "div",
    { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" },
    kvRow("Slug", slugValue),
    kvRow("URL", urlValue),
    kvRow("Length", lengthValue)
  );

  function run() {
    error.write("");
    const slug = slugify(title.value);
    slugValue.textContent = slug || "-";
    lengthValue.textContent = String(slug.length);

    const site = base.value.trim().replace(/\/+$/, "");
    if (!slug) {
      urlValue.textContent = "-";
      return;
    }
    if (!site) {
      urlValue.textContent = slug;
      return;
    }
    if (!isUrl(site)) {
      error.write("The base URL is not valid.");
      urlValue.textContent = "-";
      return;
    }
    urlValue.textContent = `${site}/${slug}`;
  }

  title.addEventListener("input", run);
  base.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Title", title), panel("Base URL", base), error),
      stack(panel("Preview", kv))
    ),
    foot: actions(
      copyButton(() => urlValue.textContent === "-" ? "" : urlValue.textContent, "Copy URL"),
      copyButton(() => slugValue.textContent === "-" ? "" : slugValue.textContent, "Copy slug", "fill")
    )});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
