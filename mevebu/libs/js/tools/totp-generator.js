// The code an authenticator app would show, from a secret you paste. The HMAC
// runs here, so a real secret never has to be typed into a website.
import {
  el, icon, toast, bench, stack, panel, textInput, selectInput, numberInput,
  button, actions, toolcard, notice, copyButton, checkbox,
} from "../core.js";
import { base32Decode, parseOtpUri, totp, stepProgress, formatSecret, randomSecret } from "../totp.js";

export function mount(slot) {
  let secretBytes = null;
  let timer = null;
  let current = "";

  const secret = textInput({
    placeholder: "JBSWY3DPEHPK3PXP or otpauth://totp/...",
    "aria-label": "Secret",
    class: "font-mono",
    autocomplete: "off",
    spellcheck: "false",
  });
  const digits = selectInput(
    [
      { value: "6", label: "6 digits" },
      { value: "8", label: "8 digits" },
    ],
    { value: "6", "aria-label": "Digits" }
  );
  const period = numberInput({ min: "5", max: "300", step: "1", value: "30", "aria-label": "Period in seconds" });
  const algorithm = selectInput(
    [
      { value: "SHA1", label: "SHA-1" },
      { value: "SHA256", label: "SHA-256" },
      { value: "SHA512", label: "SHA-512" },
    ],
    { value: "SHA1", "aria-label": "Algorithm" }
  );
  const showSecret = checkbox("Show the secret", { checked: false });

  const error = notice("warn");
  const code = el("p", {
    class: "m-0 font-mono text-[clamp(38px,9vw,62px)] font-bold leading-none tracking-[0.14em] text-ink tabular-nums",
    "aria-live": "polite",
  }, "------");
  const meta = el("p", { class: "m-0 text-sm text-ink-2" }, "Paste a secret to start.");
  const ring = el("div", { class: "h-1.5 overflow-hidden rounded-full bg-deck-2" },
    el("div", { class: "h-full w-full rounded-full bg-jade transition-[width] duration-1000 ease-linear" }));
  const panelBody = el("div", { class: "grid gap-3 rounded-r2 border border-orbit bg-deck-2 p-4" }, code, meta, ring);

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function readSecret() {
    const raw = secret.value.trim();
    if (!raw) return null;
    const uri = parseOtpUri(raw);
    if (uri) {
      if (uri.type !== "totp") throw new Error("That URI is for a different kind of token, not TOTP.");
      if (!uri.secret) throw new Error("That otpauth URI has no secret in it.");
      if (uri.digits) digits.value = String(uri.digits === 8 ? 8 : 6);
      if (uri.period) period.value = String(uri.period);
      if (uri.algorithm) algorithm.value = ["SHA1", "SHA256", "SHA512"].includes(uri.algorithm) ? uri.algorithm : "SHA1";
      return { bytes: base32Decode(uri.secret), label: uri.issuer || uri.label };
    }
    return { bytes: base32Decode(raw), label: "" };
  }

  async function tick() {
    if (!secretBytes) return;
    const options = {
      digits: Number(digits.value) || 6,
      period: Math.max(5, Number(period.value) || 30),
      algorithm: algorithm.value,
    };
    try {
      const next = await totp(secretBytes, options);
      const { left, ratio } = stepProgress(options.period);
      if (next !== current) {
        current = next;
        code.textContent = next.replace(/(.{3})(?=.)/g, "$1 ");
      }
      meta.textContent = `${Math.ceil(left)} s left · ${options.period} s period · ${options.digits} digits · ${options.algorithm}`;
      ring.firstElementChild.style.width = `${Math.round(ratio * 100)}%`;
      error.write("");
    } catch (caught) {
      error.write(caught?.message || "Could not compute the code.");
    }
  }

  function restart() {
    stop();
    current = "";
    try {
      const parsed = readSecret();
      if (!parsed) {
        secretBytes = null;
        code.textContent = "------";
        meta.textContent = "Paste a secret to start.";
        ring.firstElementChild.style.width = "100%";
        error.write("");
        return;
      }
      secretBytes = parsed.bytes;
      meta.textContent = parsed.label ? `${parsed.label} · reading` : "Reading the secret";
      tick();
      timer = setInterval(tick, 500);
    } catch (caught) {
      secretBytes = null;
      code.textContent = "------";
      meta.textContent = "";
      error.write(caught?.message || "That secret could not be read.");
    }
  }

  secret.addEventListener("input", restart);
  digits.addEventListener("change", restart);
  period.addEventListener("change", restart);
  algorithm.addEventListener("change", restart);

  showSecret.input.addEventListener("change", () => {
    secret.type = showSecret.input.checked ? "text" : "password";
    secret.classList.toggle("font-mono", true);
  });
  secret.type = "password";

  const copyCode = copyButton(() => code.textContent.replace(/\s+/g, ""), "Copy code");
  const newSecret = button("New secret", {
    icon: "refresh-cw",
    onclick: () => {
      secret.type = "text";
      showSecret.input.checked = true;
      secret.value = randomSecret(20);
      restart();
      toast("New secret generated");
    },
  });
  const copySecret = button("Copy secret", {
    icon: "key-round",
    onclick: async () => {
      if (!secret.value.trim()) return;
      const value = formatSecret(secret.value.trim().startsWith("otpauth") ? parseOtpUri(secret.value).secret : secret.value);
      try {
        await navigator.clipboard.writeText(value);
        toast("Secret copied");
      } catch {
        error.write("The clipboard is blocked here.");
      }
    },
  });

  const shell = toolcard({
    body: bench(
      stack(
        panel("Secret", secret, "Base32, or a full otpauth:// URI."),
        el("div", { class: "grid grid-cols-2 gap-3" }, panel("Digits", digits), panel("Period", period)),
        panel("Algorithm", algorithm),
        showSecret,
        error
      ),
      stack(panelBody,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "The code is computed in this tab with Web Crypto. Nothing is sent anywhere, and the secret is not stored."))
    ),
    foot: actions(newSecret, copySecret, copyCode),
  });

  slot.append(shell.node);
  restart();

  return {
    unmount() {
      stop();
    },
  };
}

export default { mount };
