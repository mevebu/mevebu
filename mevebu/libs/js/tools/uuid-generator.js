// UUIDs in the versions that reach a schema: v4 and v7 are random, v7 sorts by
// time, v1 and v6 are the legacy timestamp pair, and Nil and Max are the two
// sentinels a test suite looks for.
import { el, toast, copyText, download, numberInput, checkbox, chipRow, button, bench, stack, panel, output, readPin, writePin, actions, toolcard } from "../core.js";

// 100 ns ticks between 1582-10-15 and 1970-01-01, the epoch a v1 stamp counts from.
const GREGORIAN_OFFSET = 122192928000000000n;

const VERSIONS = [
  { value: "v4", label: "v4" },
  { value: "v7", label: "v7" },
  { value: "v1", label: "v1" },
  { value: "v6", label: "v6" },
  { value: "nil", label: "Nil" },
  { value: "max", label: "Max" }];

const toHex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
const group = (hex) => `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
const randomHex = (bytes) => toHex(crypto.getRandomValues(new Uint8Array(bytes)));

function v4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return group(toHex(bytes));
}

let lastStamp = 0;
let counter = 0;

/**
 * v7 puts a 48 bit millisecond stamp in front of random bits, so string order
 * matches time order. A generated batch lands several UUIDs in the same
 * millisecond, where the random tail alone would shuffle them, so the 12 bit
 * field behind the stamp steps like a counter for the rest of that millisecond.
 * It starts from a random value each millisecond to keep the tail unguessable.
 */
function v7() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // A clock that steps backwards would break the order as well, so never step back.
  let ms = Math.max(Date.now(), lastStamp);
  counter = counter + 1;
  if (ms !== lastStamp || counter > 0x0fff) {
    // A new millisecond, or more than 4095 in one: start over, and move the stamp
    // on rather than hand out two UUIDs with the same timestamp and tail.
    if (ms === lastStamp) ms += 1;
    counter = (bytes[6] << 4) | bytes[7];
  }
  lastStamp = ms;
  for (let at = 5; at >= 0; at--) {
    bytes[at] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  bytes[6] = 0x70 | (counter >> 8);
  bytes[7] = counter & 0xff;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return group(toHex(bytes));
}

/** The 60 bit timestamp v1 and v6 store, as 15 hex characters, most significant first. */
const stamp = () => (BigInt(Date.now()) * 10000n + GREGORIAN_OFFSET).toString(16).padStart(15, "0");

/** A node id nobody owns, so a generated v1 cannot point at real hardware. */
const nodeHex = () => (parseInt(randomHex(1), 16) | 0x01).toString(16).padStart(2, "0") + randomHex(5);

const sequenceHex = () => ((parseInt(randomHex(2), 16) & 0x3fff) | 0x8000).toString(16).padStart(4, "0");

/** v1 and v6 share every field; only the order of the timestamp differs. */
function timed(version) {
  const ticks = stamp();
  const sequence = sequenceHex();
  const node = nodeHex();
  // v1 stores the stamp low, mid, high, which is why it never sorts. v6 puts the
  // high half first so the string order matches the time order.
  return version === 1
    ? `${ticks.slice(7)}-${ticks.slice(3, 7)}-1${ticks.slice(0, 3)}-${sequence}-${node}`
    : `${ticks.slice(0, 8)}-${ticks.slice(8, 12)}-6${ticks.slice(12)}-${sequence}-${node}`;
}

function make(version) {
  if (version === "nil") return "00000000-0000-0000-0000-000000000000";
  if (version === "max") return "ffffffff-ffff-ffff-ffff-ffffffffffff";
  if (version === "v7") return v7();
  if (version === "v1") return timed(1);
  if (version === "v6") return timed(6);
  return v4();
}

export function mount(slot) {
  const PIN = "uuid-generator";
  const saved = readPin(PIN, { count: "5", caps: false, noHyphens: false, version: "v4" });

  const countField = numberInput({ value: saved.count ?? "5", min: "1", max: "1000", "aria-label": "How many" });
  const capsBox = checkbox("Uppercase", { checked: Boolean(saved.caps) });
  const hyphensBox = checkbox("No hyphens", { checked: saved.noHyphens === true });
  const result = output({ rows: 8 });
  let version = VERSIONS.some((item) => item.value === saved.version) ? saved.version : "v4";
  let current = [];

  const versions = chipRow(VERSIONS, {
    value: version,
    label: "Version",
    onChange: (value) => {
      version = value;
      generate();
    }});

  function totalCount() {
    return Math.max(1, Math.min(1000, parseInt(countField.value || "1", 10) || 1));
  }

  function generate() {
    const total = totalCount();
    current = Array.from({ length: total }, () => make(version));
    if (capsBox.input.checked) current = current.map((value) => value.toUpperCase());
    if (hyphensBox.input.checked) current = current.map((value) => value.replace(/-/g, ""));
    result.write(current.join("\n"));
    writePin(PIN, {
      count: String(total),
      caps: capsBox.input.checked,
      noHyphens: hyphensBox.input.checked,
      version});
  }

  const generateButton = button("Generate", { icon: "refresh-cw", kind: "fill" });
  const copyButton = button("Copy all", { icon: "copy" });
  const jsonButton = button("Copy JSON", { icon: "clipboard" });

  generateButton.addEventListener("click", () => {
    countField.value = String(totalCount());
    generate();
  });
  countField.addEventListener("input", generate);
  countField.addEventListener("change", () => {
    countField.value = String(totalCount());
  });
  capsBox.input.addEventListener("change", generate);
  hyphensBox.input.addEventListener("change", generate);
  copyButton.addEventListener("click", async () => {
    if (!current.length) return toast("Generate first, then copy");
    toast((await copyText(current.join("\n"))) ? `${current.length} copied` : "Copy failed");
  });
  jsonButton.addEventListener("click", async () => {
    if (!current.length) return toast("Generate first, then copy");
    toast((await copyText(JSON.stringify(current, null, 2))) ? "JSON copied" : "Copy failed");
  });
  const saveButton = button("Save .txt", { icon: "download" });
  saveButton.addEventListener("click", () => {
    if (!current.length) return toast("Generate first");
    download("uuids.txt", current.join("\n"));
  });

  const card = toolcard({
    body: bench(
      stack(panel("Version", versions), panel("How many", countField), el("div", { class: "flex flex-wrap gap-1.5" }, capsBox, hyphensBox)),
      result
    ),
    foot: actions(copyButton, jsonButton, saveButton, generateButton)});
  slot.append(card.node);
  generate();

  return {};
}

export default { mount };
