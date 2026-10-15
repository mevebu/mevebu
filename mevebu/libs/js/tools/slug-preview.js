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
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const title = textInput({ value: "Best running shoes", "aria-label": "Title" });
  const base = textInput({ value: "https://example.com", "aria-label": "Base URL" });
  const error = notice("error");

  const slugValue = el("span", { class: "mvb-kv__v" }, "-");
  const urlValue = el("span", { class: "mvb-kv__v" }, "-");
  const lengthValue = el("span", { class: "mvb-kv__v" }, "-");
  const kv = el(
    "div",
    { class: "mvb-kv" },
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
    ),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
