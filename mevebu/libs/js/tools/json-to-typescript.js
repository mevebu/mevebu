// Generates TypeScript interfaces from a JSON sample, nested objects included.
import { bench, stack, panel, textArea, textInput, notice, output, copyButton, debounce, actions, toolcard } from "../core.js";

const pascal = (text) => {
  const words = String(text).replace(/[^a-zA-Z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("") || "Value";
};

const singular = (name) => {
  if (/ies$/.test(name)) return name.slice(0, -3) + "y";
  if (/ss$/.test(name)) return name;
  if (/s$/.test(name)) return name.slice(0, -1);
  return `${name}Item`;
};

function generate(data, rootName) {
  const interfaces = [];
  const used = new Set();

  const unique = (base) => {
    let name = base;
    let index = 2;
    while (used.has(name)) name = `${base}${index++}`;
    used.add(name);
    return name;
  };

  const walk = (value, name) => {
    if (value === null) return "null";
    if (Array.isArray(value)) {
      if (!value.length) return "unknown[]";
      const types = [...new Set(value.map((item) => walk(item, singular(name))))];
      return types.length === 1 ? `${types[0]}[]` : `Array<${types.join(" | ")}>`;
    }
    if (typeof value === "object") {
      const typeName = unique(name);
      const lines = Object.entries(value).map(([key, item]) => {
        const optional = item === null ? "?" : "";
        const property = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
        return `  ${property}${optional}: ${walk(item, pascal(key))};`;
      });
      interfaces.push(`export interface ${typeName} {\n${lines.join("\n")}\n}`);
      return typeName;
    }
    return typeof value;
  };

  const rootIsObject = data !== null && typeof data === "object" && !Array.isArray(data);
  const root = walk(data, rootName);
  if (rootIsObject) return interfaces.join("\n\n");
  if (!interfaces.length) return `export type ${rootName} = ${root};`;
  return `${interfaces.join("\n\n")}\n\nexport type ${rootName} = ${root};`;
}

export function mount(slot) {
  const source = textArea({
    rows: 12,
    "aria-label": "JSON",
    value: '{\n  "id": 1,\n  "name": "Ada",\n  "tags": ["dev"],\n  "address": { "city": "London" }\n}'});
  const nameInput = textInput({ value: "Root", "aria-label": "Root type name" });
  const result = output({ rows: 16 });
  const error = notice("error");

  function run() {
    error.write("");
    if (!source.value.trim()) {
      result.write("");
      return;
    }
    const rootName = pascal(nameInput.value) || "Root";
    let data;
    try {
      data = JSON.parse(source.value);
    } catch (caught) {
      result.write("");
      error.write(caught.message);
      return;
    }
    result.write(generate(data, rootName));
  }

  const live = debounce(run, 200);
  source.addEventListener("input", live);
  nameInput.addEventListener("input", live);

  const card = toolcard({
    body: bench(
      stack(panel("Root type name", nameInput), panel("JSON", source), error),
      stack(panel("TypeScript", result))
    ),
    foot: actions(copyButton(() => result.textContent, "Copy types", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
