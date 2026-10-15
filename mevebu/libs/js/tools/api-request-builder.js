// Builds an HTTP request and writes it out as a fetch snippet.
import { bench, stack, panel, textInput, textArea, selectInput, notice, output, copyButton, actions, toolcard } from "../core.js";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const BODYLESS = new Set(["GET", "HEAD"]);

function parseHeaders(text) {
  const headers = {};
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const at = line.indexOf(":");
    if (at === -1) continue;
    headers[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return headers;
}

function build(method, url, headers, body) {
  const lines = [];
  lines.push(`const response = await fetch(${JSON.stringify(url)}, {`);
  lines.push(`  method: ${JSON.stringify(method)},`);
  const keys = Object.keys(headers);
  if (keys.length) {
    lines.push("  headers: {");
    for (const key of keys) lines.push(`    ${JSON.stringify(key)}: ${JSON.stringify(headers[key])},`);
    lines.push("  },");
  }
  if (!BODYLESS.has(method) && body) lines.push(`  body: ${JSON.stringify(body)},`);
  lines.push("});");
  lines.push("");
  lines.push("const data = await response.json();");
  return lines.join("\n");
}

export function mount(slot) {
  const methodSelect = selectInput(METHODS, { value: "GET", "aria-label": "Method" });
  const urlInput = textInput({ value: "https://api.example.com/users", "aria-label": "URL", spellcheck: "false" });
  const headerInput = textArea({ rows: 5, "aria-label": "Headers", placeholder: "Content-Type: application/json", value: "Accept: application/json" });
  const bodyInput = textArea({ rows: 6, "aria-label": "Body", placeholder: '{"name":"Ada"}', value: '{\n  "name": "Ada"\n}' });
  const result = output({ rows: 14 });
  const hint = notice("note");

  function run() {
    const method = methodSelect.value;
    const bodyless = BODYLESS.has(method);
    bodyInput.disabled = bodyless;
    hint.write(bodyless ? `${method} requests carry no body.` : "");
    result.write(build(method, urlInput.value.trim() || "https://api.example.com/resource", parseHeaders(headerInput.value), bodyInput.value.trim()));
  }

  methodSelect.addEventListener("change", run);
  urlInput.addEventListener("input", run);
  headerInput.addEventListener("input", run);
  bodyInput.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Method", methodSelect),
        panel("URL", urlInput),
        panel("Headers", headerInput),
        panel("Body", bodyInput),
        hint
      ),
      stack(panel("fetch", result))
    ),
    foot: actions(copyButton(() => result.textContent, "Copy snippet", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
