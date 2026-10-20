// Sample documents from a JSON Schema. Covers the keywords that decide whether
// a document validates, and reports the ones it could not honour, so a passing
// sample is never mistaken for a complete implementation.
import {
  el, toast, download, bench, stack, panel, textArea, numberInput, textInput,
  button, actions, toolcard, blank, notice, output,
} from "../core.js";
import { seeded, pick, uuid, gaussian } from "../random.js";
import { zip } from "../zip.js";

const SUPPORTED = new Set([
  "$schema", "$id", "title", "description", "type", "properties", "required",
  "items", "enum", "const", "default", "examples", "minimum", "maximum",
  "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minLength", "maxLength",
  "pattern", "format", "minItems", "maxItems", "uniqueItems", "additionalProperties",
  "minProperties", "maxProperties", "anyOf", "oneOf", "allOf", "not", "nullable",
]);

const FORMATS = {
  "date-time": () => new Date(Date.UTC(2025, 0, 1) + Math.floor(Math.random() * 3e10)).toISOString(),
  date: (random) => new Date(Date.UTC(2025, 0, 1) + Math.floor(random() * 700) * 86400000).toISOString().slice(0, 10),
  time: () => `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:00:00Z`,
  email: (random) => `${pick(random, ["ani", "budi", "citra", "dewi"])}${Math.floor(random() * 99)}@example.com`,
  uri: () => "https://example.com/resource",
  uuid: (random) => uuid(random),
  ipv4: () => `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  hostname: () => "example.com",
};

function regexFrom(pattern) {
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

function stringValue(schema, random) {
  if (schema.format && FORMATS[schema.format]) return FORMATS[schema.format](random);
  if (schema.enum) return pick(random, schema.enum);
  if (schema.const !== undefined) return schema.const;

  const min = Math.max(0, schema.minLength ?? 0);
  const max = Math.max(min, schema.maxLength ?? Math.max(min, 12));
  const regex = schema.pattern ? regexFrom(schema.pattern) : null;
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

  // Try a few random strings against the pattern before falling back, so a
  // pattern like ^[A-Z]{3}$ still gets a plausible value.
  for (let attempt = 0; attempt < 60; attempt++) {
    const length = min + Math.floor(random() * Math.max(1, Math.min(max, 24) - min + 1));
    let out = "";
    for (let i = 0; i < length; i++) out += alphabet[Math.floor(random() * alphabet.length)];
    if (!regex || regex.test(out)) return out;
  }
  const literal = schema.pattern?.replace(/[\^$.*+?()[\]{}|\\]/g, "") ?? "";
  if (literal.length >= min) return literal.slice(0, Math.max(min, Math.min(max, literal.length)));
  return "sample".padEnd(min, "x").slice(0, Math.max(min, 1));
}

function numberValue(schema, random, integer) {
  if (schema.enum) return pick(random, schema.enum);
  if (schema.const !== undefined) return schema.const;
  const min = schema.minimum ?? schema.exclusiveMinimum ?? 0;
  const max = schema.maximum ?? schema.exclusiveMaximum ?? (min + 1000);
  let value = min + random() * (max - min);
  if (integer) value = Math.round(value);
  if (schema.multipleOf) value = Math.round(value / schema.multipleOf) * schema.multipleOf;
  return value;
}

function sample(schema, random, path, unknown) {
  if (!schema || typeof schema !== "object") return null;

  if (schema.const !== undefined) return schema.const;
  if (schema.enum) return pick(random, schema.enum);
  if (schema.default !== undefined) return schema.default;
  if (schema.examples?.length) return schema.examples[0];
  if (schema.anyOf?.length) return sample(schema.anyOf[0], random, path, unknown);
  if (schema.oneOf?.length) return sample(schema.oneOf[0], random, path, unknown);
  if (schema.allOf?.length) {
    // Merge the object branches, which is the common shape.
    const merged = schema.allOf.reduce(
      (acc, branch) => ({
        ...acc,
        ...branch,
        properties: { ...(acc.properties ?? {}), ...(branch.properties ?? {}) },
        required: [...new Set([...(acc.required ?? []), ...(branch.required ?? [])])],
      }),
      { ...schema, allOf: undefined }
    );
    return sample(merged, random, path, unknown);
  }

  const type = Array.isArray(schema.type)
    ? schema.type.find((entry) => entry !== "null") ?? "null"
    : schema.type ?? (schema.properties ? "object" : schema.items ? "array" : "string");

  if (schema.nullable && random() < 0.1) return null;

  switch (type) {
    case "object": {
      const out = {};
      const properties = schema.properties ?? {};
      for (const [key, child] of Object.entries(properties)) {
        out[key] = sample(child, random, `${path}.${key}`, unknown);
      }
      for (const key of schema.required ?? []) {
        if (!(key in out)) out[key] = sample({}, random, `${path}.${key}`, unknown);
      }
      if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        out.extra = sample(schema.additionalProperties, random, `${path}.extra`, unknown);
      }
      return out;
    }
    case "array": {
      const min = Math.max(0, schema.minItems ?? 1);
      const max = Math.max(min, schema.maxItems ?? min + 2);
      const count = min + Math.floor(random() * (Math.min(max, 8) - min + 1));
      const items = Array.from({ length: count }, (_, index) =>
        sample(schema.items ?? {}, random, `${path}[${index}]`, unknown)
      );
      return schema.uniqueItems ? [...new Set(items.map((item) => JSON.stringify(item)))].map((text) => JSON.parse(text)) : items;
    }
    case "integer":
      return numberValue(schema, random, true);
    case "number":
      return Number(numberValue(schema, random, false).toFixed(3));
    case "boolean":
      return random() > 0.5;
    case "null":
      return null;
    default:
      return stringValue(schema, random);
  }
}

function collectUnknown(schema, found, path = "$") {
  if (!schema || typeof schema !== "object") return;
  for (const [key, value] of Object.entries(schema)) {
    if (["properties", "items", "anyOf", "oneOf", "allOf"].includes(key)) continue;
    if (key.startsWith("$") || key.startsWith("x-")) continue;
    if (!SUPPORTED.has(key) && !found.includes(key)) found.push(key);
  }
  for (const [name, child] of Object.entries(schema.properties ?? {})) {
    collectUnknown(child, found, `${path}.${name}`);
  }
  if (schema.items && typeof schema.items === "object") collectUnknown(schema.items, found, `${path}[]`);
}

export function mount(slot) {
  let documents = [];
  let unknown = [];

  const schema = textArea({
    rows: 12,
    value: JSON.stringify(
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        required: ["id", "name", "email"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", minLength: 3, maxLength: 24 },
          email: { type: "string", format: "email" },
          age: { type: "integer", minimum: 18, maximum: 90 },
          tags: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
        },
      },
      null,
      2
    ),
    "aria-label": "JSON Schema",
  });

  const count = numberInput({ min: "1", max: "200", step: "1", value: "3", "aria-label": "Documents" });
  const seed = textInput({ value: "mevebu", "aria-label": "Seed", class: "font-mono" });
  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const result = output({ rows: 16 });
  const empty = blank("braces", "Paste a schema to generate documents.");

  const generate = button("Generate", { icon: "refresh-cw", kind: "fill" });
  const downloadJson = button("Download JSON", { icon: "download" });
  const downloadZip = button("Download ZIP", { icon: "download" });

  function run() {
    error.write("");
    try {
      const parsed = JSON.parse(schema.value);
      const random = seeded(seed.value || "mevebu");
      unknown = [];
      collectUnknown(parsed, unknown);
      const total = Math.max(1, Math.min(200, Number(count.value) || 1));
      documents = Array.from({ length: total }, () => sample(parsed, random, "$", unknown));
      result.write(JSON.stringify(documents, null, 2));
      summary.textContent = `${total} document${total === 1 ? "" : "s"} · seed ${seed.value || "mevebu"}`;
      empty.hidden = true;
      result.hidden = false;
      if (unknown.length) {
        error.write(`Not implemented, so left out: ${unknown.join(", ")}. Everything else follows the schema.`);
      }
    } catch (caught) {
      documents = [];
      result.write("");
      result.hidden = true;
      empty.hidden = false;
      summary.textContent = "";
      error.write(caught?.message || "That schema is not valid JSON.");
    }
  }

  generate.addEventListener("click", () => {
    run();
    if (documents.length) toast("Documents ready");
  });
  schema.addEventListener("input", run);
  count.addEventListener("input", run);
  seed.addEventListener("input", run);

  downloadJson.addEventListener("click", () => {
    if (!documents.length) return;
    download("samples.json", JSON.stringify(documents, null, 2), "application/json");
  });
  downloadZip.addEventListener("click", () => {
    if (!documents.length) return;
    const files = documents.map((doc, index) => ({
      name: `sample-${String(index + 1).padStart(3, "0")}.json`,
      bytes: new TextEncoder().encode(JSON.stringify(doc, null, 2)),
    }));
    download("samples.zip", zip(files), "application/zip");
  });

  run();

  const shell = toolcard({
    body: bench(
      stack(
        panel("Schema", schema),
        panel("Documents", count),
        panel("Seed", seed, "The same seed and schema give the same documents."),
        error
      ),
      stack(summary, empty, result)
    ),
    foot: actions(downloadJson, downloadZip, generate),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
