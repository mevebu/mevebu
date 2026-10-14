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
registerTool("spin-wheel", () => import("./implementations/spin-wheel.js"));
registerTool("name-picker", () => import("./implementations/name-picker.js"));
registerTool("coin-flip", () => import("./implementations/coin-flip.js"));
registerTool("dice-roller", () => import("./implementations/dice-roller.js"));
registerTool("jwt-generator", () => import("./implementations/jwt-generator.js"));
registerTool("uuid-generator", () => import("./implementations/uuid-generator.js"));
registerTool("hash-generator", () => import("./implementations/hash-generator.js"));
registerTool("color-converter", () => import("./implementations/color-converter.js"));
registerTool("base64", () => import("./implementations/base64.js"));
registerTool("url-encoder", () => import("./implementations/url-encoder.js"));
registerTool("lorem-ipsum", () => import("./implementations/lorem-ipsum.js"));
registerTool("case-converter", () => import("./implementations/case-converter.js"));
registerTool("password-generator", () => import("./implementations/password-generator.js"));
registerTool("fake-data", () => import("./implementations/fake-data.js"));
registerTool("qr-generator", () => import("./implementations/qr-generator.js"));
registerTool("qr-scanner", () => import("./implementations/qr-scanner.js"));
