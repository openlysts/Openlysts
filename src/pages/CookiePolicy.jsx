import React, { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Link } from 'react-router-dom';

const content = {
  en: {
    title: 'Cookie Policy',
    lastUpdated: 'September 6, 2026',
    intro: 'This policy explains what cookies and similar storage technologies Openlysts uses, why we use them, and the choices you have. It applies to openlysts.dpdns.org and to the installed (PWA) version of the Service.',
    sections: [
      {
        title: '1. What we store and why',
        items: [
          'Session cookie (connect.sid) — keeps you signed in. Strictly necessary; expires when you sign out or after a period of inactivity.',
          'Cloudflare Turnstile — bot-protection challenge. Strictly necessary for security; managed by Cloudflare inside its own iframe.',
          'Browser storage (localStorage) — your theme choice, developer preferences, guest bookmarks, and compare tray. Stored only on your device.',
          'Account data (bookmarks, preferences) — synced to our secure PostgreSQL database when you are signed in, so they persist across devices.',
          'Analytics/advertising cookies — none. We do not run third-party analytics or advertising trackers today.',
        ],
      },
      {
        title: '2. Your choices',
        items: [
          'Sign out to end your session cookie.',
          'Use Settings → "Reset to defaults" or "Delete my account" to clear browser-stored data.',
          'Clear site data from your browser (Settings → Privacy → Clear site data). For the installed app, clear storage from your browser menu or reinstall.',
          'If we ever introduce optional cookies, we will ask for your consent first and update this policy.',
        ],
      },
      {
        title: '3. Contact',
        items: [
          'Questions about this policy? Submit them through the Contact form on the Openlysts website. See the Privacy Policy for your full data rights.',
        ],
      },
    ],
  },
  hi: {
    title: 'कुकी नीति',
    lastUpdated: '6 सितंबर 2026',
    intro: 'यह नीति बताती है कि Openlysts कौन सी कुकीज़ और समान स्टोरेज तकनीकों का उपयोग करता है, क्यों, और आपके पास क्या विकल्प हैं। यह openlysts.dpdns.org और इंस्टॉल किए गए (PWA) संस्करण पर लागू होती है।',
    sections: [
      {
        title: '1. हम क्या संग्रहीत करते हैं और क्यों',
        items: [
          'सत्र कुकी (connect.sid) — आपको साइन इन रखती है। आवश्यक; साइन आउट करने पर या निष्क्रियता की अवधि के बाद समाप्त होती है।',
          'Cloudflare Turnstile — बॉट सुरक्षा चुनौती। सुरक्षा के लिए आवश्यक; Cloudflare द्वारा अपने iframe में प्रबंधित।',
          'ब्राउज़र स्टोरेज (localStorage) — आपकी थीम, वरीयताएँ, गेस्ट बुकमार्क और तुलना ट्रे। केवल आपके डिवाइस पर संग्रहीत।',
          'खाता डेटा (बुकमार्क, वरीयताएँ) — साइन इन होने पर हमारे सुरक्षित PostgreSQL डेटाबेस में सिंक होता है।',
          'विश्लेषण/विज्ञापन कुकीज़ — कोई नहीं। हम आज कोई तृतीय-पक्ष ट्रैकर नहीं चलाते।',
        ],
      },
      {
        title: '2. आपके विकल्प',
        items: [
          'सत्र कुकी समाप्त करने के लिए साइन आउट करें।',
          'सेटिंग्स → "रीसेट टू डिफॉल्ट्स" या "मेरा खाता हटाएं" से ब्राउज़र डेटा साफ़ करें।',
          'ब्राउज़र से साइट डेटा साफ़ करें (सेटिंग्स → गोपनीयता → साइट डेटा साफ़ करें)।',
          'यदि हम कभी वैकल्पिक कुकीज़ जोड़ते हैं, तो पहले आपकी सहमति ली जाएगी।',
        ],
      },
      {
        title: '3. संपर्क',
        items: [
          'इस नीति के बारे में प्रश्न? Openlysts वेबसाइट पर संपर्क फ़ॉर्म के माध्यम से भेजें। पूर्ण डेटा अधिकारों के लिए गोपनीयता नीति देखें।',
        ],
      },
    ],
  },
};

export default function CookiePolicy() {
  usePageTitle('Cookie Policy');
  const [lang, setLang] = useState('en');
  const t = content[lang] || content.en;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text">{t.title}</h1>
        <div className="flex gap-1.5">
          {['en', 'hi'].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors touch-target ${lang === l ? 'bg-accent text-accent-fg' : 'bg-bg-card border border-border text-text-secondary'}`}
              aria-pressed={lang === l}
            >
              {l === 'en' ? 'EN' : 'हिंदी'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <p className="text-xs text-text-muted mb-1">Last updated: {t.lastUpdated}</p>
          <p className="text-sm text-text-secondary leading-relaxed">{t.intro}</p>
        </div>

        {t.sections.map((section) => (
          <div key={section.title} className="card p-6">
            <h2 className="font-bold text-text text-base mb-3">{section.title}</h2>
            <ul className="space-y-2.5">
              {section.items.map((item, i) => (
                <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                  <span className="text-accent flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className="text-sm text-text-muted text-center pt-2">
          <Link to="/privacy-policy" className="text-accent hover:underline">Privacy Policy</Link>
          {' · '}
          <Link to="/terms-of-service" className="text-accent hover:underline">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}