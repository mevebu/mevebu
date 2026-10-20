<div align="center">

# mevebu

**220 free browser tools, one page each. No sign up. No uploads. Everything runs in your tab.**

A private toolbox for the small jobs that do not deserve a whole app: format JSON, decode a JWT, make a password, build a cron line, pick a color, scan a QR code, and a lot more.

[![npm version](https://img.shields.io/npm/v/mevebu?color=2ea44f&label=npm)](https://www.npmjs.com/package/mevebu)
[![npm downloads](https://img.shields.io/npm/dm/mevebu?color=2ea44f)](https://www.npmjs.com/package/mevebu)
[![License: MIT](https://img.shields.io/github/license/mevebu/mevebu?color=blue)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/mevebu/mevebu?style=flat&color=yellow)](https://github.com/mevebu/mevebu/stargazers)
![Tools](https://img.shields.io/badge/tools-220-brightgreen)
![Privacy](https://img.shields.io/badge/privacy-100%25%20in--browser-blue)

[Quick start](#quick-start) · [What's inside](#whats-inside) · [Privacy](#privacy-by-design) · [Credit](#credit) · [Development](#development) · [FAQ](#faq)

</div>

<!-- Tip: add a screenshot here, for example: ![mevebu home page](docs/screenshot.png) -->

---

## What is mevebu?

mevebu is a collection of **220 small online tools** that all run **inside your browser**. Each tool lives on its own page, does one job, and does it fast. Most of them update as you type, so there is no submit button and no waiting.

Think of it as a clean, private alternative to the usual "free online tools" websites. There are no accounts, no ads in your way, no uploads, and no tracking. Your text, passwords, tokens, and files stay on your device.

Install it once with one command and it runs on your machine, with no server behind it and no account to create.

## Why you will like it

- **Private by design.** Nothing you paste ever leaves your browser tab.
- **No account, no sign up.** Open a tool and use it.
- **Fast.** Plain HTML and vanilla JavaScript. No heavy framework, no loading spinners.
- **One tool, one page.** Every tool has its own clean page you can bookmark.
- **Instant search.** Press `Ctrl+K` and find any tool by name, keyword, or what it does.
- **Works offline.** Once installed, it runs fully on your machine.
- **Free and open source.** MIT licensed.

## Quick start

You need [Node.js](https://nodejs.org) installed. Then run:

```bash
npm install -g mevebu
mevebu
```

That is it. mevebu starts a small local server, opens your browser on the home page, and serves the tools that ship with the package. Press `Ctrl+C` in the terminal to stop it.

mevebu tries port `5555` first, then `5678`, then `5432`, and finally any free port. The first three are stable between restarts, so your bookmarks keep working.

### CLI options

```text
-p, --port <number>   Try this port first (5555, 5678, 5432 otherwise).
-d, --dir <path>      Folder to serve. Defaults to the bundled tools.
    --no-open         Do not open the browser.
-v, --version         Print the version and exit.
-h, --help            Print this help and exit.
```

## What's inside

mevebu has **220 tools in 20 categories**. Here is the full breakdown:

| Category           | Tools |
| ------------------ | ----: |
| Data Generator     |    10 |
| Passwords and keys |    20 |
| Developer          |    26 |
| Convert            |    15 |
| Text and data      |    14 |
| Daily use          |     8 |
| Math               |    17 |
| Date and time      |     7 |
| Data and lists     |     8 |
| Design             |    10 |
| Web and SEO        |    12 |
| Encoding           |     8 |
| Academic           |    15 |
| Study              |     7 |
| Business           |    10 |
| Locale             |     7 |
| Content            |     8 |
| GitHub             |     8 |
| Units              |     8 |
| QR codes           |     2 |
| **Total**          | **220** |

The counts come straight from the tool registry, so this table and the app never drift apart.

### Popular tools

| Tool | What it does |
| ---- | ------------ |
| **Password generator** | Make a strong password and copy it. The page only talks to your clipboard. |
| **JSON formatter** | Paste your JSON and get a clean, formatted version as you type. |
| **JWT generator and decoder** | Sign a token with HS256, RS256, or ES256, or paste one and read its header and payload. |
| **Color palette** | Pick one color and get matching analogous, complementary, or monochrome schemes. |
| **Countdown timer** | A quiet, fullscreen timer that keeps running when the tab is hidden. |
| **QR code generator** | Turn a URL, a Wi-Fi config, or any text into a scannable image. |
| **Slug converter** | Turn a sentence into a clean, readable URL slug. |

Browse everything from the home page or by category, or just press `Ctrl+K` and start typing.

## Privacy by design

mevebu is built so that your data has nowhere to go. Every tool is a static HTML file and a small JavaScript module. Icons are Lucide, brand marks are Simple Icons, and the libraries that do real work (mathjs, pdf-lib, pdf.js, jsQR) are vendored into the folder rather than fetched from a CDN. There is no server side code, no analytics, and no API key.

When you paste a password, a token, or a CSV into a tool:

- It is processed in your browser tab, using the standard Web Crypto API or other built-in browser APIs.
- Nothing is sent to a remote server, because there is no remote server in the loop.
- Nothing is saved to disk by the tool.
- The only network request the page makes is to load itself and to read the GitHub star count for the footer chip. That request fails quietly when you are offline.

Do not just take our word for it. Open the Network tab in your browser dev tools and watch a tool work. You will not see an upload.

| | mevebu | Typical online tool sites |
| --- | :---: | :---: |
| Account needed | No | Often |
| Your data uploaded | Never | Sometimes |
| Works offline | Yes | Rarely |
| Open source | Yes (MIT) | Rarely |

## Credit

mevebu is built and maintained by the [mevebu](https://github.com/mevebu) organization, created by [Ilyas Mukhlisin](https://www.instagram.com/ilyas.mukhlisin). Two repositories live there: **Mevebu**, this toolbox, and **Waitsec**, a set of guardrails for coding agents.

The code is MIT licensed. If you learn from it, borrow a helper, or ship something inspired by it, keep the copyright notice and say where it came from. A link back to [github.com/mevebu/mevebu](https://github.com/mevebu/mevebu) is enough.

Bug reports and tool ideas are welcome in the issues. The best way to support the project is to use it, share it, and tell us what is missing.

## Development

Contributions are welcome. Here is how to run the project locally while you work on it:

```bash
git clone https://github.com/mevebu/mevebu
cd mevebu
npm install
npm run css      # build the stylesheet from tailwind.src.css
npm run icons    # regenerate the vendored Lucide icon set
npm run social   # regenerate the vendored Simple Icons brand marks
npm start        # serve the static folder on http://localhost:5555
```

### Project layout

```text
bin/        The mevebu command line entry
mevebu/     The static app that gets served
  app/      App shell (mevebu.js) and the Tailwind source (tailwind.src.css)
  libs/js/  Shared core.js, the registry, and one file per tool in tools/
scripts/    Helper scripts for the project
```

### How it works

- The app is a few hundred lines of vanilla JavaScript (ESM) in `mevebu/app/mevebu.js`, plus a small shared helper set in `mevebu/libs/js/core.js`.
- The registry in `mevebu/libs/js/registry.js` is the single source of truth for all tools.
- The styling is Tailwind v4, built from one source file. The built stylesheet is committed, so the shipped folder stays plain static files.
- The design system (type scale, layout, color, and motion) is documented in `AGENTS.md` and `DESIGN.md`.

### Add a new tool

1. Create one file in `mevebu/libs/js/tools/`.
2. Export a `mount(slot)` function. Optionally export `unmount()` to clean up timers, cameras, and observers.
3. Add one entry to `TOOLS` in `mevebu/libs/js/registry.js`.

That is all. The catalog, search, breadcrumbs, and category pages pick it up automatically.

## FAQ

**What is mevebu?**
mevebu is a free, open source collection of 220 browser based tools for developers, students, creators, and everyday use. Every tool runs locally in your browser.

**Is mevebu really free?**
Yes. It is MIT licensed, with no paid tier, no account, and no usage limits.

**Does mevebu upload or store my data?**
No. Your input is processed in your browser tab and never sent to a server.

**Can I use mevebu offline?**
Yes. After you install it with npm, it runs on your own machine without needing the internet.

**Can I reuse the code?**
Yes. It is MIT licensed, so keep the copyright notice and the license text, and credit [mevebu](https://github.com/mevebu/mevebu) where you use it.

**How do I find a tool quickly?**
Press `Ctrl+K` and search by tool name, keyword, or what the tool does.

**Can I add my own tool?**
Yes. Add one file and one registry entry. See [Add a new tool](#add-a-new-tool).

## Report a problem

Every tool page has a small **Report a problem** link at the bottom. It opens a GitHub issue with the tool name, the page URL, and the mevebu version already filled in. You only need to describe what happened and what you expected.

You can also [open an issue](https://github.com/mevebu/mevebu/issues) directly, or send a pull request.

## Follow

Star the repo if you like it, and follow mevebu for updates:

[GitHub](https://github.com/mevebu) · [TikTok](https://www.tiktok.com/@mevebu01) · [Instagram](https://www.instagram.com/mevebu01) · [Facebook](https://www.facebook.com/mevebu) · [YouTube](https://www.youtube.com/@mevebu) · [Threads](https://www.threads.net/@mevebu01)

## Links

- Repository: <https://github.com/mevebu/mevebu>
- npm package: <https://www.npmjs.com/package/mevebu>
- Issues: <https://github.com/mevebu/mevebu/issues>

## License

[MIT](./LICENSE). The whole list, the whole source, the whole thing is right here in the repository.