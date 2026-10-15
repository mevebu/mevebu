// Builds Open Graph and Twitter card tags from a page title, description,
// address, image and type.
import { bench, stack, panel, textInput, textArea, selectInput, output, notice, copyButton, actions, toolcard } from "../core.js";

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

export function mount(slot) {
  const title = textInput({ value: "mevebu", "aria-label": "Title" });
  const description = textArea({ rows: 3, value: "Small privacy first tools that run entirely in the browser.", "aria-label": "Description" });
  const url = textInput({ value: "https://example.com", "aria-label": "URL" });
  const image = textInput({ value: "https://example.com/card.png", "aria-label": "Image URL" });
  const site = textInput({ value: "mevebu", "aria-label": "Site name" });
  const type = selectInput(["website", "article", "product", "profile"], { value: "website", "aria-label": "Type" });
  const result = output({ rows: 12 });
  const note = notice("note");

  function build() {
    const lines = [];
    const t = title.value.trim();
    const d = description.value.trim();
    const u = url.value.trim();
    const img = image.value.trim();
    const s = site.value.trim();
    if (t) lines.push(`<meta property="og:title" content="${esc(t)}" />`);
    if (d) lines.push(`<meta property="og:description" content="${esc(d)}" />`);
    lines.push(`<meta property="og:type" content="${esc(type.value)}" />`);
    if (u) lines.push(`<meta property="og:url" content="${esc(u)}" />`);
    if (img) lines.push(`<meta property="og:image" content="${esc(img)}" />`);
    if (s) lines.push(`<meta property="og:site_name" content="${esc(s)}" />`);
    lines.push(`<meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}" />`);
    if (t) lines.push(`<meta name="twitter:title" content="${esc(t)}" />`);
    if (d) lines.push(`<meta name="twitter:description" content="${esc(d)}" />`);
    if (img) lines.push(`<meta name="twitter:image" content="${esc(img)}" />`);
    result.write(lines.join("\n"));
    note.write("Platforms read different tags, so previews vary.");
  }

  for (const input of [title, description, url, image, site]) input.addEventListener("input", build);
  type.addEventListener("change", build);

  const card = toolcard({
    body: bench(
      stack(
        panel("Title", title),
        panel("Description", description),
        panel("URL", url),
        panel("Image URL", image),
        panel("Site name", site),
        panel("Type", type)
      ),
      stack(panel("Open Graph tags", result), note)
    ),
    foot: actions(copyButton(() => result.textContent, "Copy tags", "fill")),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
