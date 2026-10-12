// Search: [sales] [item type] [date].yearly. Bars for the latest year, a dashed ghost of the year before.
const MAYA = 'https://cdn.jsdelivr.net/npm/mayacharts@0.16.0/dist/maya.core.global.js';
const go = () => maya.host.thoughtspot(viz, { type: 'bar', horizontal: true, x: /item/i, y: /sales/i, was: { by: /year|date/i }, sort: 'desc', select: true,
  format: { 'Total Sales': { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }, 'Year(Date)': 'year' }, titles: { 'Item Type': 'Item type' },
  title: '{max.x} leads with {max.y}', text: { noData: 'No rows yet: bind [sales] [item type] [date].yearly' },
  theme: { font: 'Geist, system-ui, sans-serif', fg: '#1E1E24', fgMuted: '#8A8A94', accent: '#1E1E24', series1: '#1E1E24', radius: '2px', bg: '#FFFFFF', titleSize: '14px' } });
if (window.maya?.host) go(); else { const s = document.querySelector('script[src="' + MAYA + '"]') ?? document.head.appendChild(Object.assign(document.createElement('script'), { src: MAYA })); s.addEventListener('load', go); s.addEventListener('error', () => { (document.getElementById('chart') ?? document.body).textContent = 'MayaCharts could not load from ' + MAYA; viz?.events?.emitRenderCompletedEvent?.(); }); }
