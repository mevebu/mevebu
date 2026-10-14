// ============================================================
// Minimal QR Code encoder — byte mode, versions 1-10, EC level M
// (tables from ISO/IEC 18004). API: qrcode(typeNumber, ecl) ->
// addData/make/getModuleCount/isDark/createSVGTag
// ============================================================

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const gmul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

// [totalCodewords, ecCodewordsPerBlock, [nBlocksG1, dataCWG1, nBlocksG2, dataCWG2]] (EC level M)
const VER_M = {
  1: [16, 10, [1, 6, 0, 0]],
  2: [28, 16, [1, 12, 0, 0]],
  3: [44, 26, [1, 18, 0, 0]],
  4: [64, 18, [2, 14, 0, 0]],
  5: [86, 24, [2, 18, 0, 0]],
  6: [116, 16, [4, 16, 0, 0]],
  7: [140, 18, [2, 22, 2, 23]],
  8: [168, 22, [2, 32, 2, 33]],
  9: [196, 22, [9, 21, 1, 22]],
  10: [248, 26, [15, 24, 5, 25]],
};
const ALIGN_POS = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
const EC_LEVEL_BITS = { L: 0b00, M: 0b01, Q: 0b11, H: 0b10 };

function rsDivisor(degree) {
  const result = new Uint8Array(degree + 1);
  result[degree] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j <= i; j++) {
      result[j] = gmul(result[j], root);
      if (j + 1 <= degree) result[j + 1] ^= result[j];
    }
    root = gmul(root, 2);
  }
  return result;
}
function rsEncode(data, ecLen) {
  const divisor = rsDivisor(ecLen);
  const remainder = new Uint8Array(ecLen);
  for (const b of data) {
    const factor = b ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[ecLen - 1] = 0;
    for (let i = 0; i < ecLen; i++) remainder[i] ^= gmul(divisor[i], factor);
  }
  return remainder;
}

class BitBuffer {
  constructor() { this.bits = []; }
  put(num, len) { for (let i = len - 1; i >= 0; i--) this.bits.push((num >>> i) & 1); }
  get length() { return this.bits.length; }
  toBytes() {
    while (this.bits.length % 8) this.bits.push(0);
    const out = new Uint8Array(this.bits.length / 8);
    this.bits.forEach((b, i) => { out[i >> 3] |= b << (7 - (i & 7)); });
    return out;
  }
}

function applyMask(mask, i, j) {
  switch (mask) {
    case 0: return (i + j) % 2 === 0;
    case 1: return i % 2 === 0;
    case 2: return j % 3 === 0;
    case 3: return (i + j) % 3 === 0;
    case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
    case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
    case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
    case 7: return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0;
  }
  return false;
}
function getFormatBCH(mask, ecl) {
  const data = (EC_LEVEL_BITS[ecl] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const out = [];
  for (let i = 14; i >= 0; i--) out.push((bits >>> i) & 1);
  return out;
}
function getVersionBCH(ver) {
  let rem = ver;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  return (ver << 12) | rem;
}
function drawFormatInfo(m, size, mask, ecl) {
  const bits = getFormatBCH(mask, ecl);
  const coordsA = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  coordsA.forEach(([r, c], i) => { m[r][c] = bits[i] === 1; });
  const coordsB = [];
  for (let i = 0; i < 7; i++) coordsB.push([size - 1 - i, 8]);
  for (let i = 0; i < 8; i++) coordsB.push([8, size - 8 + i]);
  coordsB.forEach(([r, c], i) => { m[r][c] = bits[i] === 1; });
  m[size - 8][8] = true; // dark module
}
function penalty(m, size) {
  let p = 0;
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (m[r][c] === m[r][c - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p += 1; }
      else run = 1;
    }
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (m[r][c] === m[r - 1][c]) { run++; if (run === 5) p += 3; else if (run > 5) p += 1; }
      else run = 1;
    }
  }
  for (let r = 0; r < size - 1; r++)
    for (let c = 0; c < size - 1; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) p += 3;
    }
  const pat1 = [true, false, true, true, true, false, true, false, false, false, false];
  const check = (line) => {
    outer: for (let i = 0; i + 11 <= line.length; i++) {
      for (let j = 0; j < 11; j++) if (line[i + j] !== pat1[j]) continue outer;
      p += 40;
    }
  };
  for (let r = 0; r < size; r++) check(m[r]);
  for (let c = 0; c < size; c++) check(Array.from({ length: size }, (_, r) => m[r][c]));
  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (m[r][c]) dark++;
  const pct = (dark * 100) / (size * size);
  p += Math.floor(Math.abs(pct - 50) / 5) * 10;
  return p;
}

