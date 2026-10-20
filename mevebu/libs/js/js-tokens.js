// A small JavaScript scanner shared by the formatter and the minifier. It does
// not build an AST: it separates code from strings, templates, regexes and
// comments so whitespace can be changed without touching what a token means.

const KEYWORDS_BEFORE_REGEX = new Set([
  "return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "do",
  "else", "case", "yield", "await", "throw",
]);

const PUNCT = [
  ">>>=", "===", "!==", "**=", "<<=", ">>=", ">>>", "...", "&&=", "||=", "??=",
  "=>", "==", "!=", "<=", ">=", "&&", "||", "??", "?.", "++", "--", "+=", "-=",
  "*=", "/=", "%=", "&=", "|=", "^=", "<<", ">>", "**",
];

const isWordStart = (ch) => /[A-Za-z_$\u0080-\uffff]/.test(ch);
const isWord = (ch) => /[A-Za-z0-9_$\u0080-\uffff]/.test(ch);
const isDigit = (ch) => /[0-9]/.test(ch);

function regexAllowed(previous) {
  if (!previous) return true;
  if (previous.type === "word") return KEYWORDS_BEFORE_REGEX.has(previous.value);
  if (previous.type === "number" || previous.type === "string" || previous.type === "template" || previous.type === "regex") return false;
  if (previous.type === "punct") return ![")", "]", "}"].includes(previous.value);
  return true;
}

function scanTemplate(source, start) {
  let i = start + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") { i += 2; continue; }
    if (ch === "`") return { end: i + 1 };
    if (ch === "$" && source[i + 1] === "{") {
      const inner = scanBraces(source, i + 2);
      if (inner.error) return inner;
      i = inner.end;
      continue;
    }
    i++;
  }
  return { error: "Unclosed template literal." };
}

function scanBraces(source, start) {
  let depth = 1;
  let i = start;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "'" || ch === '"') {
      const end = scanString(source, i);
      if (end.error) return end;
      i = end.end;
      continue;
    }
    if (ch === "`") {
      const end = scanTemplate(source, i);
      if (end.error) return end;
      i = end.end;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") {
      const end = source.indexOf("\n", i);
      i = end === -1 ? source.length : end;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      if (end === -1) return { error: "Unclosed block comment." };
      i = end + 2;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return { end: i + 1 };
    }
    i++;
  }
  return { error: "Unclosed ${ in a template literal." };
}

function scanString(source, start) {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") { i += 2; continue; }
    if (ch === quote) return { end: i + 1 };
    if (ch === "\n") return { error: "Unclosed string." };
    i++;
  }
  return { error: "Unclosed string." };
}

function scanRegex(source, start) {
  let i = start + 1;
  let inClass = false;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") { i += 2; continue; }
    if (ch === "[") inClass = true;
    else if (ch === "]") inClass = false;
    else if (ch === "/" && !inClass) {
      i++;
      while (i < source.length && /[a-z]/i.test(source[i])) i++;
      return { end: i };
    } else if (ch === "\n") return { error: "Unclosed regular expression." };
    i++;
  }
  return { error: "Unclosed regular expression." };
}

/**
 * Split JavaScript into significant tokens. Whitespace is dropped, but each
 * token remembers whether a newline came before it.
 * @param {string} source
 * @returns {{tokens: object[], error: string|null}}
 */
export function tokenize(source) {
  const tokens = [];
  let i = 0;
  let newline = false;
  const push = (token) => {
    token.newline = newline;
    newline = false;
    tokens.push(token);
  };

  while (i < source.length) {
    const ch = source[i];
    if (ch === "\n") { newline = true; i++; continue; }
    if (/\s/.test(ch)) { i++; continue; }

    if (ch === "/" && source[i + 1] === "/") {
      const end = source.indexOf("\n", i);
      const stop = end === -1 ? source.length : end;
      push({ type: "lineComment", value: source.slice(i, stop) });
      i = stop;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      if (end === -1) return { tokens, error: "Unclosed block comment." };
      push({ type: "blockComment", value: source.slice(i, end + 2) });
      i = end + 2;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const result = scanString(source, i);
      if (result.error) return { tokens, error: result.error };
      push({ type: "string", value: source.slice(i, result.end) });
      i = result.end;
      continue;
    }
    if (ch === "`") {
      const result = scanTemplate(source, i);
      if (result.error) return { tokens, error: result.error };
      push({ type: "template", value: source.slice(i, result.end) });
      i = result.end;
      continue;
    }
    if (ch === "/" && regexAllowed(tokens[tokens.length - 1])) {
      const result = scanRegex(source, i);
      if (result.error) return { tokens, error: result.error };
      push({ type: "regex", value: source.slice(i, result.end) });
      i = result.end;
      continue;
    }
    if (isDigit(ch) || (ch === "." && isDigit(source[i + 1]))) {
      const match = source.slice(i).match(/^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*)?\.?\d[\d_]*(?:[eE][+-]?\d[\d_]*)?n?)/);
      const value = match ? match[0] : ch;
      push({ type: "number", value });
      i += value.length;
      continue;
    }
    if (isWordStart(ch)) {
      let end = i + 1;
      while (end < source.length && isWord(source[end])) end++;
      push({ type: "word", value: source.slice(i, end) });
      i = end;
      continue;
    }
    const multi = PUNCT.find((entry) => source.startsWith(entry, i));
    const value = multi || ch;
    push({ type: "punct", value });
    i += value.length;
  }

  return { tokens, error: null };
}

export function bytes(text) {
  return new TextEncoder().encode(text).length;
}
