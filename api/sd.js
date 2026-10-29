// Vercel serverless function: GET /api/sd
// Rale otomatikman rezilta Sendomeng (Quiniela Real, Loteka, Leidsa, Nacional, La Primera) sou loterias.do
// Chak paj gen 5 dènye rezilta: 3 nimewo de 2 chif + dat (jj-mm-aaaa).
const B = 'https://loterias.do/';
const SRC = [
  { name: 'Quiniela Real',     t: '12:55', url: B + 'real/quiniela/' },
  { name: 'La Primera Día',    t: '12:00', url: B + 'la-primera/dia/' },
  { name: 'Gana Más',          t: '14:30', url: B + 'nacional/gana-mas/' },
  { name: 'Quiniela Loteka',   t: '19:55', url: B + 'loteka/quiniela/' },
  { name: 'La Primera Noche',  t: '20:00', url: B + 'la-primera/noche/' },
  { name: 'Quiniela Leidsa',   t: '20:55', url: B + 'leidsa/quiniela-pale/', sun: '17:55' },
  { name: 'Lotería Nacional',  t: '21:00', url: B + 'nacional/noche/', sun: '18:00' }
];

function parse(html, max) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
  const re = /(\d{2})-(\d{2})-(20\d\d)/g;
  const out = [];
  let prev = 0, m;
  while ((m = re.exec(text)) && out.length < max) {
    const digits = text.slice(prev, m.index).replace(/\D/g, '');
    prev = m.index + m[0].length;
    if (digits.length < 6) continue;
    const d = digits.slice(-6);
    out.push({ date: m[3] + '-' + m[2] + '-' + m[1], nums: d.slice(0, 2) + ' ' + d.slice(2, 4) + ' ' + d.slice(4, 6) });
  }
  return out;
}

async function grab(s) {
  const r = await fetch(s.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FloridaMagicBot/1.0)', 'Accept': 'text/html' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const rows = parse(await r.text(), 5);
  return rows.map(x => {
    const sunday = new Date(x.date + 'T12:00:00Z').getUTCDay() === 0;
    return { date: x.date, t: (sunday && s.sun) || s.t, name: s.name, nums: x.nums };
  });
}

module.exports = async (req, res) => {
  const got = await Promise.allSettled(SRC.map(grab));
  const rows = [], errors = [];
  got.forEach((g, i) => {
    if (g.status !== 'fulfilled') { errors.push(SRC[i].name + ': ' + (g.reason && g.reason.message)); return; }
    if (!g.value.length) errors.push(SRC[i].name + ': 0 rezilta li');
    rows.push(...g.value);
  });
  rows.sort((a, b) => (b.date + b.t).localeCompare(a.date + a.t));
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(rows.length ? 200 : 502).send(JSON.stringify({ rows: rows.slice(0, 40), errors, src: 'loterias.do', updated: new Date().toISOString() }));
};
module.exports.parse = parse;
