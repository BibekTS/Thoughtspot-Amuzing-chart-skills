// pin-check.mjs — the CDN half of library-contract.md's hard contract, for every chart in any library:
// a script loaded from a URL names one exact release (x.y.z, never `d3@7` or `@latest`) and carries its
// subresource integrity, so a CDN file that changes, or a package release that goes bad, refuses to run
// instead of running next to the user's data. Used by answer-pack.mjs, liveboard-pack.mjs and lean-lint.mjs.
const SCRIPT_URL = /https?:\/\/[^\s'"<>)]+\.js(?![\w./-])/g; // ends in .js (plotly.js-dist-min is a package name)
// An npm CDN URL (jsDelivr /npm/, unpkg) is pkg@x.y.z/...; any other host names the release in its path.
const NPM_URL = /https?:\/\/[^\s'"<>)]*(?:\/npm\/|unpkg\.com\/)[^\s'"<>)]*/g;
const exact = (u) => (/\/npm\/|unpkg\.com\//.test(u) ? /@\d+\.\d+\.\d+\//.test(u) : /\d+\.\d+\.\d+/.test(u));

// Problems with the chart's script URLs, as strings; empty when it pins and checks everything it loads.
export function cdnProblems(html, js) {
  const bad = [];
  for (const m of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    const [tag, src] = m;
    if (!/^https?:/.test(src)) continue;
    if (!exact(src)) bad.push("chart.html loads " + src + " without an exact x.y.z version");
    if (!/\bintegrity=["']sha384-[A-Za-z0-9+/=]+["']/.test(tag) || !/\bcrossorigin=["']anonymous["']/i.test(tag)) bad.push("chart.html loads " + src + ' without integrity="sha384-..." crossorigin="anonymous"');
  }
  // A loader in chart.js: every script URL pinned, and an integrity value beside it (MayaCharts charts build the
  // file URL from a pinned base, which counts as one).
  const urls = [...new Set([...js.matchAll(SCRIPT_URL), ...js.matchAll(NPM_URL)].map((m) => m[0]))];
  for (const u of urls) if (!exact(u)) bad.push("chart.js loads " + u + " without an exact x.y.z version");
  if (urls.length && !/['"]sha384-[A-Za-z0-9+/=]+['"]/.test(js)) bad.push("chart.js loads a script without an integrity value (sha384-...)");
  return [...new Set(bad)];
}
