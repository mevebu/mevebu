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
-p, --port <number>   Port to listen on. Defaults to a free port.
-d, --dir <path>      Folder to serve. Defaults to the bundled tools.
    --no-open         Do not open the browser.
-v, --version         Print the version and exit.
-h, --help            Print this help and exit.
```

## Tools

16 tools, each with its own page. Most update as you type, with no submit button.

| Category | Tools |
| :--- | :--- |
| Random | Spin the Wheel, Name Picker, Coin Flip, Dice Roller |
| Passwords and keys | Password Generator, JWT Generator, Hash Generator |
| Developer | UUID Generator, Color Converter |
| Convert | Base64, URL Encoder, Case Converter |
| Text and data | Lorem Ipsum, Test Data |
| QR codes | QR Generator, QR Scanner |

## Development

```sh
npm run dev      # serve on http://localhost:5173
npm run icons    # regenerate vendored lucide icons
```

## License

MIT
