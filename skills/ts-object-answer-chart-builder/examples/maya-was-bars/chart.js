// Search: [sales] [item type] [date].yearly. Bars for the latest year, a dashed ghost of the year before.
const MAYA = 'https://cdn.jsdelivr.net/npm/mayacharts@0.15.0/dist/maya.global.js';
const el = document.getElementById('chart') ?? document.body.appendChild(Object.assign(document.createElement('maya-chart'), { id: 'chart' }));
const done = () => viz?.events?.emitRenderCompletedEvent();
if (!document.querySelector('script[src="' + MAYA + '"]')) document.head.appendChild(Object.assign(document.createElement('script'), { src: MAYA, onerror: () => { el.textContent = 'MayaCharts could not load from ' + MAYA; done(); } }));
const rows = ((r) => { const k = r.schema.map((c) => c.name); return r.data.map((d) => { const o = {}; k.forEach((n, i) => { const v = d[i]; o[n] = v !== null && typeof v === 'object' ? (typeof v.value === 'function' ? v.value() : v.value) : v; }); return o; }); })(viz?.getDataFromSearchQuery?.()?.getData() ?? { schema: [], data: [] });
// The pivot the spec cannot do yet (BbekShr/mayacharts#60): one row per item type with this year and last year.
const yearOf = (r) => new Date(Number(r['Year(Date)'])).getUTCFullYear();
const cur = Math.max(...rows.map(yearOf)), by = {};
rows.forEach((r) => { const b = by[r['Item Type']] ??= { item: r['Item Type'], sales: 0, before: 0 }; if (yearOf(r) === cur) b.sales += r['Total Sales']; else if (yearOf(r) === cur - 1) b.before += r['Total Sales']; });
const money = { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 };
['maya-render', 'maya-error'].forEach((t) => el.addEventListener(t, done, { once: true }));
el.spec = { type: 'bar', horizontal: true, x: 'item', y: 'sales', ...(rows.length && { was: 'before' }), sort: 'desc', select: true, limit: Math.max(3, Math.floor((el.clientHeight - 110) / 22)),
  format: { sales: money, before: money }, titles: { item: 'Item type', sales: cur + ' sales', before: String(cur - 1) }, text: { noData: 'No rows yet: bind [sales] [item type] [date].yearly' },
  theme: { font: 'Geist, system-ui, sans-serif', fg: '#1E1E24', fgMuted: '#8A8A94', accent: '#1E1E24', series1: '#1E1E24', radius: '2px', bg: '#FFFFFF' }, data: Object.values(by) };
