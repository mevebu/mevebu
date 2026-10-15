// Builds the standard meta tags for a page: title, description, keywords,
// author and robots. The result is plain HTML for the head.
import { el, bench, stack, panel, textInput, textArea, selectInput, output, copyButton, actions, toolcard } from "../core.js";

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

export function mount(slot) {
  const title = textInput({ value: "mevebu", "aria-label": "Title" });
  const description = textArea({ rows: 3, value: "Small privacy first tools that run entirely in the browser.", "aria-label": "Description" });
  const keywords = textInput({ placeholder: "tools, privacy, browser", "aria-label": "Keywords" });
  const author = textInput({ "aria-label": "Author" });
  const robots = selectInput(
    ["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow"],
    { value: "index, follow", "aria-label": "Robots" }
  );
  const result = output({ rows: 8 });

  const titleCount = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const descCount = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" },
    el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, titleCount, el("span", { class: "text-2xs font-semibold text-ink-3" }, "Title chars")),
    el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, descCount, el("span", { class: "text-2xs font-semibold text-ink-3" }, "Description chars"))
  );

  function build() {
    const lines = [];
    const t = title.value.trim();
    const d = description.value.trim();
    if (t) lines.push(`<title>${esc(t)}</title>`);
    if (d) lines.push(`<meta name="description" content="${esc(d)}" />`);
    if (keywords.value.trim()) lines.push(`<meta name="keywords" content="${esc(keywords.value.trim())}" />`);
    if (author.value.trim()) lines.push(`<meta name="author" content="${esc(author.value.trim())}" />`);
    lines.push(`<meta name="robots" content="${esc(robots.value)}" />`);
    result.write(lines.join("\n"));
    titleCount.textContent = String(t.length);
    descCount.textContent = String(d.length);
  }

  for (const input of [title, description, keywords, author]) input.addEventListener("input", build);
  robots.addEventListener("change", build);

  const card = toolcard({
    body: bench(
      stack(
        panel("Title", title),
        panel("Description", description),
        panel("Keywords", keywords),
        panel("Author", author),
        panel("Robots", robots)
      ),
      stack(stats, panel("Meta tags", result))
    ),
    foot: actions(copyButton(() => result.textContent, "Copy tags", "fill"))});
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
