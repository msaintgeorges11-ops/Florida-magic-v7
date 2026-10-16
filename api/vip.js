// Vercel serverless function: POST /api/vip
// Verifye kòd VIP la sou sèvè a. Kòd yo mete nan Environment Variable VIP_CODES
// (separe ak virgil si gen plizyè: ex. KOD1,KOD2,KOD3)
const crypto = require('crypto');

// Nimewo VIP jodi a. Se sèlman moun ki gen bon kòd VIP ki resevwa l.
// Chak jou, chanje nimewo a isit la.
const TODAY = '354';

function same(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).send(JSON.stringify({ ok: false }));
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const code = String((body && body.code) || '').trim();
  const valid = String(process.env.VIP_CODES || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const ok = !!code && valid.some(v => same(v, code));
  res.status(ok ? 200 : 401).send(JSON.stringify(ok ? { ok: true, today: TODAY } : { ok: false }));
};
