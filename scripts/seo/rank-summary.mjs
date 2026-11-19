// A partial SERP or failed collection cannot establish that a word is outside top N.
export function rankSummary(rank, today) {
  const date = Object.keys(rank.days ?? {}).sort().at(-1) ?? null;
  const rows = date === today ? rank.days[date] : {};
  const values = Object.values(rows);
  const valid = v => Number.isInteger(v) && v > 0 || typeof v === 'string' && /^>\d+$/.test(v);
  const count = (engine, n) => {
    if (!values.length || values.some(r => !valid(r[engine]) || typeof r[engine] === 'string' && Number(r[engine].slice(1)) < n)) return null;
    return values.filter(r => typeof r[engine] === 'number' && r[engine] <= n).length;
  };
  return { date, current: date === today, rows, words: values.length,
    checked: Object.fromEntries(['baidu','bing'].map(e => [e, values.filter(r => valid(r[e])).length])),
    top10: {baidu: count('baidu',10), bing: count('bing',10)},
    top50: {baidu: count('baidu',50), bing: count('bing',50)} };
}

export function rankChanged(a, b) {
  const top10 = v => Number.isInteger(v) && v > 0 ? v <= 10 : typeof v === 'string' && /^>\d+$/.test(v) && Number(v.slice(1)) >= 10 ? false : null;
  const x = top10(a), y = top10(b);
  if (x === null || y === null) return false;
  return x !== y || typeof a === 'number' && typeof b === 'number' && Math.abs(a-b) >= 3;
}
