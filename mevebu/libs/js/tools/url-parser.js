// Breaks a URL into its protocol, host, port, path, hash and query parameters.
import { el, bench, stack, panel, textInput, notice, copyButton, actions, toolcard } from "../core.js";

const kvRow = (key, value) =>
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const source = textInput({ value: "https://example.com:8443/blog/post?utm_source=news&page=2#top", "aria-label": "URL" });
  const error = notice("error");

  const protocol = el("span", { class: "mvb-kv__v" }, "-");
  const host = el("span", { class: "mvb-kv__v" }, "-");
  const port = el("span", { class: "mvb-kv__v" }, "-");
  const path = el("span", { class: "mvb-kv__v" }, "-");
  const hash = el("span", { class: "mvb-kv__v" }, "-");
  const kv = el(
    "div",
    { class: "mvb-kv" },
    kvRow("Protocol", protocol),
    kvRow("Host", host),
    kvRow("Port", port),
    kvRow("Path", path),
    kvRow("Hash", hash)
  );
  const tableWrap = el("div", { class: "mvb-scroll" });
  let paramsText = "";

  function clear() {
    for (const node of [protocol, host, port, path, hash]) node.textContent = "-";
    tableWrap.replaceChildren(el("p", { class: "mvb-note" }, "No query parameters."));
    paramsText = "";
  }

  function run() {
    error.write("");
    const raw = source.value.trim();
    if (!raw) return clear();
    let url;
    try {
      url = new URL(raw);
    } catch {
      error.write("That is not a valid URL.");
      return clear();
    }
    protocol.textContent = url.protocol.replace(":", "");
    host.textContent = url.hostname;
    port.textContent = url.port || "default";
    path.textContent = url.pathname;
    hash.textContent = url.hash || "-";
    const params = [...url.searchParams];
    if (!params.length) {
      tableWrap.replaceChildren(el("p", { class: "mvb-note" }, "No query parameters."));
      paramsText = "";
      return;
    }
    tableWrap.replaceChildren(el(
      "table",
      { class: "mvb-ttable" },
      el("thead", {}, el("tr", {}, el("th", {}, "Key"), el("th", {}, "Value"))),
      el("tbody", {}, ...params.map(([key, value]) => el("tr", {}, el("td", {}, key), el("td", {}, value))))
    ));
    paramsText = JSON.stringify(Object.fromEntries(params), null, 2);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("URL", source), error),
      stack(kv, panel("Query parameters", tableWrap))
    ),
    foot: actions(
      copyButton(() => source.value.trim(), "Copy URL"),
      copyButton(() => paramsText, "Copy params", "fill")
    ),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
