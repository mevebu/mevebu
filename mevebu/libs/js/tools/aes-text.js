// Encrypt a message with a password. AES-256-GCM with a PBKDF2 key, and the salt
// and IV packed into the output, so one string is enough to decrypt.
import {
  el, icon, toast, bench, stack, panel, textArea, textInput, button, actions,
  toolcard, notice, copyButton, output, chipRow,
} from "../core.js";

const ITERATIONS = 310_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const VERSION = 1;

function toBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text) {
  const binary = atob(text.replace(/\s+/g, ""));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export function mount(slot) {
  let mode = "encrypt";

  const message = textArea({ rows: 6, placeholder: "The message", "aria-label": "Message" });
  const password = textInput({
    type: "password",
    placeholder: "A password you will remember",
    "aria-label": "Password",
    autocomplete: "new-password",
  });
  const show = el("input", { type: "checkbox", class: "m-0 size-4 accent-[var(--jade)]" });
  const showLabel = el("label", { class: "inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm text-ink-2" }, show, "Show password");

  const modeRow = chipRow(
    [
      { value: "encrypt", label: "Encrypt" },
      { value: "decrypt", label: "Decrypt" },
    ],
    {
      value: "encrypt",
      label: "Mode",
      onChange: (value) => {
        mode = value;
        sync();
      },
    }
  );

  const error = notice("warn");
  const result = output({ rows: 8 });
  const summary = el("p", { class: "text-sm text-ink-2" });

  function sync() {
    const decrypting = mode === "decrypt";
    message.placeholder = decrypting
      ? "Paste the encrypted text, starting with mv1."
      : "The message";
    message.setAttribute("aria-label", decrypting ? "Encrypted text" : "Message");
    run.textContent = decrypting ? "Decrypt text" : "Encrypt text";
    result.write("");
    summary.textContent = "";
    error.write("");
  }

  async function act() {
    error.write("");
    result.write("");
    summary.textContent = "";
    const text = message.value;
    const pass = password.value;
    if (!text.trim()) {
      error.write(mode === "decrypt" ? "Paste the encrypted text first." : "Write the message first.");
      return;
    }
    if (!pass) {
      error.write("Set a password first.");
      return;
    }

    try {
      if (mode === "encrypt") {
        const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
        const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
        const key = await deriveKey(pass, salt);
        const cipher = new Uint8Array(
          await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text))
        );
        const packed = new Uint8Array(1 + SALT_BYTES + IV_BYTES + cipher.length);
        packed[0] = VERSION;
        packed.set(salt, 1);
        packed.set(iv, 1 + SALT_BYTES);
        packed.set(cipher, 1 + SALT_BYTES + IV_BYTES);
        const encoded = `mv1.${toBase64(packed)}`;
        result.write(encoded);
        summary.textContent = `${encoded.length} characters · AES-256-GCM · PBKDF2-SHA-256, ${ITERATIONS.toLocaleString()} rounds`;
        toast("Encrypted");
      } else {
        const clean = text.trim();
        const body = clean.startsWith("mv1.") ? clean.slice(4) : clean;
        let packed;
        try {
          packed = fromBase64(body);
        } catch {
          throw new Error("That is not Base64. Paste the whole string, starting with mv1.");
        }
        if (packed.length < 1 + SALT_BYTES + IV_BYTES + 16) throw new Error("That string is too short to be an encrypted message.");
        if (packed[0] !== VERSION) throw new Error(`This was written by version ${packed[0]}, which this page does not know.`);
        const salt = packed.slice(1, 1 + SALT_BYTES);
        const iv = packed.slice(1 + SALT_BYTES, 1 + SALT_BYTES + IV_BYTES);
        const cipher = packed.slice(1 + SALT_BYTES + IV_BYTES);
        const key = await deriveKey(pass, salt);
        let plain;
        try {
          plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
        } catch {
          throw new Error("Wrong password, or the text was changed after it was encrypted.");
        }
        const decoded = new TextDecoder().decode(plain);
        result.write(decoded);
        summary.textContent = `${decoded.length} characters`;
        toast("Decrypted");
      }
    } catch (caught) {
      error.write(caught?.message || "That did not work.");
    }
  }

  show.addEventListener("change", () => {
    password.type = show.checked ? "text" : "password";
  });

  const run = button("Encrypt text", { icon: "lock", kind: "fill", onclick: act });
  const copy = copyButton(() => result.textContent, "Copy result");
  const clear = button("Clear", {
    icon: "trash",
    kind: "quiet",
    onclick: () => {
      message.value = "";
      password.value = "";
      result.write("");
      summary.textContent = "";
      error.write("");
      message.focus();
    },
  });

  sync();

  const shell = toolcard({
    body: bench(
      stack(
        el("div", { class: "grid gap-1.5" }, el("span", { class: "text-sm font-semibold text-ink-2" }, "Mode"), modeRow),
        panel("Message", message),
        panel("Password", password),
        showLabel,
        error
      ),
      stack(summary, result,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "AES-256-GCM with a key stretched by PBKDF2-SHA-256. The salt and IV are packed into the output, so one string is all you need to decrypt. A lost password cannot be recovered, which is the point."))
    ),
    foot: actions(clear, copy, run),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
