// Vercel serverless function: GET /api/results
// Rale rezilta Florida Pick 3 ak Pick 4 (midi + swa) bò sèvè a, san pwoblèm CORS.
const BASE = 'https://www.lotteryusa.com/florida/';
const SOURCES = {
  mid3: { url: BASE + 'midday-pick-3/', n: 3 },
  eve3: { url: BASE + 'pick-3/', n: 3 },
  mid4: { url: BASE + 'midday-pick-4/', n: 4 },
  eve4: { url: BASE + 'pick-4/', n: 4 }
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

async function grab(src) {
  const r = await fetch(src.url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FloridaMagicBot/1.0)', 'Accept': 'text/html' }
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return parse(await r.text(), src.n);
}

module.exports = async (req, res) => {
  const keys = Object.keys(SOURCES);
  const got = await Promise.allSettled(keys.map(k => grab(SOURCES[k])));
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
  res.status(rows.length ? 200 : 502).send(JSON.stringify({ rows, errors, src: 'lotteryusa.com', updated: new Date().toISOString() }));
};
module.exports.parse = parse;
