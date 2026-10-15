# mevebu

Small tools that run in your browser. No accounts, no uploads, no tracking.

mevebu is a set of tiny, privacy-first utilities served from your own machine. Every tool runs
entirely in the tab, so nothing you paste ever leaves your computer.

## Install

```sh
npm install -g mevebu
```

## Use

```sh
mevebu
```

The tools open in your default browser. Press `Ctrl+C` in the terminal to stop.

### Options

```
-p, --port <number>   Try this port first (5555, 5678, 5432 otherwise).
-d, --dir <path>      Folder to serve. Defaults to the bundled tools.
    --no-open         Do not open the browser.
-v, --version         Print the version and exit.
-h, --help            Print this help and exit.
```

The port is stable across restarts: mevebu tries **5555** first, then **5678**, then **5432**,
and falls back to any free port only when those are taken.

## Tools

186 tools, each with its own page. Most update as you type, with no submit button.

| Category | Tools |
| :--- | :--- |
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

Press `Ctrl+K` in the app to search the full list.

## Development

```sh
npm run dev      # serve on http://localhost:5555
npm run icons    # regenerate vendored lucide icons
```

## License

MIT
