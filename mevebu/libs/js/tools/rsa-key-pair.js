// An RSA key pair made in the tab with Web Crypto. The keys exist only in the
// page until it closes, and both come out as PEM, the form most tools expect.
import {
  el, toast, download, bench, stack, panel, selectInput, button, actions,
  toolcard, blank, notice, copyButton, output, checkbox,
} from "../core.js";

const SIZES = [
  { value: "2048", label: "2048 bits" },
  { value: "3072", label: "3072 bits" },
  { value: "4096", label: "4096 bits" },
];

function wrap(base64) {
  return base64.match(/.{1,64}/g).join("\n");
}

function toPem(label, der) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(der)));
  return `-----BEGIN ${label}-----\n${wrap(base64)}\n-----END ${label}-----\n`;
}

export function mount(slot) {
  let pair = null;
  let busy = false;
  let token = 0;

  const size = selectInput(SIZES, { value: "2048", "aria-label": "Key size" });
  const showPrivate = checkbox("Show the private key", { checked: false });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const publicOut = output({ rows: 8 });
  const privateOut = output({ rows: 10 });
  const empty = blank("key-round", "Generate a pair to see the keys.");
  const publicBox = el("div", { class: "grid gap-1.5" },
    el("span", { class: "text-2xs font-bold tracking-[0.06em] text-ink-3 uppercase" }, "Public key"), publicOut);
  const privateBox = el("div", { class: "grid gap-1.5" },
    el("span", { class: "text-2xs font-bold tracking-[0.06em] text-ink-3 uppercase" }, "Private key"), privateOut);

  const generateButton = button("Generate pair", { icon: "refresh-cw", kind: "fill", onclick: generate });
  const copyPublic = copyButton(() => pair?.publicPem ?? "", "Copy public");
  const copyPrivate = copyButton(() => pair?.privatePem ?? "", "Copy private");
  const downloadPublic = button("Download public", {
    icon: "download",
    onclick: () => { if (pair) download("public.pem", pair.publicPem, "application/x-pem-file"); },
  });
  const downloadPrivate = button("Download private", {
    icon: "download",
    onclick: () => { if (pair) download("private.pem", pair.privatePem, "application/x-pem-file"); },
  });

  function sync() {
    const hasKeys = Boolean(pair);
    publicBox.hidden = !hasKeys;
    privateBox.hidden = !hasKeys || !showPrivate.input.checked;
    empty.hidden = hasKeys;
    privateOut.hidden = privateBox.hidden;
    copyPrivate.disabled = !hasKeys;
    copyPublic.disabled = !hasKeys;
    downloadPrivate.disabled = !hasKeys;
    downloadPublic.disabled = !hasKeys;
  }

  async function generate() {
    if (busy) return;
    busy = true;
    const current = ++token;
    generateButton.disabled = true;
    summary.textContent = "Generating. Larger keys take a few seconds.";
    error.write("");
    try {
      const keys = await crypto.subtle.generateKey(
        {
          name: "RSASSA-PKCS1-v1_5",
          modulusLength: Number(size.value),
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["sign", "verify"]
      );
      const spki = await crypto.subtle.exportKey("spki", keys.publicKey);
      const pkcs8 = await crypto.subtle.exportKey("pkcs8", keys.privateKey);
      if (current !== token) return;
      pair = {
        bits: Number(size.value),
        publicPem: toPem("PUBLIC KEY", spki),
        privatePem: toPem("PRIVATE KEY", pkcs8),
      };
      publicOut.write(pair.publicPem);
      privateOut.write(pair.privatePem);
      summary.textContent = `${pair.bits}-bit RSA · SHA-256 · exponent 65537 · PKCS#8 private, SPKI public`;
      sync();
      toast("Key pair ready");
    } catch (caught) {
      if (current !== token) return;
      error.write(caught?.message || "The browser could not generate this key.");
    } finally {
      busy = false;
      generateButton.disabled = false;
    }
  }

  size.addEventListener("change", () => {
    if (pair) {
      pair = null;
      publicOut.write("");
      privateOut.write("");
      summary.textContent = "";
      sync();
    }
  });
  showPrivate.input.addEventListener("change", sync);

  sync();

  const shell = toolcard({
    body: bench(
      stack(
        panel("Key size", size, "2048 is the common floor. 4096 is slower and rarely needed."),
        showPrivate,
        error,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "Generated with the browser's RSA implementation. The keys exist only in this page; closing it discards them. For production, generate keys on a machine you control.")
      ),
      stack(summary, empty, publicBox, privateBox)
    ),
    foot: actions(downloadPublic, downloadPrivate, copyPublic, copyPrivate, generateButton),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
