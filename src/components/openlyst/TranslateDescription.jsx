import React, { useState, useEffect } from 'react';
import { Languages, Loader2, RefreshCw } from 'lucide-react';
import { translateText } from '@/lib/api';

export default function TranslateDescription({ text }) {
  const [targetLang, setTargetLang] = useState('en');
  const [translatedText, setTranslatedText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);

  // If original text changes, reset
  useEffect(() => {
    if (targetLang === 'en') {
      setTranslatedText(text);
    }
  }, [text, targetLang]);

  const handleTranslate = async (lang) => {
    setTargetLang(lang);
    if (lang === 'en') {
      setTranslatedText(text);
      setError(null);
      return;
    }

    setIsTranslating(true);
    setError(null);
    try {
      const result = await translateText(text, lang);
      if (result?.translated) {
        setTranslatedText(result.translated);
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
          value={targetLang}
          onChange={(e) => handleTranslate(e.target.value)}
          disabled={isTranslating}
          className="bg-bg-subtle text-text text-xs font-medium border border-border rounded-md px-2 py-1 outline-none focus:border-accent transition-colors disabled:opacity-50"
        >
          <option value="en">Original (English)</option>
          <option value="es">Spanish (Español)</option>
          <option value="fr">French (Français)</option>
          <option value="de">German (Deutsch)</option>
          <option value="zh">Chinese (中文)</option>
          <option value="ja">Japanese (日本語)</option>
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
        
        {targetLang !== 'en' && !isTranslating && (
          <button 
            onClick={() => handleTranslate('en')}
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
