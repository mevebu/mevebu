// A plain text preview of common LaTeX math, next to the source.
import { el, bench, stack, panel, textArea, notice, copyButton, actions, toolcard } from "../core.js";

const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "n": "ⁿ" };
const SUB = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋" };
const GREEK = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", zeta: "ζ", eta: "η",
  theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ",
  pi: "π", rho: "ρ", sigma: "σ", tau: "τ", phi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π", Sigma: "Σ",
  Phi: "Φ", Psi: "Ψ", Omega: "Ω"};
const SYMBOLS = {
  times: "×", cdot: "·", div: "÷", pm: "±", mp: "∓", le: "≤", leq: "≤",
  ge: "≥", geq: "≥", ne: "≠", neq: "≠", approx: "≈", equiv: "≡", infty: "∞",
  sum: "Σ", prod: "Π", int: "∫", partial: "∂", nabla: "∇", rightarrow: "→",
  to: "→", leftarrow: "←", Rightarrow: "⇒", Leftarrow: "⇐", leftrightarrow: "↔",
  in: "∈", notin: "∉", forall: "∀", exists: "∃", angle: "∠", degree: "°"};

const superscript = (value) => [...value].map((char) => SUP[char] ?? char).join("");
const subscript = (value) => [...value].map((char) => SUB[char] ?? char).join("");

function preview(source) {
  let text = source;
  text = text.replace(/\\text\s*\{([^{}]*)\}/g, "$1");
  text = text.replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)");
  text = text.replace(/\\(?:d|t)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)");
  text = text.replace(/\\([A-Za-z]+)/g, (match, name) => SYMBOLS[name] ?? GREEK[name] ?? match);
  text = text.replace(/\^\{([^{}]*)\}/g, (_, value) => superscript(value));
  text = text.replace(/\^(\S)/g, (_, value) => superscript(value));
  text = text.replace(/_\{([^{}]*)\}/g, (_, value) => subscript(value));
  text = text.replace(/_(\S)/g, (_, value) => subscript(value));
  text = text.replace(/\\(?:left|right)/g, "");
  text = text.replace(/\\([ ,;:!])/g, " ");
  text = text.replace(/\\/g, "");
  text = text.replace(/[{}]/g, "");
  return text;
}

export function mount(slot) {
  const source = textArea({
    rows: 12,
    value: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    "aria-label": "LaTeX",
    placeholder: "\\frac{a}{b}"});
  const result = el("pre", { class: "m-0 max-h-[340px] w-full overflow-auto rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3 font-mono text-sm leading-normal whitespace-pre-wrap [overflow-wrap:anywhere]" });
  const note = notice("note");
  note.write("Plain text preview, not rendered math.");

  function run() {
    result.textContent = source.value ? preview(source.value) : "";
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("LaTeX", source)),
      stack(panel("Preview", result), note)
    ),
    foot: actions(copyButton(() => source.value, "Copy LaTeX", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
