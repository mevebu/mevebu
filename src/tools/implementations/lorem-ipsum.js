// Lorem Ipsum generator — words / sentences / paragraphs
import { el, icon, toast, copyText, chipGroup } from "../../lib/dom.js";

const W = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum").split(" ");

const ri = (n) => Math.floor(Math.random() * n);
const word = () => W[ri(W.length)];
function sentence(min = 8, max = 16) {
  const n = min + ri(max - min + 1);
  let s = Array.from({ length: n }, word).join(" ");
  s = s[0].toUpperCase() + s.slice(1) + ".";
  return s.replace(/ (\w+)/g, (m) => (ri(6) === 0 ? "," : m)).replace(/(\w+),$/, "$1.");
}
function paragraph() {
  return Array.from({ length: 3 + ri(4) }, sentence).join(" ");
}

export function mount(container) {
  let unit = "paragraphs";
  const chips = chipGroup(
    [{ value: "words", label: "Words" }, { value: "sentences", label: "Sentences" }, { value: "paragraphs", label: "Paragraphs" }],
    { value: "paragraphs", onChange: (v) => { unit = v; gen(); } }
  );
  const count = el("input", { class: "tinput tnum", type: "number", min: "1", max: "200", value: "3" });
  const classic = el("input", { type: "checkbox", checked: true });
  const out = el("pre", { class: "tout tout--block wrap" }, "");

  function gen() {
    const n = Math.max(1, Math.min(200, parseInt(count.value || "1", 10)));
    let text;
    if (unit === "words") text = Array.from({ length: n }, word).join(" ");
    else if (unit === "sentences") text = Array.from({ length: n }, sentence).join(" ");
    else text = Array.from({ length: n }, paragraph).join("\n\n");
    if (classic.checked && text) text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, " + text.slice(text.search(/\s/));
    out.textContent = text;
  }

  count.addEventListener("input", gen);
  classic.addEventListener("change", gen);
  const copy = el("button", { class: "btn btn--accent", type: "button" }, icon("copy"), "Generate & copy");
  copy.onclick = async () => { gen(); ((await copyText(out.textContent)) && toast("Copied ✓")); };
  const justGen = el("button", { class: "btn btn--ghost", type: "button" }, icon("refresh-cw"), "Regenerate");
  justGen.onclick = gen;

  container.append(el("div", { class: "tstack" },
    el("div", { class: "trow trow--wrap" }, chips,
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Amount"), count),
      el("label", { class: "tcheck" }, classic, "Start with “Lorem ipsum…”")),
    el("div", { class: "trow" }, justGen, copy),
    out));
  gen();
  return {};
}
export default { mount };
