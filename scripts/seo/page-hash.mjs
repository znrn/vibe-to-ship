// 页面内容哈希：判断一个页面从某天以来有没有改动（推送用，避免天天重复提交没变的网址）。
// 哈希只算正文（去掉 _astro 资源名、构建时间这类每次构建都变的东西），记录在 plan/seo/data/page-hashes.json：url → { hash, since }
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { readJson, writeJson, TODAY, DATA, SITE } from './lib.mjs';

const FILE = `${DATA}/page-hashes.json`;
const norm = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/\/_astro\/[\w.-]+/g, '/_astro/x').replace(/\s+/g, ' ');

// 算出站点地图里每页的哈希，和上次比较，变了就把 since 改成今天；返回 url → { hash, since }
export function pageHashes() {
  const store = readJson(FILE, {});
  if (!existsSync('dist/sitemap-0.xml')) return store;
  const urls = [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const u of urls) {
    const path = u.replace(SITE, '') || '/';
    const file = `dist${path}${path.endsWith('/') ? 'index.html' : ''}`;
    if (!existsSync(file)) continue;
    const hash = createHash('sha1').update(norm(readFileSync(file, 'utf8'))).digest('hex').slice(0, 16);
    if (store[u]?.hash !== hash) store[u] = { hash, since: TODAY };
  }
  writeJson(FILE, store);
  return store;
}
// 自 date 以来改过没有（没有记录当作改过）
export const changedSince = (url, date, hashes = pageHashes()) => !hashes[url] || hashes[url].since > date;
export const changedUrls = (date, hashes = pageHashes()) => Object.keys(hashes).filter((u) => hashes[u].since > date);
