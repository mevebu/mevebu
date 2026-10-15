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

// Preferred ports, tried in order. Falls back to any free port when all are taken.
const PREFERRED_PORTS = [5555, 5678, 5432];

const HELP = `mevebu ${VERSION}

Serve the offline tools on localhost. No accounts, no uploads, no tracking.

Usage:
  mevebu [options]

Options:
  -p, --port <number>   Try this port first (${PREFERRED_PORTS.join(", ")} otherwise).
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

/**
 * Binds the server to the first port that is free. A `--port` value is tried
 * first, then the preferred list (5555, 5678, 5432), then any free port. This
 * keeps the address stable across restarts while never failing on a clash.
 */
function listen(server, preferred, host) {
  const queue = [];
  if (preferred) queue.push(preferred);
  for (const port of PREFERRED_PORTS) if (!queue.includes(port)) queue.push(port);
  queue.push(0); // 0 lets the OS pick any free port as the last resort

  return new Promise((resolve, reject) => {
    let index = 0;
    const attempt = () => {
      if (index >= queue.length) {
        reject(new Error("No free port found."));
        return;
      }
      const port = queue[index++];
      const onError = (error) => {
        server.removeListener("listening", onListening);
        if (error.code === "EADDRINUSE" || error.code === "EACCES") {
          if (port) console.log(`  port ${port} is taken, trying the next one...`);
          attempt();
        } else {
          reject(error);
        }
      };
      const onListening = () => {
        server.removeListener("error", onError);
        resolve(server.address().port);
      };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port, host);
    };
    attempt();
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

listen(server, options.port, "127.0.0.1")
  .then((port) => {
    const url = `http://localhost:${port}/`;
    console.log(`\n  mevebu is running at ${url}\n  Press Ctrl+C to stop.\n`);
    if (options.open) openBrowser(url);
  })
  .catch((error) => {
    console.error(`\n  Could not start mevebu: ${error.message}\n`);
    process.exit(1);
  });
