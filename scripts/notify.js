const fs = require("fs");
const path = require("path");

const APP_ID = process.env.ONESIGNAL_APP_ID;
const API_KEY = process.env.ONESIGNAL_API_KEY;
const SITE = "https://www.floridamagicv7.com";
const FORCE = process.env.FORCE === "true";
const STATE_FILE = path.join(__dirname, "state.json");

const SOURCES = [
  { id: "fl", name: "Florida", url: `${SITE}/api/results`, keys: ["mid", "eve"] },
  { id: "ga", name: "Georgia", url: `${SITE}/api/results?state=ga`, keys: ["mid", "eve", "nig"] },
  { id: "ny", name: "New York", url: `${SITE}/api/results?state=ny`, keys: ["mid", "eve"] },
];
const SESS = {
  mid: { fr: "Midi", es: "Mediodía", en: "Midday" },
  eve: { fr: "Soir", es: "Noche", en: "Evening" },
  nig: { fr: "Nuit", es: "Noche", en: "Night" },
};
const SESS_GA_EVE = { fr: "Soir", es: "Tarde", en: "Evening" };

function etDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 864e5);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch (e) { return null; }
}

async function fetchRows(src) {
  try {
    const r = await fetch(src.url + (src.url.includes("?") ? "&" : "?") + Date.now(), { cache: "no-store" });
    const d = await r.json();
    return Array.isArray(d.rows) ? d.rows : [];
  } catch (e) {
    console.log(src.id, "erè:", e.message);
    return null;
  }
}

function collect(src, rows) {
  const recent = new Set([etDate(0), etDate(-1)]);
  const out = [];
  for (const row of rows) {
    if (!recent.has(row.date)) continue;
    for (const k of src.keys) {
      const a = row[k + "3"], b = row[k + "4"];
      if (/^\d{3}$/.test(a || "") && /^\d{4}$/.test(b || "")) {
        out.push({ id: `${src.id}|${row.date}|${k}`, src, key: k, a, b });
      }
    }
  }
  return out;
}

async function collectSD() {
  const rows = [];
  let ok = false;
  for (const u of [`${SITE}/api/sd`, `${SITE}/sd-results.json`]) {
    try {
      const r = await fetch(u + "?" + Date.now(), { cache: "no-store" });
      if (!r.ok) continue;
      const d = await r.json();
      const arr = Array.isArray(d) ? d : d && d.rows;
      if (Array.isArray(arr)) { rows.push(...arr); ok = true; }
    } catch (e) { console.log("sd erè:", u, e.message); }
  }
  if (!ok) return [];
  const recent = new Set([etDate(0), etDate(-1)]);
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (!r || !r.date || !r.name || !r.nums || !recent.has(r.date)) continue;
    const nums = String(r.nums).trim().split(/[\s-]+/).join(" · ");
    const id = `sd|${r.date}|${r.name}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, sd: true, name: r.name, nums });
  }
  return out;
}

// Rezilta VIP piblik yo (fichye vip.json ou modifye chak jou)
async function collectVIP() {
  try {
    const r = await fetch(`${SITE}/vip.json?${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return [];
    const d = await r.json();
    if (!Array.isArray(d)) return [];
    const out = [];
    const seen = new Set();
    for (const x of d) {
      if (!x || !x.numbers) continue;
      const label = [x.date, x.session].filter(Boolean).join(" · ");
      const nums = String(x.numbers).trim();
      const id = `vip|${x.date || ""}|${x.session || ""}|${nums}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ id, vip: true, label, nums });
    }
    return out;
  } catch (e) {
    console.log("vip erè:", e.message);
    return [];
  }
}

async function post(payload) {
  const r = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${API_KEY}` },
    body: JSON.stringify(payload),
  });
  console.log("OneSignal", r.status, await r.text());
  return r.ok;
}

async function send(item) {
  if (item.vip) {
    return post({
      app_id: APP_ID,
      target_channel: "push",
      // Sèlman moun ki PA VIP (tag vip != true). Moun VIP yo pa resevwa notifikasyon sa a.
      filters: [{ field: "tag", key: "vip", relation: "!=", value: "true" }],
      headings: { en: "💎 VIP", fr: "💎 VIP", es: "💎 VIP" },
      contents: {
        en: `VIP result: ${item.label} — ${item.nums}`,
        fr: `Résultat VIP : ${item.label} — ${item.nums}`,
        es: `Resultado VIP: ${item.label} — ${item.nums}`,
      },
      url: SITE + "/",
    });
  }
  if (item.sd) {
    return post({
      app_id: APP_ID,
      target_channel: "push",
      included_segments: ["Subscribed Users"],
      headings: { en: `🎯 ${item.name}`, fr: `🎯 ${item.name}`, es: `🎯 ${item.name}` },
      contents: {
        en: `Result is out: ${item.nums}`,
        fr: `Résultat disponible : ${item.nums}`,
        es: `Resultado disponible: ${item.nums}`,
      },
      url: SITE + "/",
      collapse_id: "result-sd-" + item.name.replace(/[^a-z0-9]/gi, "").toLowerCase(),
    });
  }
  const sess = item.src.id === "ga" && item.key === "eve" ? SESS_GA_EVE : SESS[item.key];
  const nums = `${item.a} · ${item.b}`;
  return post({
    app_id: APP_ID,
    target_channel: "push",
    included_segments: ["Subscribed Users"],
    headings: {
      en: `🎯 ${item.src.name} — ${sess.en}`,
      fr: `🎯 ${item.src.name} — ${sess.fr}`,
      es: `🎯 ${item.src.name} — ${sess.es}`,
    },
    contents: {
      en: `Result is out: ${nums}`,
      fr: `Résultat disponible : ${nums}`,
      es: `Resultado disponible: ${nums}`,
    },
    url: SITE + "/",
    collapse_id: "result-" + item.src.id + "-" + item.key,
  });
}

(async () => {
  if (!API_KEY) { console.error("ONESIGNAL_API_KEY manke nan GitHub Secrets."); process.exit(1); }

  if (FORCE) {
    const ok = await send({ id: "test", src: { id: "test", name: "TEST" }, key: "mid", a: "123", b: "4567" });
    process.exit(ok ? 0 : 1);
  }

  const prev = loadState();
  const sent = new Set(prev ? prev.sent : []);
  const found = [];
  for (const src of SOURCES) {
    const rows = await fetchRows(src);
    if (rows) found.push(...collect(src, rows));
  }
  found.push(...(await collectSD()));
  found.push(...(await collectVIP()));

  if (!prev) {
    found.forEach((f) => sent.add(f.id));
    console.log("Premye egzekisyon: okenn notifikasyon voye.");
  } else {
    if (![...sent].some((x) => x.startsWith("sd|"))) {
      found.filter((f) => f.sd).forEach((f) => sent.add(f.id));
    }
    if (![...sent].some((x) => x.startsWith("vip|"))) {
      found.filter((f) => f.vip).forEach((f) => sent.add(f.id));
      console.log("Rezilta VIP yo anrejistre an silans (premye fwa).");
    }
    const fresh = found.filter((f) => !sent.has(f.id));
    console.log("Nouvo rezilta:", fresh.length);
    for (const f of fresh) {
      if (await send(f)) sent.add(f.id);
    }
  }

  const all = [...sent];
  const vipIds = all.filter((x) => x.startsWith("vip|")).slice(-300);
  const list = all.filter((x) => !x.startsWith("vip|")).sort().slice(-80).concat(vipIds);
  fs.writeFileSync(STATE_FILE, JSON.stringify({ sent: list }, null, 2) + "\n");
})();
