// Vercel serverless function: POST /api/vip
//
// 3 fason pou itilize l:
//  1) { action:'activate', code, email }  -> kòd bon => imel la anrejistre pou 30 jou
//  2) { action:'restore',  email }        -> imel la deja VIP epi pa ekspire => VIP rekonèt ankò (telefòn pèdi/reyajiste)
//  3) { code }                            -> ansyen fason (verifye kòd la sèlman), kenbe pou konpatibilite
//
// Kòd VIP yo rete nan Environment Variable VIP_CODES (separe ak virgil: KOD1,KOD2).
// Nimewo VIP jodi a: Environment Variable VIP_TODAY (chanje l nan Vercel chak jou, pa bezwen redeplwaye kòd la).
// Imel yo anrejistre nan Upstash Redis (Vercel -> Storage). Varyab yo mete otomatikman:
//   KV_REST_API_URL + KV_REST_API_TOKEN   (oswa UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
const crypto = require('crypto');

const DAYS = 30;
const MAX_TRIES = 20; // maksimòm demann pa IP chak 10 minit (tout fason)

function same(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function codeOk(code) {
  if (!code) return false;
  const valid = String(process.env.VIP_CODES || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return valid.some(v => same(v, code));
}

function cleanEmail(e) {
  e = String(e || '').trim().toLowerCase();
  return e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : '';
}

function keyOf(email) {
  return 'vip:' + crypto.createHash('sha256').update(email).digest('hex');
}

async function redis(cmd) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('no-db');
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || 'db');
  return d.result;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, obj) => res.status(status).send(JSON.stringify(obj));

  if (req.method !== 'POST') return send(405, { ok: false });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};
  const action = String(body.action || '');
  const code = String(body.code || '').trim();
  const TODAY = String(process.env.VIP_TODAY || '380');

  try {
    // Chemen rapid: yon VIP ki rekipere ak bon imel = 1 sèl kòmand Redis (pa konte nan limit yo).
    // Se echèk yo sèlman ki konte nan limit IP ak blokaj imel.
    if (action === 'restore') {
      const em = cleanEmail(body.email);
      if (em) {
        const e0 = Number(await redis(['GET', keyOf(em)])) || 0;
        if (e0 > Date.now()) return send(200, { ok: true, today: TODAY, exp: e0 });
      }
    }

    // limit dou pa IP (20 demann/10 min, li debloke poukont li): sèl pwoteksyon kont moun ki ap devine kòd
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
    const rk = 'rl:' + ip;
    const n = Number(await redis(['INCR', rk]));
    if (n === 1) await redis(['EXPIRE', rk, '600']);
    if (n > MAX_TRIES) return send(429, { ok: false });

    // kòd move => senpleman 401 (PA gen blokaj ankò)
    const ipFail = async () => send(401, { ok: false });

    if (action === 'activate' || action === 'restore') {
      const email = cleanEmail(body.email);
      if (!email) return send(401, { ok: false });

      if (action === 'activate') {
        if (!codeOk(code)) return ipFail(); // pa konte kont imel la: yon moun pa ka bloke VIP yon lòt

        // Yon kòd ka aktive PLIS imel (pa gen limit) toutan li nan VIP_CODES.
        // Lè ou chanje kòd la nan Vercel, ansyen an pa mache ankò pou nouvo moun
        // (men moun ki deja aktive yo rete VIP, yo rekipere ak imel yo).
        const exp0 = Number(await redis(['GET', keyOf(email)])) || 0;
        if (exp0 > Date.now()) {
          // imel sa a deja VIP: li rekonèt san ajoute jou
          return send(200, { ok: true, today: TODAY, exp: exp0 });
        }
        const exp = Date.now() + DAYS * 864e5;
        await redis(['SET', keyOf(email), String(exp), 'EX', String(DAYS * 86400 + 86400)]);
        return send(200, { ok: true, today: TODAY, exp });
      }

      // restore: imel la dwe VIP epi pa ekspire, sinon 401 (pa gen blokaj)
      const exp = Number(await redis(['GET', keyOf(email)])) || 0;
      if (exp > Date.now()) return send(200, { ok: true, today: TODAY, exp });
      return send(401, { ok: false });
    }

    // ansyen fason: kòd sèlman (kounye a ak limit IP)
    if (!codeOk(code)) return ipFail();
    return send(200, { ok: true, today: TODAY });
  } catch (e) {
    return send(500, { ok: false, error: 'server' });
  }
};
