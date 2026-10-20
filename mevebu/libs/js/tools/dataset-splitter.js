// Split a CSV into train, validation and test sets. Seeded, so the same seed
// and the same file always give the same split, and a row never lands in two
// sets.
import {
  el, toast, download, bench, stack, panel, numberInput, textInput, selectInput,
  button, actions, toolcard, blank, notice,
} from "../core.js";
import { dropzone, baseName, formatBytes } from "../files.js";
import { parseDelimited, detectDelimiter, headerKeys, toCsv } from "../csv.js";
import { seeded, shuffle } from "../random.js";
import { zip } from "../zip.js";

export function mount(slot) {
  let file = null;
  let header = [];
  let rows = [];
  let split = null;

  const train = numberInput({ min: "0", max: "100", step: "5", value: "70", "aria-label": "Train percent" });
  const validation = numberInput({ min: "0", max: "100", step: "5", value: "15", "aria-label": "Validation percent" });
  const seed = textInput({ value: "mevebu", "aria-label": "Seed", class: "font-mono" });
  const stratify = selectInput([{ value: "", label: "Do not stratify" }], { value: "", "aria-label": "Stratify by" });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const tiles = el("div", { class: "grid grid-cols-3 gap-2" });
  const empty = blank("table", "Drop a CSV to split it.");

  const drop = dropzone({ label: "Drop a CSV here", accept: ".csv,text/csv,text/plain", iconName: "table" });
  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const splitButton = button("Split and download", { icon: "download", kind: "fill" });

  function tile(label) {
    const value = el("span", { class: "text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
    const rows = el("span", { class: "text-2xs text-ink-3" }, "");
    const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3 py-2.5" },
      el("span", { class: "text-2xs font-semibold tracking-[0.06em] text-ink-3 uppercase" }, label),
      value, rows);
    node.set = (count, percent) => {
      value.textContent = String(count);
      rows.textContent = `${percent}% of rows`;
    };
    return node;
  }

  const trainTile = tile("Train");
  const validationTile = tile("Validation");
  const testTile = tile("Test");
  tiles.append(trainTile, validationTile, testTile);

  function weights() {
    const a = Math.max(0, Number(train.value) || 0);
    const b = Math.max(0, Number(validation.value) || 0);
    const c = Math.max(0, 100 - a - b);
    return { train: a, validation: b, test: c };
  }

  function compute() {
    const w = weights();
    const random = seeded(seed.value || "mevebu");
    const key = stratify.value;
    const keyIndex = key ? header.indexOf(key) : -1;

    const buckets = new Map();
    for (const row of rows) {
      const group = keyIndex >= 0 ? row[keyIndex] ?? "" : "__all__";
      if (!buckets.has(group)) buckets.set(group, []);
      buckets.get(group).push(row);
    }

    const out = { train: [], validation: [], test: [] };
    for (const group of buckets.values()) {
      const list = shuffle(group, random);
      const n = list.length;
      const trainEnd = Math.round((w.train / 100) * n);
      const validationEnd = trainEnd + Math.round((w.validation / 100) * n);
      out.train.push(...list.slice(0, trainEnd));
      out.validation.push(...list.slice(trainEnd, validationEnd));
      out.test.push(...list.slice(validationEnd));
    }

    // Shuffle the final sets so a stratified split is not grouped by class.
    for (const name of Object.keys(out)) out[name] = shuffle(out[name], random);
    return out;
  }

  function render() {
    empty.hidden = rows.length > 0;
    tiles.hidden = rows.length === 0;
    splitButton.disabled = rows.length === 0;
    clearButton.disabled = rows.length === 0;
    if (!rows.length) {
      summary.textContent = "";
      return;
    }
    const w = weights();
    split = compute();
    const total = rows.length;
    trainTile.set(split.train.length, Math.round((split.train.length / total) * 100));
    validationTile.set(split.validation.length, Math.round((split.validation.length / total) * 100));
    testTile.set(split.test.length, Math.round((split.test.length / total) * 100));
    summary.textContent = `${total} rows · ${header.length} columns · seed ${seed.value || "mevebu"}${w.test < 0 ? " · the percentages add to more than 100, so test is empty" : ""}`;
    if (w.test < 0) error.write("Train and validation add to more than 100 percent. Test gets nothing.");
    else error.write("");
  }

  async function open(files) {
    const picked = Array.from(files).find((entry) => /\.(csv|tsv|txt)$/i.test(entry.name) || entry.type.startsWith("text/"));
    if (!picked) {
      error.write("That file is not a CSV.");
      return;
    }
    try {
      const text = await picked.text();
      const parsed = parseDelimited(text, detectDelimiter(text));
      if (parsed.length < 2) throw new Error("A CSV needs a header row and at least one data row.");
      file = picked;
      header = headerKeys(parsed[0]);
      rows = parsed.slice(1).filter((row) => row.some((cell) => cell !== ""));
      stratify.replaceChildren(
        el("option", { value: "" }, "Do not stratify"),
        ...header.map((name) => el("option", { value: name }, name))
      );
      stratify.value = "";
      error.write("");
      render();
    } catch (caught) {
      error.write(caught?.message || "This file could not be read.");
    }
  }

  drop.onFiles(open);
  train.addEventListener("input", render);
  validation.addEventListener("input", render);
  seed.addEventListener("input", render);
  stratify.addEventListener("change", render);

  splitButton.addEventListener("click", () => {
    if (!split) return;
    const base = baseName(file?.name || "data");
    const files = ["train", "validation", "test"].map((name) => ({
      name: `${base}-${name}.csv`,
      bytes: new TextEncoder().encode(toCsv([header, ...split[name]])),
    }));
    download(`${base}-split.zip`, zip(files), "application/zip");
    toast("Three files ready");
  });

  clearButton.addEventListener("click", () => {
    file = null;
    header = [];
    rows = [];
    split = null;
    error.write("");
    render();
  });

  render();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        el("div", { class: "grid grid-cols-2 gap-3" }, panel("Train %", train), panel("Validation %", validation)),
        panel("Seed", seed, "The same seed and file give the same split."),
        panel("Stratify by", stratify, "Keeps each class proportional across the three sets."),
        error
      ),
      stack(summary, empty, tiles,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "Every row goes to exactly one set. The test share is whatever is left after train and validation."))
    ),
    foot: actions(clearButton, splitButton),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
