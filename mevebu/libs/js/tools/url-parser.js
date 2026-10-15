// Breaks a URL into its protocol, host, port, path, hash and query parameters.
import { el, bench, stack, panel, textInput, notice, copyButton, actions, toolcard } from "../core.js";

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const source = textInput({ value: "https://example.com:8443/blog/post?utm_source=news&page=2#top", "aria-label": "URL" });
  const error = notice("error");

  const protocol = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const host = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const port = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const path = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const hash = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el(
    "div",
    { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" },
    kvRow("Protocol", protocol),
    kvRow("Host", host),
    kvRow("Port", port),
    kvRow("Path", path),
    kvRow("Hash", hash)
  );
  const tableWrap = el("div", { class: "max-h-80 overflow-auto" });
  let paramsText = "";

  function clear() {
    for (const node of [protocol, host, port, path, hash]) node.textContent = "-";
    tableWrap.replaceChildren(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "No query parameters."));
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
      tableWrap.replaceChildren(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "No query parameters."));
      paramsText = "";
      return;
    }
    tableWrap.replaceChildren(el(
      "table",
      { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
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
    )});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
