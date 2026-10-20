// The fingerprint of an SSH public key, in the SHA256 form that a server prints.
// Comparing it with the host you are about to trust is the step people skip
// because the command is awkward.
import {
  el, toast, bench, stack, panel, textArea, button, actions, toolcard, blank,
  notice, output, copyButton, chipRow,
} from "../core.js";

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeBase64(text) {
  const clean = text.replace(/\s+/g, "");
  if (!clean) throw new Error("The key is empty.");
  const bits = [];
  for (const char of clean) {
    if (char === "=") break;
    const index = BASE64.indexOf(char);
    if (index < 0) throw new Error(`"${char}" is not a Base64 character.`);
    for (let bit = 5; bit >= 0; bit--) bits.push((index >> bit) & 1);
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    bytes.push(byte);
  }
  return new Uint8Array(bytes);
}

/** The SSH wire format: a length prefixed string for each part. */
function sshString(bytes) {
  const out = new Uint8Array(4 + bytes.length);
  new DataView(out.buffer).setUint32(0, bytes.length);
  out.set(bytes, 4);
  return out;
}

async function sha256(bytes) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

function md5(bytes) {
  // A small MD5, only used for the legacy colon form.
  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32));
  const a0 = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  let [A, B, C, D] = a0;
  const padded = new Uint8Array((((bytes.length + 8) >> 6) + 1) * 64);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, (bytes.length << 3) >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(bytes.length / 2 ** 32), true);
  for (let chunk = 0; chunk < padded.length; chunk += 64) {
    const X = [];
    for (let i = 0; i < 16; i++) X[i] = view.getUint32(chunk + i * 4, true);
    let [a, b, c, d] = [A, B, C, D];
    for (let i = 0; i < 64; i++) {
      let f;
      let g;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const tmp = d;
      d = c;
      c = b;
      const sum = (a + f + K[i] + X[g]) | 0;
      b = (b + ((sum << s[i]) | (sum >>> (32 - s[i])))) | 0;
      a = tmp;
    }
    A = (A + a) | 0;
    B = (B + b) | 0;
    C = (C + c) | 0;
    D = (D + d) | 0;
  }
  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, A, true);
  outView.setUint32(4, B, true);
  outView.setUint32(8, C, true);
  outView.setUint32(12, D, true);
  return out;
}

function toBase64(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const chunk = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += BASE64[(chunk >> 18) & 63] + BASE64[(chunk >> 12) & 63];
    out += i + 1 < bytes.length ? BASE64[(chunk >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? BASE64[chunk & 63] : "=";
  }
  return out;
}

export function mount(slot) {
  let format = "sha256";

  const key = textArea({
    rows: 5,
    placeholder: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... user@host",
    "aria-label": "Public key",
    class: "w-full min-w-0 min-h-28 resize-y rounded-r1 border border-orbit bg-deck px-3 py-2.5 font-mono text-sm leading-normal focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft",
    spellcheck: "false",
    autocomplete: "off",
  });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const result = output({ rows: 3 });
  const empty = blank("fingerprint", "Paste a public key to see its fingerprint.");

  const mode = chipRow(
    [
      { value: "sha256", label: "SHA-256" },
      { value: "md5", label: "MD5" },
    ],
    {
      value: "sha256",
      label: "Hash",
      onChange: (value) => {
        format = value;
        run();
      },
    }
  );

  async function run() {
    const source = key.value.trim();
    if (!source) {
      summary.textContent = "";
      result.write("");
      empty.hidden = false;
      result.hidden = true;
      error.write("");
      return;
    }
    const parts = source.split(/\s+/);
    if (parts.length < 2) {
      error.write("A public key line needs a type and a Base64 body.");
      summary.textContent = "";
      result.write("");
      empty.hidden = false;
      result.hidden = true;
      return;
    }
    const [type, body] = parts;
    if (!/^(ssh-|ecdsa-|sk-ssh-|sk-ecdsa-)/.test(type)) {
      error.write(`"${type}" is not a known public key type.`);
      return;
    }
    try {
      const blob = decodeBase64(body);
      const hash = format === "md5" ? md5(blob) : await sha256(blob);
      const shown = format === "md5"
        ? [...hash].map((byte) => byte.toString(16).padStart(2, "0")).join(":")
        : toBase64(hash).replace(/=+$/, "");
      result.write(format === "md5" ? `MD5:${shown}` : `SHA256:${shown}`);
      result.hidden = false;
      empty.hidden = true;
      summary.textContent = `${type} · ${parts.slice(2).join(" ") || "no comment"} · ${blob.length} bytes`;
      error.write("");
    } catch (caught) {
      error.write(caught?.message || "That key could not be read.");
      result.write("");
      result.hidden = true;
      empty.hidden = false;
      summary.textContent = "";
    }
  }

  key.addEventListener("input", run);

  const copy = copyButton(() => result.textContent, "Copy fingerprint");
  const clear = button("Clear", {
    icon: "trash",
    kind: "quiet",
    onclick: () => {
      key.value = "";
      run();
      key.focus();
    },
  });

  run();

  const shell = toolcard({
    body: bench(
      stack(
        panel("Public key", key, "The one line that starts with ssh-ed25519 or ecdsa-sha2."),
        el("div", { class: "grid gap-1.5" }, el("span", { class: "text-sm font-semibold text-ink-2" }, "Hash"), mode),
        error,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "This reads a public key only. Paste a private key and it will be treated as an unreadable line: never paste one here.")
      ),
      stack(summary, empty, result)
    ),
    foot: actions(clear, copy),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
