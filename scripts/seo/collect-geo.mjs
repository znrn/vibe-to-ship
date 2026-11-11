// GEO 探测已改成三个站共用：~/launchpad/tools/geo-probe/probe.mjs（launchd local.geo-probe 每周一 06:20），
// 各家官方接口打开联网搜索、每题问两次，结果直接写进 plan/seo/data/geo.json（格式和日报 report.mjs 兼容）。
// 这里只报告最近一次的结果，不再自己调接口。
import { readJson, DATA } from './lib.mjs';

const geo = readJson(`${DATA}/geo.json`, { weeks: {} });
const last = Object.keys(geo.weeks).sort().at(-1);
if (!last) { console.log('GEO：还没有数据（等 ~/.config/geo-probe.env 填好 key，每周一 06:20 自动跑）'); process.exit(0); }
const cells = Object.values(geo.weeks[last]).flatMap((w) => Object.values(w)).filter((c) => !c.error);
const hits = cells.reduce((s, c) => s + (c.hits ?? (c.cited ? 1 : 0)), 0);
const of = cells.reduce((s, c) => s + (c.of ?? 1), 0);
console.log(`GEO（${last}）：${Object.keys(geo.weeks[last]).join('、')}，共问 ${of} 次，提到本站 ${hits} 次；详情 http://localhost:8088/pages/geo-probe.html`);
