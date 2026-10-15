// Merges .gitignore templates for the stacks you pick.
import { bench, stack, panel, toggleRow, output, notice, copyButton, downloadButton, actions, toolcard } from "../core.js";

const TEMPLATES = {
  node: { label: "Node", lines: ["node_modules/", "npm-debug.log*", "yarn-debug.log*", "yarn-error.log*", ".pnpm-store/"] },
  python: { label: "Python", lines: ["__pycache__/", "*.py[cod]", ".venv/", "venv/", "*.egg-info/", ".pytest_cache/"] },
  laravel: { label: "Laravel", lines: ["/vendor/", "/node_modules/", "/public/build/", "/public/hot", "/storage/*.key", ".env", ".env.backup"] },
  react: { label: "React", lines: ["/build/", "/dist/", ".env.local", ".env.development.local", ".env.production.local"] },
  macos: { label: "macOS", lines: [".DS_Store", ".AppleDouble", ".LSConflict"] },
  windows: { label: "Windows", lines: ["Thumbs.db", "ehthumbs.db", "Desktop.ini", "$RECYCLE.BIN/"] },
  editor: { label: "Editor", lines: [".vscode/*", "!.vscode/extensions.json", ".idea/", "*.swp", "*.swo"] },
};

export function mount(slot) {
  const stacks = toggleRow(Object.entries(TEMPLATES).map(([value, template]) => ({ value, label: template.label })));
  const out = output({ rows: 18 });
  const error = notice("error");
  let text = "";

  function run() {
    const picked = stacks.values();
    if (!picked.length) {
      text = "";
      out.write("");
      error.write("Pick at least one stack.");
      return;
    }
    error.write("");
    const seen = new Set();
    const lines = [];
    for (const key of picked) {
      const template = TEMPLATES[key];
      lines.push(`# ${template.label}`);
      for (const line of template.lines) {
        if (seen.has(line)) continue;
        seen.add(line);
        lines.push(line);
      }
      lines.push("");
    }
    text = `${lines.join("\n").replace(/\n+$/, "")}\n`;
    out.write(text);
  }

  stacks.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Stacks", stacks), error),
      stack(panel(".gitignore", out))
    ),
    foot: actions(downloadButton(() => text, ".gitignore"), copyButton(() => text, "Copy", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
