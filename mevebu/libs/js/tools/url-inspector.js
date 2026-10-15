// Breaks a link into its parts and flags look-alike hosts before you open it.
import { el, textInput, notice, copyButton, bench, stack, panel, actions, toolcard } from "../core.js";

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

const kvRow = (key, value) =>
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const source = textInput({ value: "https://example.com/login?next=/home", "aria-label": "URL" });
  const scheme = el("span", { class: "mvb-kv__v" }, "-");
  const host = el("span", { class: "mvb-kv__v" }, "-");
  const port = el("span", { class: "mvb-kv__v" }, "-");
  const path = el("span", { class: "mvb-kv__v" }, "-");
  const kv = el(
    "div",
    { class: "mvb-kv" },
    kvRow("Scheme", scheme),
    kvRow("Host", host),
    kvRow("Port", port),
    kvRow("Path", path)
  );
  const flags = el("div", { class: "mvb-stack" });
  const error = notice("error");
  let summary = "";

  function flag(kind, text) {
    const node = notice(kind);
    node.write(text);
    flags.append(node);
  }

  function clear() {
    for (const node of [scheme, host, port, path]) node.textContent = "-";
    flags.replaceChildren();
    summary = "";
  }

  function run() {
    error.write("");
    const raw = source.value.trim();
    if (!raw) return clear();
    let url;
    try {
      url = new URL(raw);
    } catch {
      clear();
      error.write("That is not a valid URL.");
      return;
    }

    scheme.textContent = url.protocol.replace(":", "");
    host.textContent = url.hostname;
    port.textContent = url.port || "default";
    path.textContent = url.pathname + url.search;
    summary = url.hostname;

    flags.replaceChildren();
    if (/[^\x00-\x7F]/.test(raw)) {
      flag("warn", "The address contains non-Latin characters. The host below is the punycode form your browser would use.");
    }
    if (url.hostname.startsWith("xn--") || url.hostname.includes(".xn--")) {
      flag("warn", "The host uses punycode (xn--). It can mix scripts to imitate a familiar name.");
    }
    if (url.username || url.password) {
      flag("warn", `The part before the @ is not the host. The real host is ${url.hostname}.`);
    }
    if (IPV4.test(url.hostname) || url.hostname.startsWith("[")) {
      flag("warn", "The link opens by IP address, not a domain name.");
    }
    if (url.protocol === "http:") {
      flag("warn", "This link uses http, not https. Traffic is not encrypted.");
    }
    if (!flags.childElementCount) {
      flag("good", "No look-alike characters or address tricks found.");
    }
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("URL", source),
        error,
        el("p", { class: "mvb-note" }, "The link is read in this tab. Nothing is opened or requested.")
      ),
      stack(kv, panel("Checks", flags))
    ),
    foot: actions(copyButton(() => summary, "Copy host", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
