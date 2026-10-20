// Bcrypt, for testing a login. The hash and the check both run in this tab with a
// vendored pure JavaScript build, so no password leaves the page. The cost factor
// is the point: each step doubles the work, and the timing shows it.
import {
  el, toast, bench, stack, panel, textInput, numberInput, button, actions,
  toolcard, notice, copyButton, output, chipRow,
} from "../core.js";

const COST_MIN = 4;
const COST_MAX = 14;

function bcryptLib() {
  const lib = globalThis.dcodeIO?.bcrypt ?? globalThis.bcrypt;
  if (!lib) throw new Error("The bcrypt engine did not load.");
  return lib;
}

function loadEngine() {
  if (globalThis.dcodeIO?.bcrypt || globalThis.bcrypt) return Promise.resolve(bcryptLib());
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("../vendor/bcrypt.min.js", import.meta.url).href;
    script.onload = () => {
      try {
        resolve(bcryptLib());
      } catch (caught) {
        reject(caught);
      }
    };
    script.onerror = () => reject(new Error("The bcrypt engine could not be loaded."));
    document.head.append(script);
  });
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

export function mount(slot) {
  let hashed = "";
  let busy = false;
  let token = 0;

  const password = textInput({
    type: "password",
    placeholder: "The password to hash",
    "aria-label": "Password",
    autocomplete: "new-password",
  });
  const show = el("input", { type: "checkbox", class: "m-0 size-4 accent-[var(--jade)]" });
  const cost = numberInput({ min: String(COST_MIN), max: String(COST_MAX), step: "1", value: "10", "aria-label": "Cost factor" });
  const costLabel = el("span", { class: "text-sm font-semibold text-ink-2 tabular-nums" }, "");

  const existing = textInput({
    placeholder: "$2b$10$...",
    "aria-label": "Hash to check",
    class: "font-mono text-sm",
    autocomplete: "off",
    spellcheck: "false",
  });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const hashOut = output({ rows: 3 });
  const verdict = el("p", { class: "m-0 text-sm font-semibold" });

  function syncCost() {
    const value = Math.max(COST_MIN, Math.min(COST_MAX, Number(cost.value) || 10));
    costLabel.textContent = `${value} · about ${2 ** value} rounds`;
  }

  async function hash() {
    if (busy) return;
    if (!password.value) {
      error.write("Type a password first.");
      return;
    }
    busy = true;
    const current = ++token;
    error.write("");
    summary.textContent = "Hashing";
    try {
      const lib = await loadEngine();
      const rounds = Math.max(COST_MIN, Math.min(COST_MAX, Number(cost.value) || 10));
      await tick();
      const started = performance.now();
      const salt = lib.genSaltSync(rounds);
      const result = lib.hashSync(password.value, salt);
      const took = performance.now() - started;
      if (current !== token) return;
      hashed = result;
      hashOut.write(result);
      summary.textContent = `cost ${rounds} · ${Math.round(took)} ms on this device`;
      toast("Hash ready");
    } catch (caught) {
      if (current !== token) return;
      error.write(caught?.message || "The hash could not be made.");
    } finally {
      busy = false;
    }
  }

  async function check() {
    const stored = existing.value.trim();
    verdict.textContent = "";
    if (!stored) return;
    if (!/^\$2[abxy]\$\d{2}\$.{53}$/.test(stored)) {
      verdict.textContent = "That is not a bcrypt hash. It should start with $2b$ and be 60 characters.";
      verdict.className = "m-0 text-sm font-semibold text-danger";
      return;
    }
    if (!password.value) {
      verdict.textContent = "Type the password to check against that hash.";
      verdict.className = "m-0 text-sm font-semibold text-ink-2";
      return;
    }
    try {
      const lib = await loadEngine();
      const ok = lib.compareSync(password.value, stored);
      verdict.textContent = ok ? "Match: this password produces that hash." : "No match for that password.";
      verdict.className = ok ? "m-0 text-sm font-semibold text-jade" : "m-0 text-sm font-semibold text-danger";
    } catch (caught) {
      verdict.textContent = caught?.message || "The check could not run.";
      verdict.className = "m-0 text-sm font-semibold text-danger";
    }
  }

  show.addEventListener("change", () => {
    password.type = show.checked ? "text" : "password";
  });
  password.addEventListener("input", check);
  existing.addEventListener("input", check);
  cost.addEventListener("input", syncCost);

  const copy = copyButton(() => hashed, "Copy hash");
  const hashButton = button("Hash password", { icon: "hash", kind: "fill", onclick: hash });

  syncCost();

  const shell = toolcard({
    body: bench(
      stack(
        panel("Password", password),
        el("label", { class: "inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm text-ink-2" }, show, "Show password"),
        panel("Cost factor", cost, "Each step doubles the work. 10 is a common default; 12 is slower and safer."),
        costLabel,
        panel("Hash to check", existing, "Paste a stored hash to see whether the password matches it."),
        verdict,
        error
      ),
      stack(summary, hashOut,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "Bcrypt is a password hash, not encryption. The salt is in the hash, so the same password gives a different result each time. Use the timing to pick a cost your server can afford."))
    ),
    foot: actions(copy, hashButton),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
