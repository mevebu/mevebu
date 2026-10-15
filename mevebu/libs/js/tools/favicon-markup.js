// Builds the favicon and app icon link tags for a site, prefixed by its origin
// when one is given.
import { bench, stack, panel, textInput, output, notice, copyButton, actions, toolcard } from "../core.js";

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
  const site = textInput({ value: "https://example.com", "aria-label": "Site URL" });
  const result = output({ rows: 6 });
  const error = notice("error");

  function build() {
    error.write("");
    let prefix = "";
    const raw = site.value.trim();
    if (raw) {
      if (isUrl(raw)) prefix = new URL(raw).origin;
      else error.write("That is not a valid URL.");
    }
    result.write([
      `<link rel="icon" href="${esc(prefix)}/favicon.ico" sizes="any" />`,
      `<link rel="icon" type="image/svg+xml" href="${esc(prefix)}/favicon.svg" />`,
      `<link rel="apple-touch-icon" href="${esc(prefix)}/apple-touch-icon.png" />`,
      `<link rel="manifest" href="${esc(prefix)}/site.webmanifest" />`,
    ].join("\n"));
  }

  site.addEventListener("input", build);

  const card = toolcard({
    body: bench(
      stack(panel("Site URL", site), error),
      stack(panel("Favicon tags", result))
    ),
    foot: actions(copyButton(() => result.textContent, "Copy tags", "fill")),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
