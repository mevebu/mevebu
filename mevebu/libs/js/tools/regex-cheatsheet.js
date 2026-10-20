// A searchable reference for JavaScript regular expressions. Each row shows
// the token, what it matches, and an example with the match highlighted.
import { el, bench, stack, panel, textInput, toolcard } from "../core.js";

const ROWS = [
  { token: ".", meaning: "Any character except a newline.", pattern: "a.c", example: "abc adc a\nc" },
  { token: "\\d", meaning: "A digit, 0 to 9.", pattern: "\\d+", example: "Order 42 shipped" },
  { token: "\\D", meaning: "Anything that is not a digit.", pattern: "\\D+", example: "42 and 7" },
  { token: "\\w", meaning: "A letter, digit or underscore.", pattern: "\\w+", example: "hello_world!" },
  { token: "\\W", meaning: "Anything that is not a word character.", pattern: "\\W+", example: "a-b c" },
  { token: "\\s", meaning: "A space, tab or line break.", pattern: "\\s", example: "a b\tc" },
  { token: "\\S", meaning: "Anything that is not whitespace.", pattern: "\\S+", example: "  keep  this" },
  { token: "^", meaning: "The start of the string, or of a line with m.", pattern: "^abc", example: "abc abc" },
  { token: "$", meaning: "The end of the string, or of a line with m.", pattern: "abc$", example: "abc abc" },
  { token: "*", meaning: "Zero or more of the previous token.", pattern: "ab*", example: "a ab abb" },
  { token: "+", meaning: "One or more of the previous token.", pattern: "ab+", example: "a ab abb" },
  { token: "?", meaning: "Zero or one of the previous token.", pattern: "colou?r", example: "color colour" },
  { token: "{n,m}", meaning: "Between n and m repeats.", pattern: "\\d{2,3}", example: "5 42 1234" },
  { token: "[abc]", meaning: "One character from the set.", pattern: "[aeiou]", example: "mevebu" },
  { token: "[^abc]", meaning: "One character outside the set.", pattern: "[^aeiou]", example: "mevebu" },
  { token: "[a-z]", meaning: "One character from a range.", pattern: "[a-c]+", example: "abcxyz" },
  { token: "(...)", meaning: "A capturing group.", pattern: "(\\d{4})-(\\d{2})", example: "2026-10-20" },
  { token: "(?:...)", meaning: "A group that is not captured.", pattern: "(?:cat|dog)s", example: "cats dogs" },
  { token: "(?<name>...)", meaning: "A named capturing group.", pattern: "(?<year>\\d{4})", example: "in 2026" },
  { token: "\\b", meaning: "A word boundary.", pattern: "\\bcat\\b", example: "cat scatter cat" },
  { token: "|", meaning: "Either the left or the right side.", pattern: "cat|dog", example: "cat dog cow" },
  { token: "\\.", meaning: "A literal dot, escaped.", pattern: "\\d+\\.\\d+", example: "3.14 and 42" },
  { token: "(?=...)", meaning: "Lookahead: what comes next.", pattern: "\\d+(?= USD)", example: "10 USD 20 EUR" },
  { token: "(?<=...)", meaning: "Lookbehind: what came before.", pattern: "(?<=\\$)\\d+", example: "$5 and €7" },
  { token: "*?", meaning: "Lazy: match as little as possible.", pattern: "<.+?>", example: "<a><b>" },
  { token: "i", meaning: "Ignore case. A flag, not a token.", pattern: "[a-z]+", flags: "gi", example: "AbC abc" },
  { token: "g", meaning: "Find every match, not just the first.", pattern: "\\d+", flags: "g", example: "1 22 333" },
  { token: "m", meaning: "Make ^ and $ work per line.", pattern: "^\\w+", flags: "gm", example: "one\ntwo" },
  { token: "s", meaning: "Let . match a newline too.", pattern: "a.b", flags: "s", example: "a\nb" },
  { token: "u", meaning: "Unicode mode, for full code points.", pattern: "\\u{1F600}", flags: "u", example: "hi \u{1F600}" },
];

function highlight(example, pattern, flags = "") {
  let regex;
  try {
    regex = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
  } catch {
    return [document.createTextNode(example)];
  }
  const nodes = [];
  let last = 0;
  for (const match of example.matchAll(regex)) {
    if (match.index > last) nodes.push(document.createTextNode(example.slice(last, match.index)));
    if (!match[0]) break;
    nodes.push(el("mark", { class: "rounded-xs bg-amber-300/60 px-0.5 text-inherit dark:bg-amber-400/40" }, match[0]));
    last = match.index + match[0].length;
  }
  if (last < example.length) nodes.push(document.createTextNode(example.slice(last)));
  return nodes;
}

export function mount(slot) {
  const search = textInput({ placeholder: "Filter tokens", "aria-label": "Filter" });
  const list = el("div", { class: "grid gap-2" });

  function render() {
    const query = search.value.trim().toLowerCase();
    const rows = ROWS.filter((row) =>
      !query || row.token.toLowerCase().includes(query) || row.meaning.toLowerCase().includes(query));
    if (!rows.length) {
      list.replaceChildren(el("p", { class: "text-sm text-ink-2" }, "No token matches that."));
      return;
    }
    list.replaceChildren(...rows.map((row) =>
      el("div", { class: "grid gap-1.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
        el("div", { class: "flex flex-wrap items-baseline gap-2" },
          el("code", { class: "rounded-xs border border-orbit bg-deck px-1.5 py-0.5 font-mono text-sm font-semibold" }, row.token),
          el("span", { class: "text-sm text-ink-2" }, row.meaning)),
        el("p", { class: "font-mono text-sm" },
          ...highlight(row.example, row.pattern, row.flags)),
        el("div", { class: "flex flex-wrap items-center gap-2 text-xs text-ink-3" },
          el("code", { class: "font-mono" }, `/${row.pattern}/${row.flags ?? ""}`),
          el("a", { href: "#/developer/regex-tester", class: "underline decoration-dotted underline-offset-2 hover:text-ink-2" }, "Try it")))));
  }

  search.addEventListener("input", render);

  const link = el("p", { class: "text-sm text-ink-3" },
    "Matches are JavaScript flavoured. Open ",
    el("a", { href: "#/developer/regex-tester", class: "underline decoration-dotted underline-offset-2 hover:text-ink-2" }, "Regex Tester"),
    " to run a full pattern.");

  const card = toolcard({
    body: bench(
      stack(panel("Find a token", search), link),
      stack(panel("Tokens", list)),
    ),
  });
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
