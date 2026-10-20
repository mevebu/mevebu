// Converts an HTML fragment to JSX: class to className, for to htmlFor, inline
// styles to objects, and void tags self closed.
import { bench, stack, panel, textArea, output, notice, copyButton, actions, toolcard } from "../core.js";

const EXAMPLE = '<section class="card" style="padding: 12px; background-color: #fff">\n  <h2 for="title">Hello</h2>\n  <img src="logo.png" alt="">\n  <input type="text" disabled>\n</section>';

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const BOOLEAN = new Set(["allowfullscreen", "async", "autofocus", "autoplay", "checked", "controls", "default", "defer", "disabled", "hidden", "loop", "multiple", "muted", "novalidate", "open", "readonly", "required", "reversed", "selected"]);
const SPECIAL = {
  class: "className", for: "htmlFor", tabindex: "tabIndex", readonly: "readOnly",
  maxlength: "maxLength", minlength: "minLength", colspan: "colSpan", rowspan: "rowSpan",
  contenteditable: "contentEditable", autocomplete: "autoComplete", autofocus: "autoFocus",
  enctype: "encType", srcset: "srcSet", crossorigin: "crossOrigin", datetime: "dateTime",
  novalidate: "noValidate", spellcheck: "spellCheck", formaction: "formAction",
  allowfullscreen: "allowFullScreen", usemap: "useMap", frameborder: "frameBorder",
  accesskey: "accessKey", charset: "charSet", cellpadding: "cellPadding", cellspacing: "cellSpacing",
  hreflang: "hrefLang", referrerpolicy: "referrerPolicy",
  inputmode: "inputMode", enterkeyhint: "enterKeyHint", autoplay: "autoPlay",
};

const camel = (name) => {
  if (name.startsWith("data-") || name.startsWith("aria-")) return name;
  return SPECIAL[name] ?? name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

const escapeAttribute = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const escapeText = (value) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/[{}]/g, (brace) => (brace === "{" ? "{'{'}" : "{'}'}"));

function styleObject(text) {
  const parts = text.split(";").map((part) => part.trim()).filter(Boolean);
  const pairs = parts.map((part) => {
    const index = part.indexOf(":");
    if (index === -1) return null;
    const name = part.slice(0, index).trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = part.slice(index + 1).trim();
    return `${name}: ${JSON.stringify(value)}`;
  }).filter(Boolean);
  return `{ ${pairs.join(", ")} }`;
}

function attributes(node) {
  const output = [];
  for (const attribute of node.attributes) {
    const name = attribute.name;
    const lower = name.toLowerCase();
    if (BOOLEAN.has(lower) && (attribute.value === "" || attribute.value === lower)) {
      output.push(camel(lower));
      continue;
    }
    if (lower === "style") {
      output.push(`style={${styleObject(attribute.value)}}`);
      continue;
    }
    output.push(`${camel(name)}="${escapeAttribute(attribute.value)}"`);
  }
  return output;
}

function serializeChildren(node, depth) {
  const pad = "  ".repeat(depth);
  return Array.from(node.childNodes).map((child) => serializeNode(child, depth, pad)).filter(Boolean);
}

function serializeNode(node, depth, pad = "  ".repeat(depth)) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.replace(/\s+/g, " ").trim();
    return text ? `${pad}${escapeText(text)}` : "";
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return `${pad}{/* ${node.textContent.trim()} */}`;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const html = node.namespaceURI === "http://www.w3.org/1999/xhtml";
  const name = html ? node.tagName.toLowerCase() : node.tagName;
  const attrs = attributes(node);
  const open = `<${name}${attrs.length ? ` ${attrs.join(" ")}` : ""}`;

  if (VOID.has(name.toLowerCase())) return `${pad}${open} />`;

  const children = Array.from(node.childNodes);
  if (!children.length) return `${pad}${open} />`;

  const onlyText = children.every((child) => child.nodeType === Node.TEXT_NODE);
  if (onlyText) {
    const text = children.map((child) => child.textContent.replace(/\s+/g, " ").trim()).filter(Boolean).join(" ");
    return text ? `${pad}${open}>${escapeText(text)}</${name}>` : `${pad}${open} />`;
  }

  const body = serializeChildren(node, depth + 1);
  return `${pad}${open}>\n${body.join("\n")}\n${pad}</${name}>`;
}

function convert(source) {
  const document = new DOMParser().parseFromString(`<body>${source}</body>`, "text/html");
  const roots = Array.from(document.body.childNodes).filter((node) =>
    node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) || node.nodeType === Node.COMMENT_NODE);
  if (!roots.length) return { text: "" };
  if (roots.length === 1 && roots[0].nodeType === Node.ELEMENT_NODE) {
    return { text: serializeNode(roots[0], 0, "") };
  }
  const body = roots.map((node) => serializeNode(node, 1)).join("\n");
  return { text: `<>\n${body}\n</>` };
}

export function mount(slot) {
  const source = textArea({ rows: 14, "aria-label": "HTML", value: EXAMPLE });
  const result = output({ tag: "textarea", rows: 14 });
  const error = notice("error");

  function run() {
    error.write("");
    if (!source.value.trim()) {
      result.value = "";
      return;
    }
    try {
      result.value = convert(source.value).text;
    } catch (caught) {
      result.value = "";
      error.write(caught.message);
    }
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("HTML", source), error),
      stack(panel("JSX", result)),
    ),
    foot: actions(copyButton(() => result.value, "Copy JSX", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
