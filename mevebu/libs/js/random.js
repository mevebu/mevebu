// A small seeded generator shared by the data tools. A seed is worth writing
// down: the same one always produces the same file, so a fixture can be rebuilt
// after it drifts.

/** Mulberry32. Fast, deterministic, and good enough for fixtures. */
export function seeded(seed) {
  let state = hashSeed(String(seed)) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

export function shuffle(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A number from a normal distribution, by Box-Muller. */
export function gaussian(random, mean = 0, deviation = 1) {
  const u = Math.max(1e-9, random());
  const v = random();
  return mean + deviation * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function uuid(random) {
  const hex = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) out += "-";
    out += i === 12 ? "4" : hex[Math.floor(random() * 16)];
  }
  return out;
}
