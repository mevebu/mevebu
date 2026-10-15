// Compacts CSS and reports the size saved. Comments can be kept.
import { el, bench, stack, panel, textArea, switchControl, copyButton, actions, toolcard } from "../core.js";

const bytes = (text) => new TextEncoder().encode(text).length;

const tile = (key, value) =>
  el("div", { class: "mvb-stat" }, el("span", { class: "mvb-stat__v" }, value), el("span", { class: "mvb-stat__k" }, key));

function minify(css, stripComments) {
  let out = "";
  let pending = false;
  let i = 0;
  const n = css.length;
  while (i < n) {
    const ch = css[i];
    const next = css[i + 1];
    if (stripComments && ch === "/" && next === "*") {
      i += 2;
      while (i < n && !(css[i] === "*" && css[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      if (pending && out) out += " ";
      pending = false;
      out += ch;
      i++;
      while (i < n) {
        out += css[i];
        if (css[i] === ch) {
          if (css[i + 1] === ch) { out += css[i + 1]; i += 2; continue; }
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (/\s/.test(ch)) {
      pending = true;
      i++;
      continue;
    }
    if (pending && out) {
      const prev = out[out.length - 1];
      if (!"{};,>+~(".includes(prev) && !"{};,>+~)".includes(ch)) out += " ";
    }
    pending = false;
    out += ch;
    i++;
  }
  return out.trim().replace(/;}/g, "}");
}

export function mount(slot) {
  const source = textArea({
    rows: 12,
    class: "mvb-in mvb-in--area mvb-in--mono",
    "aria-label": "CSS",
    value: "/* card */\n.card {\n  color: red;\n  padding: 10px 12px;\n}",
  });
  const result = textArea({ rows: 12, readonly: true, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "Minified CSS" });
  const stats = el("div", { class: "mvb-stats" });
  let stripComments = true;

  const comments = switchControl("Remove comments", { checked: true });
  comments.input.addEventListener("change", () => { stripComments = comments.input.checked; run(); });

  function run() {
    stats.replaceChildren();
    if (!source.value.trim()) {
      result.value = "";
      return;
    }
    const compact = minify(source.value, stripComments);
    const before = bytes(source.value);
    const after = bytes(compact);
    const saved = before ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
    result.value = compact;
    stats.append(tile("Before", `${before} B`), tile("After", `${after} B`), tile("Saved", `${saved}%`));
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Options", comments), panel("CSS", source)),
      stack(panel("Minified", result), stats)
    ),
    foot: actions(copyButton(() => result.value, "Copy CSS", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
