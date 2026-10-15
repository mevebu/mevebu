// Builds a sitemap.xml from a site address and one page path or URL per line.
import { bench, stack, panel, textInput, textArea, selectInput, numberInput, output, notice, copyButton, downloadButton, actions, toolcard } from "../core.js";

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

const isUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export function mount(slot) {
  const base = textInput({ value: "https://example.com", "aria-label": "Base URL" });
  const pages = textArea({ rows: 8, class: "mvb-in mvb-in--area mvb-in--mono", value: "/\n/about", placeholder: "/\n/about\n/blog", "aria-label": "Pages" });
  const freq = selectInput(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"], { value: "weekly", "aria-label": "Change frequency" });
  const priority = numberInput({ value: "0.8", min: "0", max: "1", step: "0.1", "aria-label": "Priority" });
  const result = output({ rows: 14 });
  const error = notice("error");

  function build() {
    error.write("");
    const site = base.value.trim().replace(/\/+$/, "");
    if (!site || !isUrl(site)) {
      error.write("Enter a valid site address, for example https://example.com.");
      result.write("");
      return;
    }
    const paths = pages.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!paths.length) {
      result.write("");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const entries = paths.map((path) => {
      const loc = /^https?:\/\//i.test(path) ? path : `${site}${path.startsWith("/") ? "" : "/"}${path}`;
      return [
        "  <url>",
        `    <loc>${esc(loc)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${esc(freq.value)}</changefreq>`,
        `    <priority>${esc(priority.value || "0.5")}</priority>`,
        "  </url>",
      ].join("\n");
    });
    result.write([
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      "</urlset>",
    ].join("\n"));
  }

  for (const input of [base, pages, priority]) input.addEventListener("input", build);
  freq.addEventListener("change", build);

  const card = toolcard({
    body: bench(
      stack(
        panel("Base URL", base),
        panel("Pages", pages),
        panel("Change frequency", freq),
        panel("Priority", priority),
        error
      ),
      stack(panel("sitemap.xml", result))
    ),
    foot: actions(
      downloadButton(() => result.textContent, "sitemap.xml", "Save XML", "application/xml"),
      copyButton(() => result.textContent, "Copy XML", "fill")
    ),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
