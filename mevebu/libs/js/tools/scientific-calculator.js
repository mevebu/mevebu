// A scientific calculator with a Desmos style keypad: one expression, a live
// result, variables that persist, and a history you can click back into.
// mathjs is vendored and loaded on demand, so the page still works offline and
// the other 187 tools never pay for a parser they do not use.
import {
  el, icon, toast, bench, stack, panel, textInput, notice, chipRow, button,
  copyButton, actions, toolcard,
} from "../core.js";

const VENDOR = new URL("../vendor/mathjs.min.js", import.meta.url).href;

let engine = null;
function loadEngine() {
  if (globalThis.math?.parse) return Promise.resolve(globalThis.math);
  if (engine) return engine;
  engine = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = VENDOR;
    script.onload = () => (globalThis.math?.parse ? resolve(globalThis.math) : reject(new Error("The math engine did not start.")));
    script.onerror = () => reject(new Error("The math engine could not be loaded."));
    document.head.append(script);
  });
  return engine;
}

const INJECTED = new Set([
  "sin", "cos", "tan", "asin", "acos", "atan",
  "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
  "log", "ln", "nCr", "nPr", "ans",
]);

const EXTRA = [
  "asin", "acos", "atan", "sinh", "cosh", "tanh",
  "abs", "round", "floor", "ceil", "exp", "nthRoot",
  "min", "max", "mod", "gcd", "lcm", "nCr", "nPr",
];

const KEYS = [
  ["sin(", "sin"], ["cos(", "cos"], ["tan(", "tan"], ["ln(", "ln"],
  ["log(", "log"], ["sqrt(", "√"], ["^2", "x²"], ["!", "x!"],
  ["(", "("], [")", ")"], ["pi", "π"], ["ans", "ans"],
  ["7", "7"], ["8", "8"], ["9", "9"], ["/", "÷"],
  ["4", "4"], ["5", "5"], ["6", "6"], ["*", "×"],
  ["1", "1"], ["2", "2"], ["3", "3"], ["-", "−"],
  ["0", "0"], [".", "."], ["+", "+"], ["%", "%"],
];

const FUNC_BTN =
  "min-h-[var(--ctl)] cursor-pointer rounded-r1 border border-orbit bg-deck-2 px-1 text-sm font-semibold text-ink transition-colors duration-150 hover:border-orbit-hard hover:bg-deck active:scale-[0.97]";

function smallFraction(value) {
  if (!Number.isFinite(value) || Number.isInteger(value)) return null;
  const sign = value < 0 ? -1 : 1;
  let x = Math.abs(value);
  let h0 = 0, h1 = 1, k0 = 1, k1 = 0;
  for (let i = 0; i < 24; i++) {
    const a = Math.floor(x);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > 10000) return null;
    h0 = h1; h1 = h2; k0 = k1; k1 = k2;
    if (Math.abs(Math.abs(value) - h1 / k1) < 1e-10) {
      return k1 === 1 ? null : { n: sign * h1, d: k1 };
    }
    const rest = x - a;
    if (rest < 1e-12) break;
    x = 1 / rest;
  }
  return null;
}

