// ============================================================
// mevebu — tool registry (single source of truth)
// Tambah tool baru = tambah objek di array TOOLS. Selesai.
// Route otomatis: #/{category}/{id}
// Icon name harus valid lucide (dipakai via data-lucide / createElementNS).
// ============================================================

export const CATEGORIES = [
  { id: "randomizers", label: "Randomizers", icon: "dices" },
  { id: "developers", label: "Developer", icon: "code-2" },
  { id: "encoders", label: "Encoders & Converters", icon: "binary" },
  { id: "text", label: "Text", icon: "type" },
  { id: "generators", label: "Generators", icon: "sparkles" },
  { id: "qrcodes", label: "QR Codes", icon: "qr-code" },
];

export const TOOLS = [
  // ---------- Randomizers ----------
  {
    id: "spin-wheel",
    category: "randomizers",
    name: "Spin the Wheel",
    icon: "circle-dashed",
    tagline: "Add options, spin the wheel, let fate decide.",
    description:
      "A customizable spinning wheel for random picks. Perfect for giveaways, decision-making in groups, or classroom raffles — all locally in your browser.",
    howTo: [
      "Type one option per line in the textarea.",
      "Press “Spin” and wait for the pointer to stop.",
      "The highlighted slice is your winner; results history is listed below.",
    ],
    example: "Alice\nBob\nCharlie\nDiana\n→ lands on: Charlie",
    faq: [
      { q: "Is the result truly random?", a: "Yes — it uses the browser's crypto-strength random number generator, not a predictable pseudo-random sequence." },
      { q: "Can I save my wheel?", a: "Your options are kept in the page only. Copy the textarea content if you want to reuse it later." },
    ],
  },
  {
    id: "name-picker",
    category: "randomizers",
    name: "Pick a Random Name",
    icon: "users",
    tagline: "Paste a list, draw one (or more) names at random.",
    description:
      "Selects one or more random entries from any list — names, emails, IDs. Useful for raffles, choosing who goes first, or assigning tasks fairly.",
    howTo: [
      "Paste your list, one entry per line (or separated by commas).",
      "Set how many winners you need.",
      "Click “Draw”. Duplicates can be excluded with one toggle.",
    ],
    example: "Input: 12 names · Winners: 3 → Ana, Fajar, Marco",
    faq: [
      { q: "Does order matter?", a: "No. Every entry has an equal chance regardless of position." },
      { q: "What counts as one entry?", a: "One non-empty line, or one comma-separated token if you use commas." },
    ],
  },
  {
    id: "coin-flip",
    category: "randomizers",
    name: "Coin Flip",
    icon: "coins",
    tagline: "Heads or tails — instant, provably fair-ish, offline.",
    description:
      "Classic two-way random choice with a streak counter. Great for quick tie-breakers without leaving the page.",
    howTo: ["Click “Flip”.","Check the running tally of heads vs tails.","Reset anytime with the small reset link."],
    example: "Flip 10 times → 6 heads, 4 tails",
    faq: [{ q: "Can it land on its edge?", a: "No. Only two outcomes exist, each with 50% probability." }],
  },
  {
    id: "dice-roller",
    category: "randomizers",
    name: "Dice Roller",
    icon: "dices",
    tagline: "Roll d4–d20, or several dice at once.",
    description:
      "Tabletop-style dice roller supporting common polyhedral dice (d4, d6, d8, d10, d12, d20) with multi-roll and total sum.",
    howTo: ["Choose the die type.","Set the number of dice to roll.","Click “Roll” and read individual values plus the total."],
    example: "3 × d6 → [4, 1, 6] · total 11",
    faq: [{ q: "Is there a modifier like +2?", a: "Not yet — planned for a later release. For now just add it yourself 🙂" }],
  },

  // ---------- Developer ----------
  {
    id: "jwt-generator",
    category: "developers",
    name: "JWT Generator",
    icon: "key-round",
    tagline: "Build signed JSON Web Tokens locally (HS256).",
    description:
      "Create a JWT from a header, payload and secret — entirely in your browser using the Web Crypto API. Nothing is sent anywhere, so you can safely test with real secrets.",
    howTo: [
      "Edit the JSON payload (claims like sub, exp, role).",
      "Enter your signing secret and pick HS256.",
      "Click “Sign” — copy the resulting token.",
    ],
    example: 'Header: {"alg":"HS256","typ":"JWT"}\nPayload: {"sub":"42","role":"admin"}\nToken: eyJhbGciOiJIUzI1NiIs…',
    faq: [
      { q: "Which algorithms are supported?", a: "HS256 today (HMAC-SHA256). RS256 support is on the roadmap." },
      { q: "Is my secret safe?", a: "The token is generated in your browser tab. There is no network request at any point." },
    ],
  },
  {
    id: "uuid-generator",
    category: "developers",
    name: "UUID Generator",
    icon: "fingerprint",
    tagline: "Version 4 UUIDs, one or one thousand.",
    description:
      "Generates RFC-4122 version 4 UUIDs using crypto.randomUUID(). Bulk-generate, copy all, or export as a JSON array.",
    howTo: ["Set how many UUIDs you need.","Click “Generate”.","Copy individually or use “Copy all”."],
    example: "3b24a9e1-7c0f-4a2d-9e5b-1f6d2c8a4b70",
    faq: [{ q: "Are these collision-safe?", a: "v4 UUIDs have 122 random bits — practically unique for any workload you'll generate in a browser." }],
  },
  {
    id: "hash-generator",
    category: "developers",
    name: "Hash Generator",
    icon: "shield",
    tagline: "SHA-1 / SHA-256 / SHA-512 digests of any text.",
    description:
      "Compute cryptographic hashes instantly via Web Crypto. Handy for checksums, ETags, cache keys, or verifying file integrity strings.",
    howTo: ["Paste or type your text.","Pick an algorithm from the chips.","Compare or copy the hex digest."],
    example: '"mevebu" → sha256 → 1d5b8e… (64 hex chars)',
    faq: [{ q: "Can I hash files?", a: "Drag & drop file hashing is planned; v1 covers text input." }],
  },
  {
    id: "color-converter",
    category: "developers",
    name: "Color Converter",
    icon: "palette",
    tagline: "HEX ⇄ RGB ⇄ HSL, with a live preview swatch.",
    description:
      "Convert color formats back and forth and grab ready-to-paste CSS snippets. Includes contrast hint against white and black.",
    howTo: ["Type a hex value or use the native picker.","Read the RGB / HSL equivalents.","Click any format to copy it."],
    example: "#F5B942 → rgb(245,185,66) → hsl(42, 90%, 61%)",
    faq: [{ q: "Does it support alpha?", a: "RGBA input like rgba(245,185,66,.5) is parsed and shown, and copied back with alpha." }],
  },

  // ---------- Encoders ----------
  {
    id: "base64",
    category: "encoders",
    name: "Base64 Encode / Decode",
    icon: "binary",
    tagline: "Turn text into Base64 and back, live.",
    description:
      "Instant two-way Base64 conversion with UTF-8 safety (emojis included). Great for data URIs, basic-auth strings, or debugging payloads.",
    howTo: ["Type in the top box to encode.","Or paste Base64 in the bottom box to decode.","Use the swap button to flip direction."],
    example: '"hello mevebu" → aGVsbG8gbWV2ZWJ1',
    faq: [{ q: "Why does my decoded text look wrong?", a: "It probably wasn't valid Base64, or it encoded binary (not text) data. The tool will flag invalid input." }],
  },
  {
    id: "url-encoder",
    category: "encoders",
    name: "URL Encode / Decode",
    icon: "link",
    tagline: "Percent-encoding for query params and paths.",
    description:
      "Apply or remove percent-encoding (encodeURIComponent semantics) so spaces, symbols and unicode survive a trip through a URL.",
    howTo: ["Paste a URL or a value.","Toggle Encode / Decode.","Copy the result."],
    example: '"q=hello world&lang=id" → q%3Dhello%20world%26lang%3Did',
    faq: [{ q: "Difference between encodeURI and encodeURIComponent?", a: "This tool uses encodeURIComponent (stricter) — ideal for single parameter values, not whole URLs." }],
  },

  // ---------- Text ----------
  {
    id: "lorem-ipsum",
    category: "text",
    name: "Lorem Ipsum",
    icon: "paragraph",
    tagline: "Placeholder paragraphs, sentences or words.",
    description:
      "Generate classic lorem ipsum filler at the granularity you need — words, sentences or paragraphs — with a start-option for realistic layouts.",
    howTo: ["Choose unit (words / sentences / paragraphs) and amount.","Optionally enable “start with ‘Lorem ipsum…””.","Copy with one click."],
    example: "Lorem ipsum dolor sit amet, consectetur adipiscing elit…",
    faq: [{ q: "Can I get other flavors?", a: "Corporate-speak and pirate-ipsum modes are joke features on the backlog 😄" }],
  },
  {
    id: "case-converter",
    category: "text",
    name: "Case Converter",
    icon: "case-sensitive",
    tagline: "UPPER, lower, Title, camelCase, snake_case & more.",
    description:
      "Reformat any text into 10+ letter cases — handy for variable naming, headings, or cleaning pasted content.",
    howTo: ["Paste your text.","Click the target case chip.","Copy the transformed output."],
    example: '"hello world" → helloWorld / hello_world / Hello World / HELLO WORLD',
    faq: [{ q: "How does it detect word boundaries?", a: "Spaces, dashes, underscores and camelCase humps are treated as boundaries." }],
  },

  // ---------- Generators ----------
  {
    id: "password-generator",
    category: "generators",
    name: "Password Generator",
    icon: "lock-keyhole",
    tagline: "Strong random passwords with a live strength meter.",
    description:
      "Crypto-strength passwords built from character sets you control (letters, digits, symbols), with length slider and entropy estimate.",
    howTo: ["Set length and tick the character sets you allow.","Click “Generate”.","Copy — it never leaves your tab until you say so."],
    example: "Tr0ub4dor-style → k7#Qz!9pLm2$wRxe",
    faq: [{ q: "Is it really offline?", a: "Yes. Generation happens in-process via window.crypto — no API, no analytics." }],
  },
  {
    id: "fake-data",
    category: "generators",
    name: "Fake Data Generator",
    icon: "contact",
    tagline: "Mock users, addresses and cards for prototyping.",
    description:
      "Produce batches of realistic-looking fake records (JSON, CSV or table view) to seed demos, tests and mockups without touching real PII.",
    howTo: ["Pick record count and fields.","Choose output format (JSON / CSV).","Copy or download the file."],
    example: '[{"name":"Lina Ortega","email":"lina@example.test","country":"ES"}, …]',
    faq: [{ q: "Are these real people?", a: "Absolutely not. Names come from bundled word lists; emails always use example.test." }],
  },

  // ---------- QR ----------
  {
    id: "qr-generator",
    category: "qrcodes",
    name: "QR Code Generator",
    icon: "qr-code",
    tagline: "Any text or URL → downloadable QR (PNG/SVG).",
    description:
      "Render QR codes locally with adjustable size and error-correction level. Export as PNG for chat or SVG for print.",
    howTo: ["Type or paste the content (URL, Wi-Fi string, text).","Set pixel size and ECC level (M is a good default).","Download PNG or SVG."],
    example: "https://mevebu.app/#/qrcodes/qr-generator → ▦ scanned opens this page",
    faq: [{ q: "Do generated QR codes expire?", a: "Never — the code is static once printed. Only shortener-based URLs can rot." }],
  },
  {
    id: "qr-scanner",
    category: "qrcodes",
    name: "QR Code Scanner",
    icon: "scan-line",
    tagline: "Scan from camera or upload an image — nothing uploaded.",
    description:
      "Read QR codes using your webcam or by dropping an image file. Decoding runs fully client-side; the camera feed never leaves the device.",
    howTo: ["Allow camera access, or drag an image onto the drop zone.","Point the camera until a code is detected.","The decoded text appears with copy / open actions."],
    example: "Detected: WIFI:T:WPA;S:MyNetwork;P:s3cret;;",
    faq: [
      { q: "Does it send my camera stream anywhere?", a: "No. getUserMedia frames are processed in-tab and immediately discarded." },
      { q: "It won't detect my code?", a: "Try better lighting, move closer, or upload a screenshot of the QR instead." },
    ],
  },
];

// helper ------------------------------------------------------------
export function getTool(id) {
  return TOOLS.find((t) => t.id === id);
}

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id);
}

export function toolsByCategory(catId) {
  return TOOLS.filter((t) => t.category === catId);
}
