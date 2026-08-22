export default async function translateText(req, res) {
  const { text, targetLang = 'en' } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: true, message: 'Text is required.' });
  }

  // Prevent giant payload abuse
  if (text.length > 5000) {
    return res.status(400).json({ error: true, message: 'Text exceeds maximum length of 5000 characters.' });
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
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

    return res.json({ translatedText: translatedText || text });
  } catch (err) {
    console.error('[Translate] Error:', err.message);
    return res.status(500).json({ error: true, message: err.message || 'Translation failed.' });
  }
}
