import { serverCache } from '../services/cache.js';
import crypto from 'crypto';

const LANG_REGEX = /^[a-zA-Z_-]{2,10}$/;
const CHUNK_MAX = 1200;          // gtx-safe URL length per request
const PARALLEL = 4;              // concurrent gtx requests
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h per (lang, content hash)
const MAX_TEXT = 80000;          // README-scale guard (body limit is 100kb)

async function gtxFetch(text, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    throw new Error(`Google Translate API error: ${response.statusText}`);
  }
  const data = await response.json();
  let translatedText = '';
  if (data && data[0] && Array.isArray(data[0])) {
    data[0].forEach(segment => {
      if (segment && segment[0]) translatedText += segment[0];
    });
  }
  return translatedText || text;
}

/**
 * Split text into translatable prose chunks while preserving fenced code
 * blocks verbatim (translating code would corrupt it).
 */
function splitSegments(text) {
  const segments = [];
  const parts = text.split(/(```[\s\S]*?```|`[^`\n]+`)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('```') || (part.startsWith('`') && part.endsWith('`'))) {
      segments.push({ skip: true, text: part }); // code stays untouched
      continue;
    }
    // Chunk prose on paragraph boundaries, then sentence fallback
    let buffer = '';
    for (const para of part.split(/\n{2,}/)) {
      const piece = para.length ? para : '\n';
      if ((buffer + '\n\n' + piece).trim().length > CHUNK_MAX && buffer) {
        segments.push({ skip: false, text: buffer });
        buffer = piece;
      } else {
        buffer = buffer ? `${buffer}\n\n${piece}` : piece;
      }
      while (buffer.length > CHUNK_MAX) {
        // Single paragraph too long — hard split at sentence boundary
        const cut = buffer.lastIndexOf('. ', CHUNK_MAX);
        const at = cut > 200 ? cut + 1 : CHUNK_MAX;
        segments.push({ skip: false, text: buffer.slice(0, at) });
        buffer = buffer.slice(at);
      }
    }
    if (buffer.trim()) segments.push({ skip: false, text: buffer });
  }
  return segments;
}

export default async function translateText(req, res) {
  const { text, targetLang = 'en' } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: true, message: 'Text is required.' });
  }

  if (!LANG_REGEX.test(targetLang)) {
    return res.status(400).json({ error: true, message: 'Invalid target language format.' });
  }

  // Prevent giant payload abuse
  if (text.length > MAX_TEXT) {
    return res.status(400).json({ error: true, message: `Text exceeds maximum length of ${MAX_TEXT} characters.` });
  }

  const cacheKey = `tr:${targetLang}:${crypto.createHash('sha256').update(text).digest('hex').slice(0, 32)}`;
  const cached = serverCache.get(cacheKey);
  if (cached) {
    return res.json({ translatedText: cached, cached: true });
  }

  try {
    const segments = splitSegments(text);
    const proseIdx = segments.map((s, i) => (s.skip ? -1 : i)).filter(i => i >= 0);
    const translated = new Array(segments.length);

    // Translate prose in bounded-parallel batches; code segments pass through
    for (let start = 0; start < proseIdx.length; start += PARALLEL) {
      const batch = proseIdx.slice(start, start + PARALLEL);
      const results = await Promise.all(
        batch.map(i => gtxFetch(segments[i].text, targetLang).catch(() => segments[i].text))
      );
      batch.forEach((idx, j) => { translated[idx] = results[j]; });
    }
    segments.forEach((s, i) => { if (translated[i] === undefined) translated[i] = s.text; });

    const out = translated.join('');
    serverCache.set(cacheKey, out, CACHE_TTL);
    return res.json({ translatedText: out });
  } catch (err) {
    console.error('[Translate] Error:', err.message);
    return res.status(500).json({ error: true, message: err.message || 'Translation failed.' });
  }
}
