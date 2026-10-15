// Builds a query string from key=value lines and joins it to an optional base
// URL.
import { bench, stack, panel, textInput, textArea, checkbox, notice, output, copyButton, actions, toolcard } from "../core.js";

const isUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export function mount(slot) {
  const base = textInput({ value: "https://example.com/search", "aria-label": "Base URL" });
  const params = textArea({ rows: 8, class: "mvb-in mvb-in--area mvb-in--mono", value: "q=hello world\npage=2", placeholder: "q=hello world\npage=2", "aria-label": "Parameters" });
  const encode = checkbox("Encode values", { checked: true });
  const result = output({ rows: 4 });
  const error = notice("error");

  function build() {
    error.write("");
    const pairs = params.value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const at = line.indexOf("=");
        return at === -1 ? [line, ""] : [line.slice(0, at), line.slice(at + 1)];
      });

    let query;
    if (encode.input.checked) {
      const search = new URLSearchParams();
      for (const [key, value] of pairs) search.append(key, value);
      query = search.toString();
    } else {
      query = pairs.map(([key, value]) => (value === "" ? key : `${key}=${value}`)).join("&");
    }

    const site = base.value.trim();
    let out = query;
    if (site) {
      if (!isUrl(site)) {
        error.write("The base URL is not valid.");
      } else {
        const separator = site.includes("?") ? (site.endsWith("?") || site.endsWith("&") ? "" : "&") : "?";
        out = query ? `${site}${separator}${query}` : site;
      }
    }
    result.write(out);
  }

  base.addEventListener("input", build);
  params.addEventListener("input", build);
  encode.input.addEventListener("change", build);

  const card = toolcard({
    body: bench(
      stack(panel("Base URL", base), panel("Parameters", params), encode, error),
      stack(panel("URL", result))
    ),
    foot: actions(copyButton(() => result.textContent, "Copy URL", "fill")),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
