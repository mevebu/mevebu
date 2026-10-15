// Shows how a title, address and description look as a search result, with
// length counts for the title and description.
import { el, bench, stack, panel, textInput, textArea, notice, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  const title = textInput({ value: "mevebu", "aria-label": "Title" });
  const url = textInput({ value: "https://example.com", "aria-label": "URL" });
  const description = textArea({ rows: 3, value: "Small privacy first tools that run entirely in the browser.", "aria-label": "Description" });

  const urlLine = el("span", { class: "mvb-note" }, "");
  const titleLine = el("span", { class: "mvb-stat__v" }, "");
  const descLine = el("p", { class: "mvb-note" }, "");
  const sample = el("div", { class: "mvb-preview__sample" },
    el("div", { class: "mvb-stack" }, urlLine, titleLine, descLine));

  const titleCount = el("span", { class: "mvb-stat__v" }, "0");
  const descCount = el("span", { class: "mvb-stat__v" }, "0");
  const stats = el("div", { class: "mvb-stats" },
    el("div", { class: "mvb-stat" }, titleCount, el("span", { class: "mvb-stat__k" }, "Title chars")),
    el("div", { class: "mvb-stat" }, descCount, el("span", { class: "mvb-stat__k" }, "Description chars"))
  );
  const note = notice("note");

  function run() {
    urlLine.textContent = url.value.trim() || "example.com";
    titleLine.textContent = title.value.trim() || "Page title";
    descLine.textContent = description.value.trim() || "Page description.";
    titleCount.textContent = String(title.value.trim().length);
    descCount.textContent = String(description.value.trim().length);
    note.write("Search engines trim long titles and descriptions, and previews vary.");
  }

  for (const input of [title, url, description]) input.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Title", title), panel("URL", url), panel("Description", description)),
      stack(sample, stats, note)
    ),
    foot: actions(
      copyButton(() => title.value.trim(), "Copy title"),
      copyButton(() => description.value.trim(), "Copy description", "fill")
    ),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
