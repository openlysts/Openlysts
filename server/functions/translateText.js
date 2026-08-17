export default async function handle(req, res, { db }) {
  const { text, targetLang = 'en' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Google Translate returns an array where the first element is an array of translated segments.
    // e.g., [[[ "translated string 1", "original string 1", null, null, 1 ], ...]]
    let translatedText = '';
    if (data && data[0]) {
      data[0].forEach(segment => {
        if (segment[0]) translatedText += segment[0];
      });
    }

    res.json({ translatedText });
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: err.message });
  }
}