export function mount(slot) {
  const math = { current: null };
  const scope = { ans: 0 };
  const history = [];
  const state = { degrees: true, fractions: false };

  const input = textInput({
    value: "",
    placeholder: "sin(30) + 2^3",
    "aria-label": "Expression",
    class: "min-h-[56px] border-0 bg-transparent px-0 py-1 font-mono text-2xl font-semibold tracking-[-0.01em] focus:ring-0",
    inputmode: "text",
    autocapitalize: "off",
    autocorrect: "off",
  });
  const result = el("p", {
    class: "m-0 min-h-[1.2em] overflow-x-auto font-mono text-3xl font-bold tracking-[-0.02em] text-ink tabular-nums",
    "aria-live": "polite",
    "aria-atomic": "true",
  });
  const error = notice("error");
  const loading = notice("note");

  const historyList = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" });
  const historyEmpty = el("p", { class: "m-0 text-sm text-ink-3" }, "Every result you commit lands here.");
  const variablesList = el("div", { class: "flex flex-wrap gap-1.5" });
  const variablesEmpty = el("p", { class: "m-0 text-sm text-ink-3" }, "Type a = 5 to keep a value.");

  const display = el(
    "div",
    { class: "grid gap-1 rounded-r2 border border-orbit bg-deck-2 px-4 py-3 focus-within:border-jade focus-within:ring-3 focus-within:ring-jade-soft" },
    input,
    el("div", { class: "h-px bg-orbit" }),
    result
  );

  function format(value) {
    const m = math.current;
    if (!m) return "";
    if (typeof value === "number") {
      if (!Number.isFinite(value)) return String(value);
      if (state.fractions) {
        const fraction = smallFraction(value);
        if (fraction) return `${fraction.n}/${fraction.d}`;
      }
      const size = Math.abs(value);
      const notation = size !== 0 && (size >= 1e12 || size < 1e-6) ? "exponential" : "auto";
      return m.format(value, { precision: 12, notation });
    }
    try {
      return m.format(value, { precision: 12 });
    } catch {
      return String(value);
    }
  }

  function inject(m) {
    const toRad = (x) => (state.degrees ? (x * Math.PI) / 180 : x);
    const fromRad = (x) => (state.degrees ? (x * 180) / Math.PI : x);
    scope.sin = (x) => Math.sin(toRad(x));
    scope.cos = (x) => Math.cos(toRad(x));
    scope.tan = (x) => Math.tan(toRad(x));
    scope.asin = (x) => fromRad(Math.asin(x));
    scope.acos = (x) => fromRad(Math.acos(x));
    scope.atan = (x) => fromRad(Math.atan(x));
    scope.sinh = (x) => Math.sinh(x);
    scope.cosh = (x) => Math.cosh(x);
    scope.tanh = (x) => Math.tanh(x);
    scope.asinh = (x) => Math.asinh(x);
    scope.acosh = (x) => Math.acosh(x);
    scope.atanh = (x) => Math.atanh(x);
    // Desmos reads log as base 10 and ln as natural, which is the opposite of
    // mathjs's default for log, so both names are pinned here.
    scope.log = (x, base) => (base === undefined ? Math.log10(x) : Math.log(x) / Math.log(base));
    scope.ln = (x) => Math.log(x);
    scope.nCr = (n, r) => m.combinations(n, r);
    scope.nPr = (n, r) => m.permutations(n, r);
    math.current = m;
  }

  function read(text, target) {
    const m = math.current;
    if (!m) throw new Error("The math engine is still loading.");
    const node = m.parse(text);
    return node.evaluate(target);
  }

  let previewToken = 0;
  async function preview() {
    const token = ++previewToken;
    const text = input.value.trim();
    error.write("");
    if (!text) {
      result.textContent = "";
      return;
    }
    try {
      const m = await loadEngine();
      if (!math.current) inject(m);
      if (token !== previewToken) return;
      const value = read(text, { ...scope });
      if (token !== previewToken) return;
      result.textContent = format(value);
      result.dataset.preview = "";
    } catch (caught) {
      if (token !== previewToken) return;
      result.textContent = "";
      error.write(shortError(caught));
    }
  }

  function shortError(caught) {
    const text = String(caught?.message ?? "Check the expression.");
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  }

  function commit() {
    const text = input.value.trim();
    if (!text) return;
    try {
      const value = read(text, scope);
      if (typeof value === "number") scope.ans = value;
      const shown = format(value);
      result.textContent = shown;
      delete result.dataset.preview;
      error.write("");
      if (history[0]?.text !== text) {
        history.unshift({ text, value });
        history.splice(20);
      }
      renderHistory();
      renderVariables();
      input.select();
    } catch (caught) {
      error.write(shortError(caught));
    }
  }

  function renderHistory() {
    historyList.replaceChildren(
      ...history.map((entry) =>
        el(
          "button",
          {
            class: "grid w-full cursor-pointer gap-2 border-0 bg-deck px-3 py-2.5 text-start transition-colors duration-150 hover:bg-deck-2 [grid-template-columns:minmax(0,1fr)_auto]",
            type: "button",
            title: "Use this expression again",
            onclick: () => {
              input.value = entry.text;
              input.focus();
              input.setSelectionRange(entry.text.length, entry.text.length);
              preview();
            },
          },
          el("span", { class: "wrap-anywhere font-mono text-sm text-ink-2" }, entry.text),
          el("span", { class: "font-mono text-sm font-semibold text-ink tabular-nums" }, format(entry.value))
        )
      )
    );
    historyEmpty.hidden = history.length > 0;
    historyList.hidden = history.length === 0;
  }

  function renderVariables() {
    const names = Object.keys(scope).filter((name) => !INJECTED.has(name) && name !== "ans");
    variablesList.replaceChildren(
      ...names.map((name) =>
        el(
          "button",
          {
            class: "inline-flex cursor-pointer items-baseline gap-1.5 rounded-full border border-orbit bg-deck-2 px-2.5 py-1 font-mono text-sm transition-colors duration-150 hover:border-jade hover:bg-jade-soft",
            type: "button",
            title: `Insert ${name}`,
            onclick: () => insert(name),
          },
          el("span", { class: "font-semibold text-jade" }, name),
          el("span", { class: "text-ink-2" }, format(scope[name]))
        )
      )
    );
    variablesEmpty.hidden = names.length > 0;
    variablesList.hidden = names.length === 0;
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
    preview();
  }

  function backspace() {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    if (start !== end) {
      input.value = input.value.slice(0, start) + input.value.slice(end);
    } else if (start > 0) {
      input.value = input.value.slice(0, start - 1) + input.value.slice(start);
      input.setSelectionRange(start - 1, start - 1);
    }
    input.focus();
    preview();
  }

  function clear() {
    input.value = "";
    result.textContent = "";
    error.write("");
    input.focus();
  }

  const keypad = el("div", { class: "grid grid-cols-4 gap-1.5" });
  for (const [token, label] of KEYS) {
    keypad.append(
      el("button", { class: FUNC_BTN, type: "button", "aria-label": label, onclick: () => insert(token) }, label)
    );
  }
  keypad.append(
    el("button", { class: FUNC_BTN, type: "button", "aria-label": "Backspace", onclick: backspace }, "DEL"),
    el("button", { class: FUNC_BTN, type: "button", onclick: clear }, "C"),
    el("button", {
      class: "col-span-2 min-h-[var(--ctl)] cursor-pointer rounded-r1 border border-jade bg-jade text-sm font-bold text-on-jade transition-colors duration-150 hover:border-jade-deep hover:bg-jade-deep active:scale-[0.97]",
      type: "button",
      onclick: commit,
    }, "=")
  );

  const extras = el("div", { class: "flex flex-wrap gap-1.5" });
  for (const name of EXTRA) {
    extras.append(
      el("button", {
        class: "inline-flex min-h-8 cursor-pointer items-center rounded-full border border-orbit bg-deck px-2.5 font-mono text-2xs font-semibold text-ink-2 transition-colors duration-150 hover:border-orbit-hard hover:text-ink",
        type: "button",
        onclick: () => insert(`${name}(`),
      }, name)
    );
  }

  const angle = chipRow(
    [
      { value: "deg", label: "Degrees" },
      { value: "rad", label: "Radians" },
    ],
    {
      value: "deg",
      label: "Angle unit",
      onChange: (value) => {
        state.degrees = value === "deg";
        preview();
      },
    }
  );

  const fraction = chipRow(
    [
      { value: "decimal", label: "Decimal" },
      { value: "fraction", label: "Fraction" },
    ],
    {
      value: "decimal",
      label: "Result format",
      onChange: (value) => {
        state.fractions = value === "fraction";
        renderHistory();
        preview();
      },
    }
  );

  const copyResult = copyButton(() => result.textContent, "Copy result");
  const clearHistory = button("Clear history", {
    icon: "trash",
    kind: "quiet",
    onclick: () => {
      history.length = 0;
      renderHistory();
    },
  });
  const commitButton = button("Evaluate", { icon: "calculator", kind: "fill", onclick: commit });

  input.addEventListener("input", preview);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      clear();
    } else if (event.key === "ArrowUp" && history.length) {
      event.preventDefault();
      input.value = history[0].text;
      input.setSelectionRange(input.value.length, input.value.length);
      preview();
    }
  });

  const card = toolcard({
    body: bench(
      stack(
        panel("Angle", angle),
        panel("Result", fraction),
        el("div", { class: "grid gap-1.5" }, el("span", { class: "text-sm font-semibold text-ink-2" }, "Keypad"), keypad),
        el("div", { class: "grid gap-1.5" }, el("span", { class: "text-sm font-semibold text-ink-2" }, "More functions"), extras),
        loading,
        error
      ),
      stack(
        display,
        panel("History", historyList),
        historyEmpty,
        panel("Variables", variablesList),
        variablesEmpty
      )
    ),
    foot: actions(clearHistory, copyResult, commitButton),
  });

  loading.write("Starting the math engine.");
  slot.append(card.node);
  renderHistory();
  renderVariables();
  input.focus();

  loadEngine()
    .then((m) => {
      inject(m);
      loading.write("");
      preview();
    })
    .catch((caught) => {
      loading.write("");
      error.write(shortError(caught));
    });

  return {
    unmount() {
      previewToken++;
    },
  };
}

export default { mount };
