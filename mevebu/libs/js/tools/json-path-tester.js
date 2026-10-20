// Runs a documented JSONPath subset against a document. No library, no
// network: the parser and the evaluator live here.
import { el, bench, stack, panel, textArea, textInput, notice, copyButton, actions, toolcard } from "../core.js";

const EXAMPLE = '{\n  "items": [\n    { "name": "pen", "price": 2 },\n    { "name": "lamp", "price": 18 },\n    { "name": "desk", "price": 120 }\n  ],\n  "meta": { "currency": "USD" }\n}';

function tokenizePath(expr) {
  if (!expr.startsWith("$")) throw new Error("Start with $.");
  const steps = [];
  let i = 1;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === ".") {
      if (expr[i + 1] === ".") {
        let end = i + 2;
        while (end < expr.length && /[\w$-]/.test(expr[end])) end++;
        const name = expr.slice(i + 2, end);
        if (!name) throw new Error("Expected a name after ..");
        steps.push({ kind: "descend", name });
        i = end;
      } else {
        let end = i + 1;
        if (expr[end] === "*") {
          steps.push({ kind: "wildcard" });
          i = end + 1;
          continue;
        }
        while (end < expr.length && /[\w$-]/.test(expr[end])) end++;
        const name = expr.slice(i + 1, end);
        if (!name) throw new Error("Expected a name after .");
        steps.push({ kind: "child", name });
        i = end;
      }
      continue;
    }
    if (ch === "[") {
      let end = i + 1;
      let quote = null;
      while (end < expr.length) {
        const c = expr[end];
        if (quote) { if (c === quote) quote = null; }
        else if (c === "'" || c === '"') quote = c;
        else if (c === "]") break;
        end++;
      }
      if (end >= expr.length) throw new Error("Expected ].");
      const body = expr.slice(i + 1, end).trim();
      if (body === "*") steps.push({ kind: "wildcard" });
      else if (/^['"]/.test(body)) steps.push({ kind: "child", name: body.slice(1, -1) });
      else if (body.startsWith("?(") && body.endsWith(")")) steps.push({ kind: "filter", test: body.slice(2, -1).trim() });
      else if (/^-?\d+$/.test(body)) steps.push({ kind: "index", index: Number(body) });
      else if (/^-?\d*:-?\d*$/.test(body)) {
        const [from, to] = body.split(":");
        steps.push({ kind: "slice", from: from === "" ? null : Number(from), to: to === "" ? null : Number(to) });
      } else throw new Error(`Unknown selector [${body}].`);
      i = end + 1;
      continue;
    }
    throw new Error(`Unexpected ${ch}.`);
  }
  return steps;
}

