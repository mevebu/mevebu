// Scientific math from a typed expression or the keypad. Degrees or radians
// drive the trig functions, and recent results stay in a short history.
import { el, bench, stack, panel, textInput, output, notice, button, copyButton, chipRow, actions, toolcard } from "../core.js";

function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      if (src[j] === "e" || src[j] === "E") {
        let k = j + 1;
        if (src[k] === "+" || src[k] === "-") k++;
        if (/[0-9]/.test(src[k] ?? "")) {
          while (k < src.length && /[0-9]/.test(src[k])) k++;
          j = k;
        }
      }
      tokens.push({ type: "num", value: Number(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      let j = i;
      while (j < src.length && /[a-zA-Z]/.test(src[j])) j++;
      tokens.push({ type: "name", value: src.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if ("+-*/^()".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    throw new Error("Unexpected character");
  }
  return tokens;
}

const FUNCTIONS = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),
  log: (x) => Math.log10(x),
  ln: (x) => Math.log(x),
  sqrt: (x) => Math.sqrt(x),
  abs: (x) => Math.abs(x),
  exp: (x) => Math.exp(x)};

function evaluate(src, degrees) {
  const tokens = tokenize(src);
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = () => tokens[pos++];
  const toRad = (x) => (degrees ? (x * Math.PI) / 180 : x);
  const fromRad = (x) => (degrees ? (x * 180) / Math.PI : x);

  function expr() {
    let value = term();
    while (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
      const op = eat().value;
      const rhs = term();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function term() {
    let value = unary();
    for (;;) {
      const token = peek();
      if (token && token.type === "op" && (token.value === "*" || token.value === "/")) {
        eat();
        const rhs = unary();
        value = token.value === "*" ? value * rhs : value / rhs;
      } else if (token && (token.type === "num" || token.type === "name" || (token.type === "op" && token.value === "("))) {
        value *= unary();
      } else break;
    }
    return value;
  }

  function unary() {
    const token = peek();
    if (token && token.type === "op" && (token.value === "-" || token.value === "+")) {
      eat();
      const value = unary();
      return token.value === "-" ? -value : value;
    }
    return power();
  }

  function power() {
    const base = primary();
    if (peek() && peek().type === "op" && peek().value === "^") {
      eat();
      return base ** unary();
    }
    return base;
  }

  function primary() {
    const token = eat();
    if (!token) throw new Error("Unexpected end of expression");
    if (token.type === "num") return token.value;
    if (token.type === "name") {
      if (token.value === "pi") return Math.PI;
      if (token.value === "e") return Math.E;
      if (!FUNCTIONS[token.value]) throw new Error("Unknown name");
      const open = eat();
      if (!open || open.value !== "(") throw new Error("Expected an opening bracket");
      const arg = expr();
      const close = eat();
      if (!close || close.value !== ")") throw new Error("Expected a closing bracket");
      const raw = FUNCTIONS[token.value](token.value === "sin" || token.value === "cos" || token.value === "tan" ? toRad(arg) : arg);
      return token.value === "asin" || token.value === "acos" || token.value === "atan" ? fromRad(raw) : raw;
    }
    if (token.type === "op" && token.value === "(") {
      const value = expr();
      const close = eat();
      if (!close || close.value !== ")") throw new Error("Expected a closing bracket");
      return value;
    }
    throw new Error("Unexpected token");
  }

  const result = expr();
  if (pos < tokens.length) throw new Error("Unexpected token");
  return result;
}

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 10 });
}

const KEYS = ["sin(", "cos(", "tan(", "log(", "ln(", "sqrt(", "pi", "e", "^", "(", ")", "/", "7", "8", "9", "*", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "="];

export function mount(slot) {
  const input = textInput({ value: "sin(30) + 2^3", "aria-label": "Expression", placeholder: "sin(30) + 2^3" });
  const display = output({ rows: 2 });
  const error = notice("error");
  const history = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" });
  const chips = chipRow(
    [
      { value: "deg", label: "Degrees" },
      { value: "rad", label: "Radians" }],
    {
      value: "deg",
      label: "Angle unit",
      onChange: (value) => {
        degrees = value === "deg";
        run();
      }}
  );
  const recent = [];
  let degrees = true;
  let current = "";

  function renderHistory() {
    history.replaceChildren();
    for (const entry of recent) {
      history.append(
        el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" },
          el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, entry.expression),
          el("span", { class: "wrap-anywhere font-mono text-2xs" }, entry.result))
      );
    }
  }

  function run() {
    const text = input.value.trim();
    if (!text) {
      display.write("");
      error.write("");
      current = "";
      return;
    }
    try {
      const value = evaluate(text, degrees);
      if (!Number.isFinite(value)) throw new Error("Not a finite number");
      current = fmt(value);
      display.write(current);
      error.write("");
    } catch {
      current = "";
      display.write("");
      error.write("That expression could not be read.");
    }
  }

  function commit() {
    run();
    if (!current) return;
    recent.unshift({ expression: input.value.trim(), result: current });
    recent.splice(5);
    renderHistory();
  }

  function insert(token) {
    if (token === "=") {
      commit();
      return;
    }
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    input.value = input.value.slice(0, start) + token + input.value.slice(end);
    const caret = start + token.length;
    input.focus();
    input.setSelectionRange(caret, caret);
    run();
  }

  const keypad = el("div", { class: "flex flex-wrap gap-1.5" });
  for (const key of KEYS) {
    keypad.append(el("button", { class: "min-h-[var(--ctl)] cursor-pointer rounded-r1 border border-orbit bg-deck px-[13px] text-sm font-medium text-ink-2 transition-colors duration-150 hover:border-orbit-hard hover:text-ink data-[on]:border-jade data-[on]:bg-jade-soft data-[on]:text-ink", type: "button", onclick: () => insert(key) }, key));
  }

  input.addEventListener("input", run);
  const evaluateButton = button("Evaluate", { icon: "calculator", kind: "fill", onclick: commit });

  const card = toolcard({
    body: bench(
      stack(
        panel("Expression", input),
        panel("Angle unit", chips),
        panel("Keys", keypad)
      ),
      stack(display, error, panel("History", history))
    ),
    foot: actions(copyButton(() => current, "Copy result"), evaluateButton)});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
