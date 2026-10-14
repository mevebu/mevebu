// Fake Data Generator — mock users as JSON/CSV/table
import { el, icon, toast, copyText, download, chipGroup, cryptoRandomInt } from "../../lib/dom.js";

const FIRST = ["Ana","Budi","Citra","Dimas","Elena","Fajar","Gita","Hendra","Ingrid","Joko","Kira","Lina","Marco","Nadia","Omar","Putri","Quinn","Rani","Sandro","Tara"];
const LAST = ["Ortega","Wijaya","Santos","Kimura","Novak","Haddad","Silva","Andersen","Costa","Pratama","Rossi","Meyer","Fernandez","Yusuf","Kowalski"];
const COUNTRIES = [["ID","+62"],["ES","+34"],["US","+1"],["DE","+49"],["JP","+81"],["BR","+55"],["NG","+234"],["IN","+91"]];
const CITIES = { ID:["Jakarta","Bandung","Surabaya"], ES:["Madrid","Barcelona","Valencia"], US:["Austin","Denver","Seattle"], DE:["Berlin","Munich","Hamburg"], JP:["Osaka","Kyoto","Tokyo"], BR:["Recife","Curitiba","Salvador"], NG:["Lagos","Abuja","Kano"], IN:["Pune","Kochi","Jaipur"] };

const pick = (a) => a[cryptoRandomInt(a.length)];
const ri = (n) => cryptoRandomInt(n);

function makeUser(i) {
  const f = pick(FIRST), l = pick(LAST);
  const cc = pick(COUNTRIES);
  const emailName = `${f}.${l}`.toLowerCase().replace(/[^a-z]/g, "") + (ri(90) + 10);
  return {
    id: i + 1,
    name: `${f} ${l}`,
    email: `${emailName}@example.test`,
    phone: `${cc[1]} ${700 + ri(300)} ${1000000 + ri(8999999)}`,
    city: pick(CITIES[cc[0]]),
    country: cc[0],
    card: `4${String(ri(999)).padStart(3,"0")} •••• •••• ${1000 + ri(8999)}`,
  };
}

export function mount(container) {
  let format = "json";
  const count = el("input", { class: "tinput tnum", type: "number", min: "1", max: "500", value: "5" });
  const chips = chipGroup(
    [{ value: "json", label: "JSON" }, { value: "csv", label: "CSV" }, { value: "table", label: "Table" }],
    { value: "json", onChange: (v) => { format = v; gen(); } }
  );
  const out = el("pre", { class: "tout tout--block scrollbox" }, "");
  const tableWrap = el("div", { class: "tablewrap" });
  let rows = [];

  function gen() {
    const n = Math.max(1, Math.min(500, parseInt(count.value || "1", 10)));
    rows = Array.from({ length: n }, (_, i) => makeUser(i));
    tableWrap.hidden = format !== "table";
    out.hidden = format === "table";
    if (format === "json") out.textContent = JSON.stringify(rows, null, 2);
    else if (format === "csv") {
      const cols = Object.keys(rows[0]);
      out.textContent = [cols.join(","), ...rows.map((r) => cols.map((c) => `"${String(r[c]).replaceAll('"','""')}"`).join(","))].join("\n");
    } else {
      const cols = Object.keys(rows[0]);
      tableWrap.innerHTML = "";
      const tbl = el("table", { class: "ttable" });
      tbl.append(el("thead", {}, el("tr", {}, ...cols.map((c) => el("th", {}, c)))));
      const tb = el("tbody");
      rows.forEach((r) => tb.append(el("tr", {}, ...cols.map((c) => el("td", {}, String(r[c]))))));
      tbl.append(tb);
      tableWrap.append(tbl);
    }
  }

  const genBtn = el("button", { class: "btn btn--accent", type: "button" }, icon("refresh-cw"), "Generate");
  const copy = el("button", { class: "btn btn--ghost", type: "button" }, icon("copy"), "Copy");
  const save = el("button", { class: "btn btn--ghost", type: "button" }, icon("download"), "Download");
  genBtn.onclick = gen;
  count.addEventListener("input", gen);
  chips.querySelectorAll(".tchip").forEach(() => {});
  copy.onclick = async () => {
    const text = format === "table" ? JSON.stringify(rows) : out.textContent;
    ((await copyText(text)) && toast("Copied ✓"));
  };
  save.onclick = () => {
    if (format === "csv") download("fake-data.csv", out.textContent, "text/csv");
    else download("fake-data.json", format === "json" ? out.textContent : JSON.stringify(rows), "application/json");
  };

  container.append(el("div", { class: "tstack" },
    el("div", { class: "trow trow--wrap" },
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Records"), count), chips),
    el("div", { class: "trow" }, genBtn, copy, save),
    out, tableWrap));
  gen();
  return {};
}
export default { mount };
