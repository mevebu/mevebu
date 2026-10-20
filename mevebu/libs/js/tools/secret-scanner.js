// Finds API keys, tokens and private keys in a block of text before it is
// pasted somewhere. It matches known shapes, so a clean result is a hint, not a
// guarantee. Every value is masked unless you ask for it.
import {
  el, toast, bench, stack, panel, checkbox, button, actions, toolcard, blank,
  notice, output, copyButton,
} from "../core.js";
import { dropzone, formatBytes } from "../files.js";

const RULES = [
  { id: "aws", label: "AWS access key", re: /\b((?:AKIA|ASIA)[0-9A-Z]{16})\b/g, group: 1 },
  { id: "github", label: "GitHub token", re: /\b((?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{22,}))\b/g, group: 1 },
  { id: "slack", label: "Slack token", re: /\b(xox[baprs]-[A-Za-z0-9-]{10,})\b/g, group: 1 },
  { id: "stripe", label: "Stripe key", re: /\b((?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{16,})\b/g, group: 1 },
  { id: "google", label: "Google API key", re: /\b(AIza[0-9A-Za-z_\-]{35})\b/g, group: 1 },
  { id: "jwt", label: "JSON Web Token", re: /\b(eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,})\b/g, group: 1 },
  { id: "pem", label: "Private key block", re: /(-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----)/g, group: 1 },
  { id: "basic", label: "Basic auth in a URL", re: /\b([a-z][a-z0-9+.-]*:\/\/[^\s/@:]+:[^\s/@]+@)/gi, group: 1 },
  { id: "sql", label: "Database password in a string", re: /\b(?:password|passwd|pwd)\s*=\s*['"]([^'"]{6,})['"]/gi, group: 1 },
];

function mask(value) {
  if (value.length <= 8) return `${value.slice(0, 2)}${"*".repeat(Math.max(2, value.length - 2))}`;
  return `${value.slice(0, 4)}${"*".repeat(Math.min(12, value.length - 8))}${value.slice(-4)}`;
}

function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text[i] === "\n") line++;
  return line;
}

export function mount(slot) {
  let findings = [];

  const reveal = checkbox("Show the matched values", { checked: false });
  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const list = el("div", { class: "grid gap-2" });
  const empty = blank("shield-alert", "Paste text or drop a file to scan it.");
  const scanned = output({ rows: 8 });

  const text = el("textarea", {
    class: "w-full min-w-0 min-h-32 resize-y rounded-r1 border border-orbit bg-deck px-3 py-2.5 font-mono text-sm leading-normal focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft",
    placeholder: "Paste a config, an env list, or a diff",
    rows: "8",
    spellcheck: "false",
    autocomplete: "off",
    "aria-label": "Text to scan",
  });

  function render() {
    const showValues = reveal.input.checked;
    list.replaceChildren(
      ...findings.map((finding, index) =>
        el("div", { class: "grid gap-1 rounded-r1 border border-orbit bg-deck-2 p-2.5" },
          el("div", { class: "flex flex-wrap items-center gap-2" },
            el("span", { class: "rounded-full bg-danger/15 px-2 py-0.5 text-2xs font-bold text-danger" }, finding.label),
            el("span", { class: "text-2xs text-ink-3" }, `line ${finding.line}`),
            el("span", { class: "ms-auto font-mono text-2xs text-ink-2" }, showValues ? finding.value : mask(finding.value)),
            copyButton(() => finding.value, "Copy")),
          el("p", { class: "m-0 wrap-anywhere font-mono text-2xs text-ink-3" },
            `${truncate(finding.value, showValues ? 120 : 48)}${showValues ? "" : " masked"}`)))
    );
  }

  function truncate(value, max) {
    return value.length <= max ? value : `${value.slice(0, max)}...`;
  }

  function scan() {
    const source = text.value;
    findings = [];
    if (!source.trim()) {
      summary.textContent = "";
      list.replaceChildren();
      empty.hidden = false;
      scanned.hidden = true;
      error.write("");
      return;
    }
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let match;
      while ((match = rule.re.exec(source)) !== null) {
        findings.push({ id: rule.id, label: rule.label, value: match[rule.group], line: lineAt(source, match.index) });
        if (rule.re.lastIndex === match.index) rule.re.lastIndex++;
      }
    }
    findings.sort((a, b) => a.line - b.line);
    summary.textContent = findings.length
      ? `${findings.length} possible secret${findings.length === 1 ? "" : "s"} in ${source.split("\n").length} lines`
      : `No known secret shape in ${source.split("\n").length} lines`;
    if (!findings.length) error.write("No known secret shape found. This is a hint, not a guarantee: an unfamiliar secret will pass.");
    else error.write("Treat anything below as compromised and rotate it. The values stay in this page.");
    list.hidden = findings.length === 0;
    empty.hidden = findings.length > 0;
    render();
  }

  text.addEventListener("input", scan);
  reveal.input.addEventListener("change", render);

  const drop = dropzone({ label: "Drop a file to scan it", accept: "", iconName: "shield-alert" });
  drop.onFiles(async (files) => {
    const picked = Array.from(files)[0];
    if (!picked) return;
    try {
      text.value = await picked.text();
      summary.textContent = `Read ${picked.name} · ${formatBytes(picked.size)}`;
      scan();
    } catch (caught) {
      error.write(caught?.message || "That file could not be read.");
    }
  });

  const copyReport = button("Copy report", {
    icon: "copy",
    onclick: async () => {
      const text_ = findings.length
        ? findings.map((f) => `line ${f.line}\t${f.label}\t${f.value}`).join("\n")
        : "No known secret shape found.";
      try {
        await navigator.clipboard.writeText(text_);
        toast("Report copied");
      } catch {
        error.write("The clipboard is blocked here.");
      }
    },
  });

  const clear = button("Clear", {
    icon: "trash",
    kind: "quiet",
    onclick: () => {
      text.value = "";
      findings = [];
      summary.textContent = "";
      error.write("");
      list.replaceChildren();
      empty.hidden = false;
      scanned.hidden = true;
    },
  });

  scan();

  const shell = toolcard({
    body: bench(
      stack(
        text,
        drop,
        reveal,
        error,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "Matches known shapes for AWS, GitHub, Slack, Stripe, Google, JWTs, private keys, and credentials in URLs. Nothing is sent anywhere.")
      ),
      stack(summary, empty, list, scanned)
    ),
    foot: actions(clear, copyReport),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
