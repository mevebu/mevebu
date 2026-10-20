// The hash of a file, to compare against a published checksum. The file is read
// here with Web Crypto, so a download can be verified before it is opened.
import {
  el, icon, toast, bench, stack, panel, textInput, button, actions, toolcard,
  blank, notice, copyButton, output,
} from "../core.js";
import { dropzone, formatBytes } from "../files.js";

const ALGORITHMS = [
  { id: "SHA-1", label: "SHA-1" },
  { id: "SHA-256", label: "SHA-256" },
  { id: "SHA-512", label: "SHA-512" },
];

function hex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function mount(slot) {
  let file = null;
  let digests = {};

  const expected = textInput({
    placeholder: "Paste the published checksum",
    "aria-label": "Expected checksum",
    class: "font-mono text-sm",
    autocomplete: "off",
    spellcheck: "false",
  });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const verdictTitle = el("p", { class: "m-0 text-lg font-bold" }, "Waiting");
  const verdictBody = el("p", { class: "m-0 text-sm text-ink-2" }, "Drop a file, then paste the checksum you were given.");
  const verdict = el("div", { class: "grid gap-1 rounded-r2 border border-orbit bg-deck-2 p-4" }, verdictTitle, verdictBody);
  const rows = el("div", { class: "grid gap-2" });
  const empty = blank("file-key", "Drop a file to hash it.");

  const drop = dropzone({ label: "Drop a file here", accept: "", iconName: "file-key" });
  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });

  function paint(state, title, body) {
    const tone = state === "ok"
      ? "border-jade bg-jade-soft"
      : state === "bad"
        ? "border-danger/40 bg-danger/10"
        : "border-orbit bg-deck-2";
    verdict.className = `grid gap-1 rounded-r2 border p-4 ${tone}`;
    verdictTitle.textContent = title;
    verdictTitle.className = `m-0 text-lg font-bold ${state === "ok" ? "text-jade" : state === "bad" ? "text-danger" : ""}`;
    verdictBody.textContent = body;
    verdictBody.className = state === "ok" || state === "bad" ? "m-0 text-sm" : "m-0 text-sm text-ink-2";
  }

  function compare() {
    if (!file) {
      paint("idle", "Waiting", "Drop a file, then paste the checksum you were given.");
      return;
    }
    const wanted = expected.value.replace(/\s+/g, "").toLowerCase();
    if (!wanted) {
      paint("idle", "Ready", "Paste a checksum to compare, or copy one below.");
      return;
    }
    const match = Object.entries(digests).find(([, value]) => value === wanted);
    if (match) {
      paint("ok", "Match", `The file matches the ${match[0]} you pasted.`);
    } else {
      const length = wanted.length;
      const sameLength = Object.entries(digests).find(([, value]) => value.length === length);
      paint(
        "bad",
        "No match",
        sameLength
          ? `That is not the ${sameLength[0]} of this file. Either the file or the checksum is wrong.`
          : `A checksum of ${length} characters is not a SHA-1, SHA-256 or SHA-512 digest.`
      );
    }
  }

  function renderRows() {
    rows.replaceChildren(
      ...ALGORITHMS.map((algorithm) =>
        el("div", { class: "grid gap-1.5 rounded-r1 border border-orbit bg-deck-2 p-2.5" },
          el("div", { class: "flex items-center justify-between gap-2" },
            el("span", { class: "text-2xs font-bold tracking-[0.06em] text-ink-3 uppercase" }, algorithm.label),
            copyButton(() => digests[algorithm.id] ?? "", "Copy")),
          el("p", { class: "m-0 wrap-anywhere font-mono text-2xs leading-[1.6] text-ink" }, digests[algorithm.id] ?? "")))
    );
  }

  async function open(files) {
    const picked = Array.from(files)[0];
    if (!picked) return;
    error.write("");
    summary.textContent = `Reading ${picked.name}`;
    try {
      const bytes = await picked.arrayBuffer();
      const next = {};
      for (const algorithm of ALGORITHMS) {
        const digest = await crypto.subtle.digest(algorithm.id, bytes);
        next[algorithm.id] = hex(new Uint8Array(digest));
      }
      file = picked;
      digests = next;
      summary.textContent = `${picked.name} · ${formatBytes(picked.size)}`;
      empty.hidden = true;
      rows.hidden = false;
      renderRows();
      compare();
    } catch (caught) {
      summary.textContent = "";
      error.write(caught?.message || "This file could not be read.");
    }
  }

  drop.onFiles(open);
  expected.addEventListener("input", compare);
  clearButton.addEventListener("click", () => {
    file = null;
    digests = {};
    expected.value = "";
    summary.textContent = "";
    error.write("");
    rows.replaceChildren();
    rows.hidden = true;
    empty.hidden = false;
    paint("idle", "Waiting", "Drop a file, then paste the checksum you were given.");
  });

  paint("idle", "Waiting", "Drop a file, then paste the checksum you were given.");
  rows.hidden = true;

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        panel("Expected checksum", expected, "SHA-1, SHA-256 or SHA-512. Case and spaces are ignored."),
        verdict,
        error,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "The file is read in this tab. Nothing is uploaded, and the size limit is whatever the browser can hold in memory.")
      ),
      stack(summary, empty, rows)
    ),
    foot: actions(clearButton),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
