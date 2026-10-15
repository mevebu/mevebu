// Shows how a title, address and description look as a search result, with
// length counts for the title and description.
import { el, bench, stack, panel, textInput, textArea, notice, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  const title = textInput({ value: "mevebu", "aria-label": "Title" });
  const url = textInput({ value: "https://example.com", "aria-label": "URL" });
  const description = textArea({ rows: 3, value: "Small privacy first tools that run entirely in the browser.", "aria-label": "Description" });

  const urlLine = el("span", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "");
  const titleLine = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "");
  const descLine = el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "");
  const sample = el("div", { class: "w-full rounded-lg border border-orbit bg-deck px-[18px] py-4" },
    el("div", { class: "grid content-start gap-4" }, urlLine, titleLine, descLine));

  const titleCount = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const descCount = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" },
    el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, titleCount, el("span", { class: "text-2xs font-semibold text-ink-3" }, "Title chars")),
    el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, descCount, el("span", { class: "text-2xs font-semibold text-ink-3" }, "Description chars"))
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
    )});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
