// ============================================================
// mevebu — tool implementations (lazy-loaded per tool)
// Tiap fungsi mengembalikan { mount(container), unmount?() }
// Tambah tool baru: daftarkan id-nya di IMPLEMENTATIONS.
// ============================================================

const IMPLEMENTATIONS = {};
const loading = new Map();

export function registerTool(id, loader) {
  IMPLEMENTATIONS[id] = loader;
}

/** Resolve a tool module lazily; caches in-flight + done promises. */
export function loadToolImpl(id) {
  if (!IMPLEMENTATIONS[id]) return Promise.resolve(null);
  if (!loading.has(id)) {
    loading.set(
      id,
      IMPLEMENTATIONS[id]()
        .then((m) => m.default ?? m)
        .catch((err) => {
          console.error(`[mevebu] failed to load tool "${id}"`, err);
          loading.delete(id);
          return null;
        })
    );
  }
  return loading.get(id);
}

// ---------- registrations (dynamic import keeps initial bundle small) ----------
registerTool("spin-wheel", () => import("./spin-wheel.js"));
registerTool("name-picker", () => import("./name-picker.js"));
registerTool("coin-flip", () => import("./coin-flip.js"));
registerTool("dice-roller", () => import("./dice-roller.js"));
registerTool("jwt-generator", () => import("./jwt-generator.js"));
registerTool("uuid-generator", () => import("./uuid-generator.js"));
registerTool("hash-generator", () => import("./hash-generator.js"));
registerTool("color-converter", () => import("./color-converter.js"));
registerTool("base64", () => import("./base64.js"));
registerTool("url-encoder", () => import("./url-encoder.js"));
registerTool("lorem-ipsum", () => import("./lorem-ipsum.js"));
registerTool("case-converter", () => import("./case-converter.js"));
registerTool("password-generator", () => import("./password-generator.js"));
registerTool("fake-data", () => import("./fake-data.js"));
registerTool("qr-generator", () => import("./qr-generator.js"));
registerTool("qr-scanner", () => import("./qr-scanner.js"));
