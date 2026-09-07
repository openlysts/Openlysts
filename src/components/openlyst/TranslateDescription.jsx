import React, { useState, useEffect } from 'react';
import { Languages, Loader2, RefreshCw } from 'lucide-react';
import { translateText } from '@/lib/api';
import { LANGUAGES } from '@/lib/languages';

export default function TranslateDescription({ text }) {
  const [targetLang, setTargetLang] = useState('original');
  const [translatedText, setTranslatedText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);

  // If original text changes, reset
  useEffect(() => {
    if (targetLang === 'original') {
      setTranslatedText(text);
    }
  }, [text, targetLang]);

  const handleTranslate = async (lang) => {
    setTargetLang(lang);
    if (lang === 'original') {
      setTranslatedText(text);
      setError(null);
      return;
    }

    setIsTranslating(true);
    setError(null);
    try {
      const result = await translateText(text, lang);
      if (result?.translatedText) {
        setTranslatedText(result.translatedText);
      } else {
        throw new Error('No translation returned');
      }
    } catch (err) {
      console.error('Translation failed:', err);
      setError('Failed to translate text.');
      setTranslatedText(text);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="space-y-3 mb-5">
      <div className="flex items-center gap-2">
        <Languages className="w-4 h-4 text-text-muted" />
        <select
          aria-label="Translate description to language"
          value={targetLang}
          onChange={(e) => handleTranslate(e.target.value)}
          disabled={isTranslating}
          className="bg-bg-subtle text-text text-xs font-medium border border-border rounded-md px-2 py-1 outline-none focus:border-accent transition-colors disabled:opacity-50"
        >
          <option value="original">Original Language</option>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        
        {isTranslating && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            Translating...
          </div>
        )}

        {error && (
          <div className="text-xs text-destructive">
            {error}
          </div>
        )}
      </div>

      <div className={`relative transition-opacity duration-300 ${isTranslating ? 'opacity-50' : 'opacity-100'}`}>
        <p className="text-text-secondary text-base leading-relaxed">
          {translatedText}
        </p>
        
        {targetLang !== 'original' && !isTranslating && (
          <button 
            onClick={() => handleTranslate('original')}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            Show Original
          </button>
        )}
      </div>
    </div>
  );
}
