// UUID v4 Generator — bulk, copy, JSON export
import { el, icon, toast, copyText, download } from "../../lib/dom.js";

function uuidv4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0,4).join("")}-${h.slice(4,6).join("")}-${h.slice(6,8).join("")}-${h.slice(8,10).join("")}-${h.slice(10,16).join("")}`;
}

export function mount(container) {
  const count = el("input", { class: "tinput tnum", type: "number", min: "1", max: "5000", value: "5" });
  const upper = el("input", { type: "checkbox" });
  const out = el("pre", { class: "tout tout--block scrollbox" }, "");
  let current = [];

  function gen() {
    const n = Math.max(1, Math.min(5000, parseInt(count.value || "1", 10)));
    current = Array.from({ length: n }, uuidv4);
    if (upper.checked) current = current.map((u) => u.toUpperCase());
    out.textContent = current.join("\n");
  }

  const genBtn = el("button", { class: "btn btn--accent", type: "button" }, icon("refresh-cw"), "Generate");
  const copyAll = el("button", { class: "btn btn--ghost", type: "button" }, icon("copy"), "Copy all");
  const asJson = el("button", { class: "btn btn--ghost", type: "button" }, icon("braces"), "JSON");
  const saveFile = el("button", { class: "btn btn--ghost", type: "button" }, icon("download"), ".txt");

  genBtn.onclick = gen;
  upper.onchange = gen;
  copyAll.onclick = async () => current.length && ((await copyText(out.textContent)) && toast(`${current.length} UUIDs copied ✓`));
  asJson.onclick = async () => current.length && ((await copyText(JSON.stringify(current, null, 2))) && toast("JSON array copied ✓"));
  saveFile.onclick = () => current.length && download("uuids.txt", out.textContent);

  container.append(el("div", { class: "tstack" },
    el("div", { class: "trow trow--wrap" },
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Count"), count),
      el("label", { class: "tcheck" }, upper, "Uppercase"),
      genBtn, copyAll, asJson, saveFile),
    out));
  gen();
  return {};
}
export default { mount };