export function qrcode(typeNumber, errorCorrectionLevel = "M") {
  const ecl = (errorCorrectionLevel || "M").toUpperCase();
  const api = {
    _bytes: new Uint8Array(),
    _size: 0,
    _modules: [],
    addData(text) { api._bytes = new TextEncoder().encode(text); return api; },
    make() {
      const bytes = api._bytes;
      let ver = typeNumber && typeNumber > 0 ? typeNumber : 1;
      for (; ver <= 10; ver++) {
        const blocks = VER_M[ver][2];
        const dataCW = blocks[0] * blocks[1] + blocks[2] * blocks[3];
        const ccBits = ver <= 9 ? 8 : 16;
        if (4 + ccBits + bytes.length * 8 <= dataCW * 8) break;
      }
      if (ver > 10) throw new Error("Data too long — max supported is version 10 (~213 bytes).");
      const [, ecPerBlock, blocks] = VER_M[ver];
      const [n1, d1, n2, d2] = blocks;
      const dataCW = n1 * d1 + n2 * d2;

      const bb = new BitBuffer();
      bb.put(0b0100, 4);
      bb.put(bytes.length, ver <= 9 ? 8 : 16);
      for (const b of bytes) bb.put(b, 8);
      bb.put(0, Math.min(4, dataCW * 8 - bb.length));
      while (bb.length % 8) bb.bits.push(0);
      const cw = Array.from(bb.toBytes());
      const PAD = [0xec, 0x11];
      let pi = 0;
      while (cw.length < dataCW) cw.push(PAD[pi++ % 2]);

      const dataBlocks = [], ecBlocks = [];
      let pos = 0;
      const sizes = [...Array(n1).fill(d1), ...Array(n2).fill(d2)];
      for (const s of sizes) {
        const db = cw.slice(pos, pos + s);
        pos += s;
        dataBlocks.push(db);
        ecBlocks.push(Array.from(rsEncode(Uint8Array.from(db), ecPerBlock)));
      }
      const final = [];
      for (let i = 0; i < Math.max(d1, d2); i++)
        for (const b of dataBlocks) if (i < b.length) final.push(b[i]);
      for (let i = 0; i < ecPerBlock; i++)
        for (const b of ecBlocks) final.push(b[i]);

      buildMatrix(api, ver, ecl, Uint8Array.from(final));
      return api;
    },
    getModuleCount() { return api._size; },
    isDark(row, col) { return api._modules[row][col]; },
    createSVGTag(cellSize = 5) {
      const n = api._size, dim = (n + 8) * cellSize;
      let rects = "";
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
          if (api._modules[r][c]) rects += `<rect x="${(c + 4) * cellSize}" y="${(r + 4) * cellSize}" width="${cellSize}" height="${cellSize}"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}"><rect width="${dim}" height="${dim}" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
    },
  };
  return api;
}

function buildMatrix(api, ver, ecl, codewords) {
  const size = ver * 4 + 17;
  api._size = size;
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));
  const setF = (r, c, v) => { m[r][c] = v; reserved[r][c] = true; };

  const finder = (r0, c0) => {
    for (let dr = -1; dr <= 7; dr++)
      for (let dc = -1; dc <= 7; dc++) {
        const r = r0 + dr, c = c0 + dc;
        if (r < 0 || c < 0 || r >= size || c >= size) continue;
        const inRing = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) || (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6));
        const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setF(r, c, inRing || inCore);
      }
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }

  const ap = ALIGN_POS[ver];
  for (const r of ap)
    for (const c of ap) {
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++)
          setF(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }

  // reserve format info zones
  for (let i = 0; i <= 8; i++) { if (!reserved[8][i]) setF(8, i, false); if (!reserved[i][8]) setF(i, 8, false); }
  setF(8, size - 8, false);
  for (let i = 0; i < 8; i++) { setF(8, size - 1 - i, false); setF(size - 1 - i, 8, false); }
  if (ver >= 7) {
    const vbits = getVersionBCH(ver);
    for (let i = 0; i < 18; i++) {
      const bit = ((vbits >> i) & 1) === 1;
      setF(Math.floor(i / 3) + size - 11, i % 3, bit);
      setF(i % 3, Math.floor(i / 3) + size - 11, bit);
    }
  }

  // data placement (zigzag, skipping column 6)
  const allBits = [];
  for (const b of codewords) for (let i = 7; i >= 0; i--) allBits.push((b >> i) & 1);
  let reservedCount = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (reserved[r][c]) reservedCount++;
  while (allBits.length < size * size - reservedCount) allBits.push(0);

  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (!reserved[r][c]) m[r][c] = allBits[bitIndex++] === 1;
      }
    }
  }

  // pick best mask by penalty
  let bestPenalty = Infinity, bestCopy = null;
  for (let mask = 0; mask < 8; mask++) {
    const mm = m.map((row) => row.slice());
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (!reserved[r][c] && applyMask(mask, r, c)) mm[r][c] = !mm[r][c];
    drawFormatInfo(mm, size, mask, ecl);
    const p = penalty(mm, size);
    if (p < bestPenalty) { bestPenalty = p; bestCopy = mm; }
  }
  api._modules = bestCopy;
}

export default qrcode;
