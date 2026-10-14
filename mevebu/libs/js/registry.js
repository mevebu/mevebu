// The catalog. One entry per tool and one per category drives every page:
// the index rows, the category pages, search, the breadcrumbs, the bench head
// and the "more in this category" list. Adding a tool is a matter of adding
// one object here plus one file in ./tools/.

export const CATEGORIES = [
  { id: "random", name: "Random", icon: "shuffle" },
  { id: "security", name: "Passwords and keys", icon: "shield-check" },
  { id: "developer", name: "Developer", icon: "terminal" },
  { id: "convert", name: "Convert", icon: "repeat" },
  { id: "text", name: "Text and data", icon: "file-text" },
  { id: "qr", name: "QR codes", icon: "qr-code" },
];

// `note` is the one line in an index row. `about` is the one sentence under
// the title on the tool page. `tutorial` is shown in the help modal and has a
// one-line intro plus a short list of steps. Keep steps concrete.
export const TOOLS = [
  {
    id: "spin-wheel",
    category: "random",
    name: "Spin the Wheel",
    icon: "circle-dashed",
    note: "Let the wheel pick from your options.",
    about: "Type your options, press Spin, and the wheel chooses one.",
    tutorial: {
      intro: "Add one option per line. The wheel picks one at random when you spin.",
      steps: [
        "Type your options in the field on the left, one per line.",
        "Press Spin. The wheel eases to a stop on one entry.",
        "Each pick is added to the history strip below. Press Clear past picks to reset.",
      ],
    },
    keywords: "random picker chooser decide raffle",
    load: () => import("./tools/spin-wheel.js"),
  },
  {
    id: "name-picker",
    category: "random",
    name: "Name Picker",
    icon: "users",
    note: "Draw one name or several from a list.",
    about: "Paste a list, set how many you need, and draw.",
    tutorial: {
      intro: "Paste a list of names and draw one or many at a time.",
      steps: [
        "Paste your list, one entry per line.",
        "Set how many to draw. Toggle No repeats if you want unique picks.",
        "The draw updates as you edit. Press Draw for a fresh result, then Copy.",
      ],
    },
    keywords: "random draw winner lottery team",
    load: () => import("./tools/name-picker.js"),
  },
  {
    id: "coin-flip",
    category: "random",
    name: "Coin Flip",
    icon: "coins",
    note: "Heads or tails, with a running count.",
    about: "Flip as many times as you like. The tally keeps the score.",
    tutorial: {
      intro: "Flip a fair coin. The tally remembers your count across visits.",
      steps: [
        "Press Flip. The coin spins and lands on heads or tails.",
        "The result lands in the field below the coin.",
        "The tally updates and persists. Press Reset the count to clear it.",
      ],
    },
    keywords: "random toss decide heads tails",
    load: () => import("./tools/coin-flip.js"),
  },

  {
    id: "password-generator",
    category: "security",
    name: "Password Generator",
    icon: "key-round",
    note: "Make a random password and copy it.",
    about: "Set the length and the character groups, then copy the result.",
    tutorial: {
      intro: "Generate a random password from the character groups you choose.",
      steps: [
        "Drag the length slider. Pick which groups to use, at least one is required.",
        "The password and its bits reading update as you change any setting.",
        "Press Copy to put the password on your clipboard.",
      ],
    },
    keywords: "secret passphrase strong random secure",
    load: () => import("./tools/password-generator.js"),
  },
  {
    id: "jwt-generator",
    category: "security",
    name: "JWT Generator",
    icon: "signature",
    note: "Sign a JSON Web Token with your secret.",
    about: "Signs HS256 with the Web Crypto API. HS256 is the only algorithm here.",
    tutorial: {
      intro: "Sign a JSON Web Token locally with HS256. The secret never leaves this tab.",
      steps: [
        "Edit the header and payload JSON if you need to. Set a secret.",
        "The token re-signs as you type, with a readable summary of the payload.",
        "Press Copy token to put the signed token on your clipboard.",
      ],
    },
    keywords: "token json web bearer auth header payload",
    load: () => import("./tools/jwt-generator.js"),
  },
  {
    id: "hash-generator",
    category: "security",
    name: "Hash Generator",
    icon: "hash",
    note: "Get the SHA hash of any text.",
    about: "SHA-1, SHA-256, SHA-384 and SHA-512 of text you paste.",
    tutorial: {
      intro: "Hash text with the SHA family. Hashing happens in this tab.",
      steps: [
        "Type or paste text on the left.",
        "Pick an algorithm with the chips (1 to 512).",
        "The hash updates as you type. Press Copy hash to copy the result.",
      ],
    },
    keywords: "digest checksum sha sha256 sha512 fingerprint",
    load: () => import("./tools/hash-generator.js"),
  },

  {
    id: "uuid-generator",
    category: "developer",
    name: "UUID Generator",
    icon: "fingerprint-pattern",
    note: "Generate UUIDs, one or a thousand.",
    about: "Version 4 UUIDs from the browser random source.",
    tutorial: {
      intro: "Generate version 4 UUIDs. Copy as a list, JSON, or save as a file.",
      steps: [
        "Set how many UUIDs to generate, between 1 and 1000.",
        "Toggle Uppercase if you want them in caps. The list updates as you change a setting.",
        "Use Copy all, Copy JSON, or Save .txt on the right.",
      ],
    },
    keywords: "guid unique id v4 identifier",
    load: () => import("./tools/uuid-generator.js"),
  },
  {
    id: "color-converter",
    category: "developer",
    name: "Color Converter",
    icon: "palette",
    note: "Convert between hex, rgb and hsl.",
    about: "Paste a color in any format, or pick one, and read the other two.",
    tutorial: {
      intro: "Convert a color between hex, rgb, and hsl. The swatch and contrast reading update live.",
      steps: [
        "Pick a color with the picker on the left, or type a hex, rgb, or hsl value.",
        "The other formats, the swatch, and a contrast reading appear on the right.",
        "Click any of the four readouts to copy that value.",
      ],
    },
    keywords: "hex rgb hsl css palette design token",
    load: () => import("./tools/color-converter.js"),
  },

  {
    id: "base64",
    category: "convert",
    name: "Base64",
    icon: "binary",
    note: "Turn text into Base64 and back.",
    about: "Keeps emoji and other non-Latin characters intact.",
    tutorial: {
      intro: "Encode text to Base64 and decode Base64 back to text. Both sides update live.",
      steps: [
        "Type or paste on either side. The other side updates as you type.",
        "Edit the Base64 side directly to decode. Invalid Base64 shows an error.",
        "Use Copy Base64 or Copy text on the right of each panel.",
      ],
    },
    keywords: "encode decode binary data uri atob btoa",
    load: () => import("./tools/base64.js"),
  },
  {
    id: "url-encoder",
    category: "convert",
    name: "URL Encoder",
    icon: "link",
    note: "Percent-encode or decode a value.",
    about: "Follows the same rules as encodeURIComponent.",
    tutorial: {
      intro: "Percent-encode a single value following the encodeURIComponent rules.",
      steps: [
        "Pick Encode or Decode with the chips.",
        "Type or paste your value in the Input field. The Result updates live.",
        "Use Use result as input to feed the result back through, or Copy result.",
      ],
    },
    keywords: "percent encoding uri query param escape",
    load: () => import("./tools/url-encoder.js"),
  },
  {
    id: "case-converter",
    category: "convert",
    name: "Case Converter",
    icon: "case-sensitive",
    note: "Change text between letter cases.",
    about: "camelCase, snake_case, kebab-case, Title Case and more.",
    tutorial: {
      intro: "See every common letter case at once. Click a row to copy that case.",
      steps: [
        "Type or paste text in the field at the top.",
        "Each row shows a different case. The current one highlights.",
        "Click any row to copy that case. Tabs and punctuation are kept.",
      ],
    },
    keywords: "uppercase lowercase camel snake kebab pascal title",
    load: () => import("./tools/case-converter.js"),
  },

  {
    id: "lorem-ipsum",
    category: "text",
    name: "Lorem Ipsum",
    icon: "pilcrow",
    note: "Placeholder text in paragraphs or words.",
    about: "Use the usual opening sentence, or start anywhere in the text.",
    tutorial: {
      intro: "Generate placeholder text by the word, sentence, or paragraph.",
      steps: [
        "Pick a unit: Words, Sentences, or Paragraphs.",
        "Set how many. Toggle the classic opening if you want the usual first sentence.",
        "Press Make new text to regenerate. Copy with the Copy button.",
      ],
    },
    keywords: "filler dummy placeholder mockup text words paragraphs",
    load: () => import("./tools/lorem-ipsum.js"),
  },
  {
    id: "fake-data",
    category: "text",
    name: "Test Data",
    icon: "database",
    note: "Make sample records for testing.",
    about: "Fake people and addresses as JSON, CSV or a table.",
    tutorial: {
      intro: "Generate fake people and addresses for testing. Names and places come from bundled lists.",
      steps: [
        "Set how many records to generate, between 1 and 200.",
        "Pick a format: JSON, CSV, or Table.",
        "Press Make new set to regenerate. Copy or Download the result.",
      ],
    },
    keywords: "mock seed fixture json csv lorem records users",
    load: () => import("./tools/fake-data.js"),
  },

  {
    id: "qr-generator",
    category: "qr",
    name: "QR Generator",
    icon: "qr-code",
    note: "Make a QR code from text or a link.",
    about: "Download PNG for chat or SVG for print.",
    tutorial: {
      intro: "Generate a QR code from any text or link, with medium error correction.",
      steps: [
        "Type or paste your text or link on the left.",
        "Set the size in pixels, between 120 and 1024.",
        "Save PNG for chat or SVG for print. Copy image puts the PNG on the clipboard.",
      ],
    },
    keywords: "create make barcode link wifi vcard",
    load: () => import("./tools/qr-generator.js"),
  },
  {
    id: "qr-scanner",
    category: "qr",
    name: "QR Scanner",
    icon: "scan-line",
    note: "Read a QR code with your camera or an image.",
    about: "The camera feed stays in this tab. Nothing is recorded or sent.",
    tutorial: {
      intro: "Read a QR code with your camera or from an image file. Decoding happens in this tab.",
      steps: [
        "Press Start camera and point it at a code. Allow the camera permission.",
        "Or drop an image on the box, or pick one with Choose an image.",
        "The decoded text appears below. Copy it, or open the link if it is a URL.",
      ],
    },
    keywords: "read decode camera image photo scan",
    load: () => import("./tools/qr-scanner.js"),
  },
];

export function getTool(id) {
  return TOOLS.find((tool) => tool.id === id);
}

export function getCategory(id) {
  return CATEGORIES.find((category) => category.id === id);
}

export function toolsInCategory(categoryId) {
  return TOOLS.filter((tool) => tool.category === categoryId);
}

export function toolHref(tool) {
  return `#/${tool.category}/${tool.id}`;
}