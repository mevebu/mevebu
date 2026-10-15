// Builds a robots.txt from a user agent and the allow and disallow paths, one
// per line.
import { bench, stack, panel, textInput, textArea, output, notice, copyButton, actions, toolcard } from "../core.js";

const isUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export function mount(slot) {
  const agent = textInput({ value: "*", "aria-label": "User agent" });
  const disallow = textArea({ rows: 5, class: "mvb-in mvb-in--area mvb-in--mono", placeholder: "/admin\n/private", "aria-label": "Disallow paths" });
  const allow = textArea({ rows: 3, class: "mvb-in mvb-in--area mvb-in--mono", placeholder: "/public", "aria-label": "Allow paths" });
  const sitemap = textInput({ value: "https://example.com/sitemap.xml", "aria-label": "Sitemap URL" });
  const result = output({ rows: 8 });
  const error = notice("error");

  const list = (area) => area.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  function build() {
    error.write("");
    const lines = [`User-agent: ${agent.value.trim() || "*"}`];
    const blocked = list(disallow);
    if (blocked.length) for (const path of blocked) lines.push(`Disallow: ${path}`);
    else lines.push("Disallow:");
    for (const path of list(allow)) lines.push(`Allow: ${path}`);
    const site = sitemap.value.trim();
    if (site) {
      if (isUrl(site)) lines.push(`Sitemap: ${site}`);
      else error.write("The sitemap address is not a valid URL.");
    }
    result.write(lines.join("\n"));
  }

  for (const input of [agent, disallow, allow, sitemap]) input.addEventListener("input", build);

  const card = toolcard({
    body: bench(
      stack(
        panel("User-agent", agent),
        panel("Disallow", disallow),
        panel("Allow", allow),
        panel("Sitemap", sitemap),
        error
      ),
      stack(panel("robots.txt", result))
    ),
    foot: actions(copyButton(() => result.textContent, "Copy robots.txt", "fill")),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
