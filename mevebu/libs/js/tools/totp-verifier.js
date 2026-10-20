// Check a code against a secret, with a drift window. This is the other half of
// the generator: a failing integration needs to know whether the secret or the
// clock is wrong, and the drift count is the answer.
import {
  el, icon, bench, stack, panel, textInput, selectInput, numberInput, button,
  actions, toolcard, notice, chipRow,
} from "../core.js";
import { base32Decode, parseOtpUri, totp } from "../totp.js";

export function mount(slot) {
  let result = null;

  const secret = textInput({
    placeholder: "JBSWY3DPEHPK3PXP or otpauth://totp/...",
    "aria-label": "Secret",
    class: "font-mono",
    autocomplete: "off",
    spellcheck: "false",
  });
  const codeInput = textInput({
    placeholder: "123456",
    "aria-label": "Code",
    class: "font-mono tracking-[0.2em]",
    inputmode: "numeric",
    autocomplete: "off",
  });
  const digits = selectInput(
    [
      { value: "6", label: "6 digits" },
      { value: "8", label: "8 digits" },
    ],
    { value: "6", "aria-label": "Digits" }
  );
  const period = numberInput({ min: "5", max: "300", step: "1", value: "30", "aria-label": "Period in seconds" });
  const drift = numberInput({ min: "0", max: "10", step: "1", value: "1", "aria-label": "Drift steps" });

  const at = el("input", {
    class: "w-full min-h-[var(--ctl)] rounded-r1 border border-orbit bg-deck px-3 py-2.5 font-mono text-sm focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft",
    type: "datetime-local",
    "aria-label": "Timestamp",
  });

  const error = notice("warn");
  const verdict = el("div", { class: "grid gap-1.5 rounded-r2 border border-orbit bg-deck-2 p-4" });
  const verdictTitle = el("p", { class: "m-0 text-xl font-bold tracking-[-0.02em]" }, "Waiting");
  const verdictBody = el("p", { class: "m-0 text-sm leading-[1.6] text-ink-2" }, "Paste a secret and a code.");
  const candidates = el("div", { class: "grid gap-1.5" });
  verdict.append(verdictTitle, verdictBody, candidates);

  const check = button("Check code", { icon: "shield-check", kind: "fill" });

  function readSecret() {
    const raw = secret.value.trim();
    if (!raw) return null;
    const uri = parseOtpUri(raw);
    if (uri) {
      if (uri.secret) {
        if (uri.digits) digits.value = String(uri.digits === 8 ? 8 : 6);
        if (uri.period) period.value = String(uri.period);
      }
      return base32Decode(uri.secret);
    }
    return base32Decode(raw);
  }

  function paint(state, title, body, rows = []) {
    const tone = state === "ok"
      ? "border-jade bg-jade-soft text-jade"
      : state === "bad"
        ? "border-danger/40 bg-danger/10 text-danger"
        : "border-orbit bg-deck-2 text-ink";
    verdict.className = `grid gap-1.5 rounded-r2 border p-4 ${tone}`;
    verdictTitle.textContent = title;
    verdictBody.textContent = body;
    verdictBody.className = state === "ok" || state === "bad" ? "m-0 text-sm leading-[1.6]" : "m-0 text-sm leading-[1.6] text-ink-2";
    candidates.replaceChildren(
      ...rows.map((row) =>
        el("div", { class: "flex items-center justify-between gap-3 border-t border-current/15 pt-1.5 text-sm" },
          el("span", { class: "font-mono text-2xs tabular-nums" }, row.code),
          el("span", { class: "text-2xs font-semibold" }, row.label)))
    );
  }

  async function run() {
    error.write("");
    candidates.replaceChildren();
    try {
      const bytes = readSecret();
      if (!bytes) {
        paint("idle", "Waiting", "Paste a secret and a code.");
        return;
      }
      const typed = codeInput.value.replace(/\s+/g, "");
      if (!/^\d{4,10}$/.test(typed)) {
        paint("idle", "Waiting", "The code should be digits only.");
        return;
      }

      const size = Number(digits.value) || 6;
      const step = Math.max(5, Number(period.value) || 30);
      const window = Math.max(0, Math.min(10, Number(drift.value) || 0));
      const stamp = at.value ? new Date(at.value).getTime() : Date.now();
      if (Number.isNaN(stamp)) throw new Error("That timestamp is not a date.");

      const rows = [];
      let match = null;
      for (let offset = -window; offset <= window; offset++) {
        const candidate = await totp(bytes, {
          digits: size,
          period: step,
          timestamp: stamp + offset * step * 1000,
        });
        const label = offset === 0 ? "current step" : offset < 0 ? `${-offset} step earlier` : `${offset} step later`;
        rows.push({ code: candidate, label });
        if (candidate === typed && !match) match = { offset, code: candidate };
      }

      if (match) {
        paint(
          "ok",
          "Match",
          match.offset === 0
            ? "The code is valid for the current step."
            : `The code is valid, ${Math.abs(match.offset)} step${Math.abs(match.offset) === 1 ? "" : "s"} ${match.offset < 0 ? "earlier" : "later"} than the current one.`,
          rows
        );
      } else {
        paint(
          "bad",
          "No match",
          `None of the ${rows.length} steps around that time produce ${typed}. Check the secret, the digits and the period.`,
          rows
        );
      }
    } catch (caught) {
      paint("idle", "Waiting", "");
      error.write(caught?.message || "That secret could not be read.");
    }
  }

  check.addEventListener("click", run);
  secret.addEventListener("input", run);
  codeInput.addEventListener("input", run);
  digits.addEventListener("change", run);
  period.addEventListener("change", run);
  drift.addEventListener("input", run);
  at.addEventListener("change", run);

  const useNow = button("Use now", {
    icon: "clock",
    kind: "quiet",
    onclick: () => {
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      at.value = local;
      run();
    },
  });

  run();

  const shell = toolcard({
    body: bench(
      stack(
        panel("Secret", secret, "Base32, or a full otpauth:// URI."),
        panel("Code to check", codeInput),
        el("div", { class: "grid grid-cols-2 gap-3" }, panel("Digits", digits), panel("Period", period)),
        panel("Drift window", drift, "How many steps either side to accept. One is the usual allowance."),
        panel("Timestamp", at, "Leave empty to use the clock now."),
        useNow,
        error
      ),
      stack(verdict)
    ),
    foot: actions(check),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
