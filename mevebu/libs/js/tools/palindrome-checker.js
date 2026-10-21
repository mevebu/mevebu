// Two checks in one page: is this whole text a palindrome, and what is the
// longest palindrome hidden inside it.
import { el, bench, stack, panel, textArea, checkbox, output, copyButton, actions, toolcard, blank } from "../core.js";

const KEEP = /[\p{L}\p{N}]/gu;

function normalize(text, strict) {
  if (strict) return text;
  return text
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .match(KEEP)?.join("") ?? "";
}

function longestPalindrome(letters) {
  if (!letters) return { value: "", start: 0 };
  let bestStart = 0;
  let bestLength = 1;
  const expand = (left, right) => {
    while (left >= 0 && right < letters.length && letters[left] === letters[right]) {
      if (right - left + 1 > bestLength) {
        bestLength = right - left + 1;
        bestStart = left;
      }
      left--;
      right++;
    }
  };
  for (let center = 0; center < letters.length; center++) {
    expand(center, center);
    expand(center, center + 1);
  }
  return { value: letters.slice(bestStart, bestStart + bestLength), start: bestStart };
}

export function mount(slot) {
  const source = textArea({ rows: 8, "aria-label": "Text" });
  const strict = checkbox("Strict mode", {});
  const verdict = el("p", { class: "text-lg font-semibold" });
  const normalizedOut = output({ rows: 3 });
  const longestOut = output({ rows: 2 });
  const longestNote = el("p", { class: "text-xs text-ink-3" });
  const result = el("div", { class: "grid gap-2" });
  const empty = blank("arrow-left-right", "Type a word or a sentence to check it.");
  let copyValue = "";

  function run() {
    const text = source.value;
    if (!text.trim()) {
      copyValue = "";
      result.replaceChildren(empty);
      normalizedOut.write("");
      longestOut.write("");
      longestNote.textContent = "";
      return;
    }
    result.replaceChildren(verdict);
    const cleaned = normalize(text, strict.input.checked);
    const reversed = [...cleaned].reverse().join("");
    const ok = cleaned.length > 0 && cleaned === reversed;
    verdict.textContent = ok ? "Palindrome" : "Not a palindrome";
    verdict.className = `text-lg font-semibold ${ok ? "text-jade" : "text-ink"}`;
    normalizedOut.write(cleaned || "(nothing left after removing spaces and punctuation)");
    const found = longestPalindrome(cleaned);
    longestOut.write(found.value || "-");
    longestNote.textContent = found.value ? `${found.value.length} characters, starting at ${found.start + 1}.` : "";
    copyValue = ok ? "Palindrome" : "Not a palindrome";
  }

  source.addEventListener("input", run);
  strict.input.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), panel("", strict)),
      stack(panel("Result", result), panel("Normalized", normalizedOut), panel("Longest palindrome inside", longestOut), longestNote),
    ),
    foot: actions(copyButton(() => copyValue, "Copy verdict", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
