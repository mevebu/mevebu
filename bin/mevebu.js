#!/usr/bin/env node
// mevebu. Serves the mevebu/ folder on localhost with Node built-ins only,
// prints the address, and opens the default browser.
//
// Usage: mevebu [--port 8080] [--no-open] [--dir ./mevebu]
//        mevebu --version

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join, extname, resolve, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { exec } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = resolve(here, "..", "mevebu");

// The version lives in package.json; keep one source of truth.
const pkg = JSON.parse(await readFile(resolve(here, "..", "package.json"), "utf8"));
const VERSION = pkg.version;

const HELP = `mevebu ${VERSION}

Serve the offline tools on localhost. No accounts, no uploads, no tracking.

Usage:
  mevebu [options]

Options:
  -p, --port <number>   Port to listen on. Defaults to a free port.
  -d, --dir <path>      Folder to serve. Defaults to the bundled tools.
      --no-open         Do not open the browser.
  -v, --version         Print the version and exit.
  -h, --help            Print this help and exit.`;


const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function args(argv) {
  const out = { port: 0, open: true, dir: DEFAULT_DIR };
  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--no-open") out.open = false;
    else if ((flag === "--port" || flag === "-p") && argv[i + 1]) out.port = Number(argv[++i]);
    else if ((flag === "--dir" || flag === "-d") && argv[i + 1]) out.dir = resolve(argv[++i]);
    else if (flag === "--version" || flag === "-v" || flag === "version") {
      console.log(VERSION);
      process.exit(0);
    } else if (flag === "--help" || flag === "-h" || flag === "help") {
      console.log(HELP);
      process.exit(0);
    }
  }
  return out;
}

function openBrowser(url) {
  const start = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${start} "${url}"`, (error) => {
    if (error) console.log(`Open this in your browser: ${url}`);
  });
}

const options = args(process.argv);
const root = resolve(options.dir);

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, "");
    if (!path || path.endsWith("/")) path += "index.html";
    const file = join(root, path);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    const info = await stat(file).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    if (info.size > 8 * 1024 * 1024) {
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream" });
      res.end(body);
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Server error");
  }
});

server.listen(options.port || 0, "127.0.0.1", () => {
  const { port } = server.address();
  const url = `http://localhost:${port}/`;
  console.log(`\n  mevebu is running at ${url}\n  Press Ctrl+C to stop.\n`);
  if (options.open) openBrowser(url);
});
