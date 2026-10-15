// Reference for the common HTTP status codes, filterable by class and text.
import { el, bench, stack, panel, textInput, chipRow, copyButton, actions, toolcard } from "../core.js";

const CODES = [
  [100, "Continue"], [101, "Switching Protocols"], [103, "Early Hints"],
  [200, "OK"], [201, "Created"], [202, "Accepted"], [203, "Non-Authoritative Information"], [204, "No Content"], [205, "Reset Content"], [206, "Partial Content"],
  [300, "Multiple Choices"], [301, "Moved Permanently"], [302, "Found"], [303, "See Other"], [304, "Not Modified"], [307, "Temporary Redirect"], [308, "Permanent Redirect"],
  [400, "Bad Request"], [401, "Unauthorized"], [402, "Payment Required"], [403, "Forbidden"], [404, "Not Found"], [405, "Method Not Allowed"], [406, "Not Acceptable"], [408, "Request Timeout"], [409, "Conflict"], [410, "Gone"], [411, "Length Required"], [412, "Precondition Failed"], [413, "Payload Too Large"], [414, "URI Too Long"], [415, "Unsupported Media Type"], [416, "Range Not Satisfiable"], [418, "I'm a teapot"], [422, "Unprocessable Entity"], [425, "Too Early"], [426, "Upgrade Required"], [428, "Precondition Required"], [429, "Too Many Requests"], [431, "Request Header Fields Too Large"], [451, "Unavailable For Legal Reasons"],
  [500, "Internal Server Error"], [501, "Not Implemented"], [502, "Bad Gateway"], [503, "Service Unavailable"], [504, "Gateway Timeout"], [505, "HTTP Version Not Supported"], [507, "Insufficient Storage"], [508, "Loop Detected"], [511, "Network Authentication Required"],
];

const statusClass = (code) => `${Math.floor(code / 100)}xx`;

export function mount(slot) {
  const filter = textInput({ type: "search", placeholder: "Code or reason", "aria-label": "Filter" });
  const scroll = el("div", { class: "mvb-scroll" });
  let group = "all";
  let visible = CODES;

  const chips = chipRow(
    [{ value: "all", label: "All" }, { value: "2xx", label: "2xx" }, { value: "3xx", label: "3xx" }, { value: "4xx", label: "4xx" }, { value: "5xx", label: "5xx" }],
    { value: "all", label: "Class", onChange: (value) => { group = value; run(); } }
  );

  function run() {
    const query = filter.value.trim().toLowerCase();
    visible = CODES.filter(([code, message]) => {
      if (group !== "all" && statusClass(code) !== group) return false;
      if (!query) return true;
      return String(code).includes(query) || message.toLowerCase().includes(query);
    });
    if (!visible.length) {
      scroll.replaceChildren(el("p", { class: "mvb-note" }, "No code matches."));
      return;
    }
    scroll.replaceChildren(el(
      "table",
      { class: "mvb-ttable" },
      el("thead", {}, el("tr", {}, el("th", {}, "Code"), el("th", {}, "Message"), el("th", {}, "Class"))),
      el("tbody", {}, ...visible.map(([code, message]) => el("tr", {},
        el("td", {}, String(code)),
        el("td", {}, message),
        el("td", {}, statusClass(code))
      )))
    ));
  }

  filter.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Filter", filter), panel("Class", chips)),
      stack(panel("Status codes", scroll))
    ),
    foot: actions(copyButton(() => visible.map(([code, message]) => `${code} ${message}`).join("\n"), "Copy list", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
