// Solves a quadratic equation and labels the discriminant and the roots.
import { el, bench, stack, panel, numberInput, notice, copyButton, actions, toolcard } from "../core.js";

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const a = numberInput({ value: "1", "aria-label": "Coefficient a" });
  const b = numberInput({ value: "-3", "aria-label": "Coefficient b" });
  const c = numberInput({ value: "2", "aria-label": "Coefficient c" });
  const discriminant = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const root1 = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const root2 = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const nature = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el(
    "div",
    { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" },
    kvRow("Discriminant", discriminant),
    kvRow("Root 1", root1),
    kvRow("Root 2", root2),
    kvRow("Nature", nature)
  );
  const error = notice("error");
  let text = "";

  function clear() {
    discriminant.textContent = "-";
    root1.textContent = "-";
    root2.textContent = "-";
    nature.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    const A = Number(a.value);
    const B = Number(b.value);
    const C = Number(c.value);
    if ([a, b, c].some((input) => input.value.trim() === "") || ![A, B, C].every(Number.isFinite)) {
      clear();
      return;
    }
    if (A === 0) {
      clear();
      error.write("The coefficient a cannot be zero, that is not a quadratic.");
      return;
    }
    const disc = B * B - 4 * A * C;
    discriminant.textContent = fmt(disc);
    if (disc > 0) {
      const root = Math.sqrt(disc);
      const r1 = (-B + root) / (2 * A);
      const r2 = (-B - root) / (2 * A);
      root1.textContent = fmt(r1);
      root2.textContent = fmt(r2);
      nature.textContent = "Two real roots";
      text = `Roots ${fmt(r1)} and ${fmt(r2)}, discriminant ${fmt(disc)}`;
    } else if (disc === 0) {
      const r = -B / (2 * A);
      root1.textContent = fmt(r);
      root2.textContent = fmt(r);
      nature.textContent = "One real root";
      text = `Root ${fmt(r)}, discriminant 0`;
    } else {
      const real = -B / (2 * A);
      const imag = Math.sqrt(-disc) / (2 * A);
      root1.textContent = `${fmt(real)} + ${fmt(Math.abs(imag))}i`;
      root2.textContent = `${fmt(real)} - ${fmt(Math.abs(imag))}i`;
      nature.textContent = "Two complex roots";
      text = `Roots ${fmt(real)} + ${fmt(Math.abs(imag))}i and ${fmt(real)} - ${fmt(Math.abs(imag))}i, discriminant ${fmt(disc)}`;
    }
  }

  for (const input of [a, b, c]) input.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("a", a), panel("b", b), panel("c", c), error),
      stack(panel("Solution", kv))
    ),
    foot: actions(copyButton(() => text, "Copy roots", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
