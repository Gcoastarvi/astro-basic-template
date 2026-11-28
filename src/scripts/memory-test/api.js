/* Talks to the FluencyJet backend (api.fluencyjet.com), new routes under /api/memory-test.
   Every call has a timeout and never throws: if the server is slow or down, the student can still
   finish the test on screen. */
let BASE = "";
export function setBase(b) { BASE = (b || "").replace(/\/$/, ""); }

async function call(method, path, body, ms) {
  const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), ms || 9000) : null;
  try {
    const r = await fetch(BASE + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl ? ctl.signal : undefined,
      credentials: "omit",
      keepalive: method === "POST" && JSON.stringify(body || {}).length < 60000,
    });
    let data = null;
    try { data = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, data: data || {} };
  } catch (e) {
    return { ok: false, status: 0, data: {} };
  } finally { if (t) clearTimeout(t); }
}

export const api = {
  config: () => call("GET", "/config", null, 6000),
  start: (b) => call("POST", "/start", b),
  result: (b) => call("POST", "/result", b, 12000),
  lead: (b) => call("POST", "/lead", b, 12000),
  afterCheck: (b) => call("POST", "/after/check", b),
  event: (b) => call("POST", "/event", b, 5000),
  progress: (b) => call("POST", "/progress", b, 6000),
  save: (b) => call("POST", "/save", b, 12000),
  saved: (k) => call("GET", "/saved?k=" + encodeURIComponent(k), null, 9000),
  report: (token) => call("GET", "/report?t=" + encodeURIComponent(token), null, 9000),
};
