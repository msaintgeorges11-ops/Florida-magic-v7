// Vercel serverless function: GET /api/results?state=fl|ga|ny   (default: fl)
// Rale rezilta otomatikman bò sèvè a (pa gen pwoblèm CORS). Cache 5 minit.
const U = 'https://www.lotteryusa.com/';
const STATES = {
  fl: { // Florida Pick 3 / Pick 4
    mid3: [U + 'florida/midday-pick-3/', 3], eve3: [U + 'florida/pick-3/', 3],
    mid4: [U + 'florida/midday-pick-4/', 4], eve4: [U + 'florida/pick-4/', 4]
  },
  ga: { // Georgia Cash 3 / Cash 4 (midi, swa, nuit) - adrès verifye sou lotteryusa.com
    mid3: [U + 'georgia/midday-3/', 3], eve3: [U + 'georgia/cash-3-evening/', 3], nig3: [U + 'georgia/cash-3/', 3],
    mid4: [U + 'georgia/midday-4/', 4], eve4: [U + 'georgia/cash-4-evening/', 4], nig4: [U + 'georgia/cash-4/', 4]
  },
  ny: { // New York Numbers / Win 4 (midi, swa)
    mid3: [U + 'new-york/midday-numbers/', 3], eve3: [U + 'new-york/numbers/', 3],
    mid4: [U + 'new-york/midday-win-4/', 4], eve4: [U + 'new-york/win-4/', 4]
  }
};
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

function parse(html, n) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
  const digits = Array(n).fill('(\\d)').join('\\s*');
  const re = new RegExp('\\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+(\\d{1,2}),\\s+(20\\d\\d)\\D{0,60}?' + digits + '(?!\\s*\\d)', 'g');
  const out = {};
  let m;
  while ((m = re.exec(text))) {
    const date = m[3] + '-' + String(MONTHS[m[1]]).padStart(2, '0') + '-' + String(m[2]).padStart(2, '0');
    if (!out[date]) out[date] = m.slice(4, 4 + n).join('');
  }
  return out;
}

async function grab([url, n]) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FloridaMagicBot/1.0)', 'Accept': 'text/html' }
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return parse(await r.text(), n);
}

module.exports = async (req, res) => {
  const st = String((req.query && req.query.state) || 'fl').toLowerCase();
  const SRC = STATES[st] || STATES.fl;
  const keys = Object.keys(SRC);
  const got = await Promise.allSettled(keys.map(k => grab(SRC[k])));
  const byDate = {};
  const errors = [];
  got.forEach((g, i) => {
    if (g.status !== 'fulfilled') { errors.push(keys[i] + ': ' + (g.reason && g.reason.message)); return; }
    if (!Object.keys(g.value).length) errors.push(keys[i] + ': 0 rezilta li');
    Object.entries(g.value).forEach(([date, num]) => {
      (byDate[date] = byDate[date] || { date })[keys[i]] = num;
    });
  });
  const rows = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(rows.length ? 200 : 502).send(JSON.stringify({ state: st, rows, errors, src: 'lotteryusa.com', updated: new Date().toISOString() }));
};
module.exports.parse = parse;
