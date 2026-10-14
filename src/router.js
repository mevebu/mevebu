// ============================================================
// mevebu — hash router (works on https AND file:// offline)
// Routes:  #/            home (all tools)
//          #/favorites   favorite tools
//          #/categories  category overview
//          #/about       about page
//          #/{category}/{toolId}   tool page
// ============================================================

export function getHashPath() {
  const h = location.hash.replace(/^#/, "");
  return h === "" ? "/" : h;
}

export function navigate(path) {
  if (!path.startsWith("/")) path = "/" + path;
  if (getHashPath() === path) render(); // force re-render
  else location.hash = "#" + path;
}

const routes = [];

export function route(pattern, handler) {
  // pattern like "/:cat/:id" or "/about"
  const parts = pattern.split("/").filter(Boolean);
  routes.push({ parts, handler });
}

export function matchRoute(path) {
  const segs = path.split("/").filter(Boolean);
  for (const r of routes) {
    if (r.parts.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < r.parts.length; i++) {
      const p = r.parts[i];
      if (p.startsWith(":")) params[p.slice(1)] = decodeURIComponent(segs[i]);
      else if (p !== segs[i]) { ok = false; break; }
    }
    if (ok) return { handler: r.handler, params };
  }
  return null;
}

let notFoundHandler = null;
export function setNotFound(fn) { notFoundHandler = fn; }

let currentRender = () => {};
export function setRenderer(fn) { currentRender = fn; }

export function render() {
  const path = getHashPath();
  const m = matchRoute(path);
  if (m) m.handler(m.params);
  else if (notFoundHandler) notFoundHandler(path);
}

export function startRouter() {
  window.addEventListener("hashchange", render);
  render();
}
