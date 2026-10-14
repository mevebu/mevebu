// Hash routing. Hash routes keep the app working on any static host with no
// rewrite rules, which is the whole distribution story: a folder you can drop
// anywhere, plus the npm CLI.

const routes = [];

function compile(pattern) {
  const parts = pattern.split("/").filter(Boolean);
  return { parts, handler: null };
}

export function route(pattern, handler) {
  routes.push({ ...compile(pattern), handler });
}

export function currentPath() {
  const hash = location.hash.replace(/^#/, "");
  return hash.startsWith("/") ? hash : `/${hash}`;
}

export function match(path) {
  const segments = path.split("/").filter(Boolean);
  for (const entry of routes) {
    if (entry.parts.length !== segments.length) continue;
    const params = {};
    let hit = true;
    for (let i = 0; i < entry.parts.length; i++) {
      const part = entry.parts[i];
      if (part.startsWith(":")) params[part.slice(1)] = decodeURIComponent(segments[i]);
      else if (part !== segments[i]) {
        hit = false;
        break;
      }
    }
    if (hit) return { handler: entry.handler, params };
  }
  return null;
}

export function go(path, { replace = false } = {}) {
  const target = `#${path.startsWith("/") ? path : `/${path}`}`;
  if (location.hash === target) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  if (replace) history.replaceState(null, "", target);
  else location.hash = target;
  if (replace) window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function start(handler) {
  const run = () => handler(currentPath());
  window.addEventListener("hashchange", run);
  run();
}