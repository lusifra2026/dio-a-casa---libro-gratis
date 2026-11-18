// Funzione serverless Vercel per la landing del LIBRO IN REGALO (/libro-gratis).
// Riceve nome, cognome, email, salva il lead sullo stesso Google Sheet (scheda «Lead»)
// e SOLO se il salvataggio riesce restituisce il link del PDF e quello dei bonus.
// Usa le stesse variabili d'ambiente della landing del bonus: non serve aggiungerne.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIBRO = 'Teologia Sistematica per Bambini con Dio a Casa (PDF in regalo)';
const PDF_PATH = '/dono-libro-r7m4/Teologia_Sistematica_per_Bambini_con_Dio_a_Casa.pdf';
const BONUS_PATH = '/app-insieme-8k2v/';

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve(null); }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (e) { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Metodo non consentito.' });
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  const pdfUrl = PDF_PATH;
  const bonusUrl = BONUS_PATH;
  if (!scriptUrl || !secret) {
    console.error('Configurazione mancante: controlla GOOGLE_SCRIPT_URL e APPS_SCRIPT_SECRET su Vercel.');
    return res.status(500).json({ ok: false, error: 'Il servizio non è ancora configurato. Riprova più tardi.' });
  }

  const body = await readBody(req);
  if (!body) return res.status(400).json({ ok: false, error: 'Richiesta non valida.' });

  // Honeypot: un bot compila il campo nascosto. Rispondiamo in modo neutro, senza salvare né dare il link.
  if (clean(body.sito, 200)) return res.status(400).json({ ok: false, error: 'Richiesta non valida.' });

  const nome = clean(body.nome, 80);
  const cognome = clean(body.cognome, 80);
  const email = clean(body.email, 160).toLowerCase();
  if (!nome || !cognome) return res.status(400).json({ ok: false, error: 'Scrivi nome e cognome.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'Controlla l’indirizzo email.' });
  if (body.consenso !== true) return res.status(400).json({ ok: false, error: 'Per ricevere il libro serve il tuo consenso.' });

  let upstream;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret, nome, cognome, email, libro: LIBRO, consenso: true, timestamp: new Date().toISOString() }),
      redirect: 'follow',
      signal: ctrl.signal
    });
    clearTimeout(t);
    const txt = await r.text();
    try { upstream = JSON.parse(txt); } catch (e) { upstream = null; }
    if (!r.ok) upstream = null;
  } catch (e) {
    console.error('Google Apps Script non raggiungibile:', e && e.message);
    upstream = null;
  }

  if (!upstream || upstream.ok !== true) {
    console.error('Salvataggio del lead non riuscito:', upstream && upstream.error);
    return res.status(502).json({ ok: false, error: 'Non siamo riusciti a registrare i tuoi dati. Riprova tra qualche minuto.' });
  }

  return res.status(200).json({ ok: true, pdfUrl, bonusUrl });
};