function readField(value, path) {
  const parts = path.split(".").filter(Boolean);
  let current = value;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

function makeTest(source) {
  const match = source.match(/^@((?:\.[\w$-]+)+)\s*(?:(>=|<=|==|!=|>|<)\s*(.+))?$/);
  if (!match) throw new Error("Filter must look like @.price > 10.");
  const [, path, operator, raw] = match;
  let expected;
  if (operator) {
    const text = raw.trim();
    if (/^-?\d+(?:\.\d+)?$/.test(text)) expected = Number(text);
    else if (text === "true" || text === "false") expected = text === "true";
    else if (text === "null") expected = null;
    else expected = text.replace(/^['"]|['"]$/g, "");
  }
  return (value) => {
    const actual = readField(value, path.slice(1));
    if (!operator) return Boolean(actual);
    if (actual === undefined) return false;
    if (operator === "==") return actual === expected;
    if (operator === "!=") return actual !== expected;
    if (operator === ">") return actual > expected;
    if (operator === "<") return actual < expected;
    if (operator === ">=") return actual >= expected;
    return actual <= expected;
  };
}

function select(step, entries) {
  const output = [];
  for (const entry of entries) {
    const value = entry.value;
    const path = entry.path;
    if (step.kind === "child") {
      if (value !== null && typeof value === "object" && step.name in value) {
        output.push({ path: `${path}.${step.name}`, value: value[step.name] });
      }
    } else if (step.kind === "index") {
      if (Array.isArray(value)) {
        const index = step.index < 0 ? value.length + step.index : step.index;
        if (index >= 0 && index < value.length) output.push({ path: `${path}[${index}]`, value: value[index] });
      }
    } else if (step.kind === "slice") {
      if (Array.isArray(value)) {
        const from = step.from ?? 0;
        const to = step.to ?? value.length;
        const start = from < 0 ? Math.max(value.length + from, 0) : from;
        value.slice(from, to).forEach((item, offset) =>
          output.push({ path: `${path}[${start + offset}]`, value: item }));
      }
    } else if (step.kind === "wildcard") {
      if (Array.isArray(value)) value.forEach((item, index) => output.push({ path: `${path}[${index}]`, value: item }));
      else if (value !== null && typeof value === "object") {
        Object.entries(value).forEach(([key, item]) => output.push({ path: `${path}.${key}`, value: item }));
      }
    } else if (step.kind === "filter") {
      const test = makeTest(step.test);
      if (Array.isArray(value)) value.forEach((item, index) => {
        if (item !== null && typeof item === "object" && test(item)) output.push({ path: `${path}[${index}]`, value: item });
      });
    } else if (step.kind === "descend") {
      const visit = (node, at) => {
        if (node === null || typeof node !== "object") return;
        for (const [key, item] of Object.entries(node)) {
          const childPath = Array.isArray(node) ? `${at}[${key}]` : `${at}.${key}`;
          if (step.name === "*" || key === step.name) output.push({ path: childPath, value: item });
          visit(item, childPath);
        }
      };
      visit(value, path);
    }
  }
  return output;
}

const show = (value) => {
  const text = JSON.stringify(value) ?? String(value);
  return text.length > 90 ? `${text.slice(0, 87)}...` : text;
};

export function mount(slot) {
  const source = textArea({ rows: 13, "aria-label": "JSON", value: EXAMPLE });
  const expression = textInput({ value: "$.items[?(@.price > 10)].name", "aria-label": "JSONPath", class: "font-mono" });
  const error = notice("error");
  const list = el("div", { class: "grid gap-2" });
  const count = el("p", { class: "text-sm text-ink-3" });
  let results = [];

  function run() {
    error.write("");
    results = [];
    if (!source.value.trim() || !expression.value.trim()) {
      list.replaceChildren();
      count.textContent = "";
      return;
    }
    let document;
    try {
      document = JSON.parse(source.value);
    } catch (caught) {
      error.write(caught.message);
      list.replaceChildren();
      count.textContent = "";
      return;
    }
    try {
      let entries = [{ path: "$", value: document }];
      for (const step of tokenizePath(expression.value.trim())) entries = select(step, entries);
      results = entries;
    } catch (caught) {
      error.write(caught.message);
      list.replaceChildren();
      count.textContent = "";
      return;
    }
    count.textContent = `${results.length} ${results.length === 1 ? "match" : "matches"}`;
    if (!results.length) {
      list.replaceChildren(el("p", { class: "text-sm text-ink-2" }, "No match."));
      return;
    }
    list.replaceChildren(...results.map((row) =>
      el("div", { class: "grid gap-1 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
        el("code", { class: "wrap-anywhere text-sm font-semibold" }, row.path),
        el("p", { class: "wrap-anywhere font-mono text-xs text-ink-2" }, show(row.value)))));
  }

  source.addEventListener("input", run);
  expression.addEventListener("input", run);

  const report = () => results.map((row) => `${row.path}: ${JSON.stringify(row.value)}`).join("\n");

  const card = toolcard({
    body: bench(
      stack(panel("JSON", source), panel("JSONPath", expression), error),
      stack(panel("Matches", el("div", { class: "grid gap-2" }, count, list))),
    ),
    foot: actions(copyButton(report, "Copy matches", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
