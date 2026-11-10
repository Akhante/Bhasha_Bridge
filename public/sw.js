/* BhashaBridge service worker. Bump V on every deploy so phones pick up the new files. */
const V = "bb-v2";
const CORE = [
  "index.html",
  "style.css",
  "app.js",
  "store.js",
  "rules.js",
  "voice.js",
  "pack.json",
  "passport.html",
  "pulse.html",
  "digest.html",
  "manifest.json",
  "icon.svg",
];

/* every audio file named in pack.json, so the audio you generate is cached automatically */
const audioOf = async (c) => {
  const r = await c.match("pack.json");
  return r
    ? [...new Set((await r.text()).match(/audio\/[\w.\-]+/g) || [])]
    : [];
};

self.addEventListener("install", (e) =>
  e.waitUntil(
    (async () => {
      const c = await caches.open(V);
      await Promise.all(
        CORE.map((f) =>
          c.add(new Request(f, { cache: "reload" })).catch(() => {}),
        ),
      ); /* one missing file must not break the install */
      await Promise.all(
        (await audioOf(c)).map((f) => c.add(f).catch(() => {})),
      );
      self.skipWaiting();
    })(),
  ),
);

self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
      await self.clients.claim();
    })(),
  ),
);

/* Safari will not play cached audio unless the worker answers Range requests */
async function ranged(req, res) {
  const b = await res.arrayBuffer(),
    m = /bytes=(\d+)-(\d*)/.exec(req.headers.get("range")),
    s = +m[1],
    en = m[2] ? +m[2] : b.byteLength - 1;
  return new Response(b.slice(s, en + 1), {
    status: 206,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "audio/wav",
      "Content-Range": `bytes ${s}-${en}/${b.byteLength}`,
      "Content-Length": en - s + 1,
    },
  });
}
async function handle(req) {
  const c = await caches.open(V),
    hit = await c.match(req, { ignoreSearch: true }),
    range = req.headers.has("range");
  const net = fetch(req)
    .then((r) => {
      if (r.ok && !range && r.status === 200) c.put(req, r.clone());
      return r;
    })
    .catch(() => null); /* refresh in the background */
  if (hit) return range ? ranged(req, hit) : hit;
  const r = await net;
  if (r) return r;
  return req.mode === "navigate"
    ? (await c.match("index.html")) || Response.error()
    : Response.error();
}
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (
    e.request.method !== "GET" ||
    u.origin !== location.origin ||
    u.pathname.startsWith("/api/")
  )
    return; /* never cache the AI calls */
  e.respondWith(handle(e.request));
});

/* the app asks "is everything cached?" for its Settings screen */
self.addEventListener("message", async (e) => {
  if (e.data?.type !== "STATUS") return;
  const c = await caches.open(V),
    have = (await c.keys()).map((k) =>
      new URL(k.url).pathname.split("/").pop(),
    ),
    a = await audioOf(c);
  e.source.postMessage({
    type: "STATUS",
    core: CORE.filter((f) => have.includes(f)).length,
    coreTotal: CORE.length,
    audio: a.filter((f) => have.includes(f.split("/").pop())).length,
    audioTotal: a.length,
  });
});
