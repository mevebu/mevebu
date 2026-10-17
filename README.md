# mevebu

**186 small tools, each on its own page, all running in your browser.**

A box of browser tools for the jobs that do not deserve an app: convert a value,
hash a text, sign a token, format JSON, pick a color, run a timer, count words,
build a cron line, check a JWT, read a QR. Every tool opens on its own page and
most of them update as you type, so there is no submit button and no waiting.

Nothing leaves your tab. There is no account to make, nothing to upload, and
nothing saved to a server.

```
tools     186
categories 20
followers 1     (one tab, no account)
uploads   0
```

## Install and run

```sh
npm install -g mevebu
mevebu
```

`mevebu` starts a local server (it tries port 5555, then 5678, then 5432, then
any free port), opens your browser to the home page, and serves the static
folder bundled with the package. Press `Ctrl+C` in the terminal to stop it.

### CLI

```
-p, --port <number>   Try this port first (5555, 5678, 5432 otherwise).
-d, --dir <path>      Folder to serve. Defaults to the bundled tools.
    --no-open         Do not open the browser.
-v, --version         Print the version and exit.
-h, --help            Print this help and exit.
```

The first three ports are stable across restarts, so the bookmark to your tools
page keeps working.

## What's inside

A tool is a small page that does one job. The registry lists them all; here is
the shape of it.

| Category | Count |
| :--- | ---: |
| Random | 3 |
| Passwords and keys | 10 |
| Developer | 21 |
| Convert | 3 |
| Text and data | 14 |
| Daily use | 8 |
| Math | 17 |
| Date and time | 7 |
| Data and lists | 8 |
| Design | 10 |
| Web and SEO | 12 |
| Encoding | 8 |
| Academic | 15 |
| Study | 7 |
| Business | 10 |
| Locale | 7 |
| Content | 8 |
| GitHub | 8 |
| Units | 8 |
| QR codes | 2 |
| **Total** | **186** |

The counts are kept honest by the registry, so the page and the README never
drift apart. Press `Ctrl+K` in the app to search the full list by name, by
keyword, or by what the tool does.

A short tour of the most reached-for tools, one from each side of the catalog:

- **Password generator**: make a password, copy it, and the page never talks
  to anything but your clipboard.
- **JSON formatter**: paste, and the formatted version fills in as you type.
- **JWT generator and decoder**: sign a token with HS256, RS256 or ES256, or
  paste a token and read its header and payload.
- **Color palette**: pick one color, get a matching set in analogous,
  complementary or monochrome schemes.
- **Countdown timer**: a quiet, fullscreen timer that keeps running when the
  tab is hidden.
- **QR code generator**: turn a URL, a Wi-Fi config or any text into a scannable
  image right in the tab.
- **Slug converter**: keep a sentence readable while you turn it into a URL.

The full list is at the home page and under each category.

## How it stays private

Every tool is a static HTML file, a tiny JavaScript module, and a Lucide icon.
The HTML and the JavaScript are served from your machine when you run `mevebu`,
or from the file you host when you copy the `mevebu/` folder somewhere. There is
no server-side code, no analytics, and no API key.

When you paste a password, a token, or a CSV into a tool:

- the text is processed in the browser tab, by the file that the page loaded
  from, using the standard Web Crypto API or the standard browser APIs the
  tool needs
- nothing is sent to a remote server, because there is no remote server in
  the loop
- nothing is saved to disk by the tool, because the tool does not have a way
  to write to your file system
- the only network request the page makes is to load itself, and to read the
  GitHub star count for the footer chip (and that request fails silently when
  you are offline)

You can verify this by opening the network tab in your browser's dev tools and
watching a tool do its work. There is no upload. The same tool, loaded the same
way, behaves the same in a hotel Wi-Fi as it does on a server room.

## Hosting the static folder

If you would rather not run the CLI, the whole app is a plain static site. Copy
the `mevebu/` folder from this repo, or from the npm package, to any host that
serves files: a static site host, a CDN, an object store, a USB drive. Routes
are hash routes (`#/security/password-generator`), so no server rewrites are
needed.

The shipped folder is plain files, the CSS is one committed stylesheet that
Tailwind built from one source file, and there is no separate build step. The
hosting layer never runs code on your behalf.

## Development

```sh
git clone https://github.com/mevebu/mevebu
cd mevebu
npm install
npm run css      # build the stylesheet from tailwind.src.css
npm run icons    # regenerate the vendored Lucide icon set
npm start        # serve the static folder on http://localhost:5555
```

The app is a few hundred lines of vanilla JavaScript (ESM) in
`mevebu/app/mevebu.js` and a small shared vocabulary in `mevebu/libs/js/core.js`.
Every tool is a single file in `mevebu/libs/js/tools/`, exports a `mount(slot)`
function and (optionally) an `unmount()` to stop timers, cameras and observers.
The registry in `mevebu/libs/js/registry.js` is the single source of truth: add
an entry to `TOOLS` and a file, and the catalog, search, breadcrumb, and
category page pick it up.

The CSS is Tailwind v4, built from one source file, with the stylesheet output
committed so the shipped folder is still plain static files. There is no
component layer and no `mvb-` class: every utility is written at the call
site, and the design tokens live in `mevebu/app/tailwind.src.css`.

Layout and color decisions, the type scale, the orbit lines, the "energy 1,
rhythm 2, motion 1" dials, and the rest of the visual system, are recorded in
`AGENTS.md` and `DESIGN.md`, the two docs an agent reads first.

## Report a problem

Every tool page has a small "Report a problem" link at the bottom, alongside
the tool's actions. It opens a GitHub issue with the tool name, the page URL
and the mevebu version already filled in, so all you have to do is describe
what happened and what you expected.

## License

MIT. The whole list, the whole source, the whole thing is in the repository.
If a tool here saved you time, a coffee keeps the next one coming:
<https://buymeacoffee.com/fastro>.

## Links

- Repository: <https://github.com/mevebu/mevebu>
- npm: <https://www.npmjs.com/package/mevebu>
- Donate: <https://buymeacoffee.com/fastro>
