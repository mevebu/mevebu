// Version 4 UUIDs. Generates a list, copies the whole list, or copies JSON.
import { el, toast, copyText, download, numberInput, checkbox, button, bench, stack, panel, output, readPin, writePin, actions, toolcard } from "../core.js";

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

export function mount(slot) {
  const PIN = "uuid-generator";
  const saved = readPin(PIN, { count: "5", caps: false });

  const countField = numberInput({ value: saved.count ?? "5", min: "1", max: "1000", "aria-label": "How many" });
  const capsBox = checkbox("Uppercase", { checked: Boolean(saved.caps) });
  const result = output({ rows: 8 });
  let current = [];

  function totalCount() {
    return Math.max(1, Math.min(1000, parseInt(countField.value || "1", 10) || 1));
  }

  function generate() {
    const total = totalCount();
    current = Array.from({ length: total }, uuid);
    if (capsBox.input.checked) current = current.map((value) => value.toUpperCase());
    result.write(current.join("\n"));
    writePin(PIN, { count: String(total), caps: capsBox.input.checked });
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
  copyButton.addEventListener("click", async () => {
    if (!current.length) return toast("Generate first, then copy");
    toast((await copyText(result.textContent)) ? `${current.length} copied` : "Copy failed");
  });
  jsonButton.addEventListener("click", async () => {
    if (!current.length) return toast("Generate first, then copy");
    toast((await copyText(JSON.stringify(current, null, 2))) ? "JSON copied" : "Copy failed");
  });
  const saveButton = button("Save .txt", { icon: "download" });
  saveButton.addEventListener("click", () => {
    if (!current.length) return toast("Generate first");
    download("uuids.txt", result.textContent);
  });

  const card = toolcard({
    body: bench(
      stack(panel("How many", countField), capsBox),
      el("div", { class: "mvb-scroll" }, result)
    ),
    foot: actions(copyButton, jsonButton, saveButton, generateButton),
  });
  slot.append(card.node);
  generate();

  return {};
}

export default { mount };