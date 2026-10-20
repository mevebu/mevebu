// TOTP, the six digit code an authenticator app shows. RFC 6238 over RFC 4226,
// with HMAC from Web Crypto, so the secret never leaves the tab.
//
// The secret is Base32, which is why this file carries a decoder: every
// `otpauth://` URI and every authenticator export uses that alphabet.

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Base32 to bytes. Case insensitive, spaces and padding ignored. */
export function base32Decode(input) {
  const clean = String(input).toUpperCase().replace(/[\s=-]/g, "");
  if (!clean) throw new Error("The secret is empty.");
  let bits = 0;
  let value = 0;
  const out = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error(`"${char}" is not a Base32 character.`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  if (!out.length) throw new Error("That secret decodes to no bytes.");
  return new Uint8Array(out);
}

/** Parses an `otpauth://totp/...` URI into its parts, or returns null. */
export function parseOtpUri(text) {
  const clean = String(text).trim();
  if (!clean.toLowerCase().startsWith("otpauth://")) return null;
  let url;
  try {
    url = new URL(clean);
  } catch {
    throw new Error("That otpauth URI is not a valid URL.");
  }
  const params = url.searchParams;
  const label = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  return {
    type: (url.hostname || "totp").toLowerCase(),
    label,
    issuer: params.get("issuer") ?? "",
    secret: params.get("secret") ?? "",
    digits: Number(params.get("digits") ?? 6),
    period: Number(params.get("period") ?? 30),
    algorithm: (params.get("algorithm") ?? "SHA1").toUpperCase().replace("-", ""),
  };
}

const HASH = { SHA1: "SHA-1", SHA256: "SHA-256", SHA512: "SHA-512" };

/** HOTP for one counter value, as a zero padded string. */
export async function hotp(secret, counter, { digits = 6, algorithm = "SHA1" } = {}) {
  const hash = HASH[algorithm] ?? "SHA-1";
  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash },
    false,
    ["sign"]
  );
  // The counter is an 8 byte big endian integer. JavaScript numbers lose
  // precision above 2^53, so the high word is written separately.
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, buffer));

  // Dynamic truncation, RFC 4226 section 5.4.
  const offset = signature[signature.length - 1] & 0x0f;
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    (signature[offset + 1] << 16) |
    (signature[offset + 2] << 8) |
    signature[offset + 3];
  return String(binary % 10 ** digits).padStart(digits, "0");
}

/** The TOTP code for a timestamp in milliseconds. */
export async function totp(secret, { digits = 6, period = 30, algorithm = "SHA1", timestamp = Date.now() } = {}) {
  const counter = Math.floor(timestamp / 1000 / period);
  return hotp(secret, counter, { digits, algorithm });
}

/** Seconds left in the current step, and how far through it we are. */
export function stepProgress(period = 30, timestamp = Date.now()) {
  const seconds = timestamp / 1000;
  const left = period - (seconds % period);
  return { left, ratio: left / period };
}

/** The secret as spaced groups, which is how authenticator apps show it. */
export function formatSecret(text) {
  return String(text).toUpperCase().replace(/[^A-Z2-7]/g, "").replace(/(.{4})/g, "$1 ").trim();
}

/** A random Base32 secret of the given byte length. */
export function randomSecret(bytes = 20) {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of raw) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}
