// Vercel serverless function: POST /api/vip
//
// 3 fason pou itilize l:
//  1) { action:'activate', code, email }  -> kòd jou a bon => imel la anrejistre pou 30 jou
//  2) { action:'restore',  email }        -> imel la deja VIP epi pa ekspire => VIP rekonèt ankò (telefòn pèdi/reyajiste)
//  3) { code }                            -> ansyen fason (verifye kòd la sèlman), kenbe pou konpatibilite
//
// Kòd VIP yo rete nan Environment Variable VIP_CODES (separe ak virgil: KOD1,KOD2).
// Imel yo anrejistre nan Upstash Redis (Vercel -> Storage). Varyab yo mete otomatikman:
//   KV_REST_API_URL + KV_REST_API_TOKEN   (oswa UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
const crypto = require('crypto');

// Nimewo VIP jodi a. Chak jou, chanje nimewo a isit la.
const TODAY = '380';
const DAYS = 30;
const MAX_TRIES = 20; // maksimòm eseye pa IP chak 10 minit
const MAX_FAILS = 3; // echèk ak menm imel anvan blokaj
const BLOCK_SECONDS = 4 * 3600; // blokaj 4 èdtan

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

  try {
    if (action === 'activate' || action === 'restore') {
      // limit eseye pa IP (anpeche moun devine imel yo)
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
      const rk = 'rl:' + ip;
      const n = Number(await redis(['INCR', rk]));
      if (n === 1) await redis(['EXPIRE', rk, '600']);
      if (n > MAX_TRIES) return send(429, { ok: false });

      const email = cleanEmail(body.email);
      if (!email) return send(401, { ok: false });

      // 3 echèk ak menm imel => bloke 4 èdtan
      const fk = 'fail:' + keyOf(email);
      const fails = Number(await redis(['GET', fk])) || 0;
      if (fails >= MAX_FAILS) return send(429, { ok: false, blocked: true });
      const fail = async () => {
        const f = Number(await redis(['INCR', fk]));
        await redis(['EXPIRE', fk, String(BLOCK_SECONDS)]);
        return send(f >= MAX_FAILS ? 429 : 401, { ok: false, blocked: f >= MAX_FAILS });
      };

      if (action === 'activate') {
        if (!codeOk(code)) return fail();
        const exp = Date.now() + DAYS * 864e5;
        await redis(['SET', keyOf(email), String(exp), 'EX', String(DAYS * 86400 + 86400)]);
        await redis(['DEL', fk]);
        return send(200, { ok: true, today: TODAY, exp });
      }

      const v = await redis(['GET', keyOf(email)]);
      const exp = Number(v) || 0;
      if (exp > Date.now()) {
        await redis(['DEL', fk]);
        return send(200, { ok: true, today: TODAY, exp });
      }
      return fail();
    }

    // ansyen fason: kòd sèlman
    const ok = codeOk(code);
    return send(ok ? 200 : 401, ok ? { ok: true, today: TODAY } : { ok: false });
  } catch (e) {
    return send(500, { ok: false, error: 'server' });
  }
};
