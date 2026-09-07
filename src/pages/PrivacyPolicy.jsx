import React, { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Link } from 'react-router-dom';

const content = {
  en: {
    title: 'Privacy Policy & DPDP Notice',
    lastUpdated: 'August 30, 2026',
    intro: 'This Privacy Policy and Notice is provided pursuant to the Digital Personal Data Protection (DPDP) Act, 2023, and DPDP Rules 2025. It explains how Openlysts ("Data Fiduciary", "we", "us") collects, uses, and protects your personal data.',
    section1Title: '1. Personal Data We Collect',
    section1Text: 'When you use Openlysts, we may collect the following personal data:',
    section1List: [
      'Account Information: Name, email address, and encrypted password (if registering via email).',
      'OAuth Data: Provider name, provider account ID, avatar URL (if registering via GitHub or Google).',
      'Session Data: Login sessions, authentication cookies, and passkeys (if configured).',
      'Platform Data: Your bookmarks, preferences, and workspace settings.',
      'Audit Logs: IP addresses and user agent strings when performing critical actions (e.g., login, password change) for security monitoring.'
    ],
    section2Title: '2. Purpose of Processing',
    section2Text: 'We process your personal data solely for the following purposes:',
    section2List: [
      'To provide, operate, and maintain your Openlysts account and bookmarks.',
      'To authenticate you securely and prevent fraudulent or unauthorized access.',
      'To personalize your experience and enforce your preferences.',
      'To comply with our legal obligations regarding audit logging and security.'
    ],
    section3Title: '3. Data Principal Rights',
    section3Text: 'Under the DPDP Act 2023, you have the following rights regarding your personal data:',
    section3List: [
      'Right to Access: You may request a summary of the personal data being processed about you.',
      'Right to Correction: You may update or correct your personal data via your account settings.',
      'Right to Erasure: You may request the deletion of your personal data. We will erase your data upon account deletion, subject to legal retention requirements (e.g., audit logs).',
      'Right to Grievance Redressal: You have the right to register a grievance with our designated Grievance Officer.',
      'Right to Nominate: You may nominate an individual to exercise your rights in the event of your death or incapacity.',
      'Right to Withdraw Consent: You may withdraw your consent for processing at any time by deleting your account in the settings.'
    ],
    section4Title: '4. Third-Party Data Processors',
    section4Text: 'We use the following third-party services (Data Processors) to operate Openlysts:',
    section4List: [
      'Vercel (Hosting and infrastructure)',
      'Neon (PostgreSQL database hosting)',
      'Cloudflare (Turnstile bot protection)',
      'GitHub / Google (OAuth authentication providers)'
    ],
    section5Title: '5. Data Retention',
    section5Text: 'We retain your personal data only as long as necessary to fulfill the purposes outlined in this policy:',
    section5List: [
      'Account data (name, email, bookmarks, OAuth links) is retained until you delete your account or withdraw consent.',
      'Session cookies are retained for a maximum of 30 days of inactivity.',
      'Audit logs (including IP addresses) are retained for 1 year to comply with security and legal obligations (DPDP Rules 2025, Rule 8).'
    ],
    section6Title: '6. Children\'s Privacy',
    section6Text: 'Openlysts is strictly for users who are 18 years of age or older. We do not knowingly collect personal data from children under 18. By using Openlysts and providing your consent, you attest that you are at least 18 years old.',
    section7Title: '7. Security Safeguards',
    section7Text: 'We implement reasonable security safeguards as required by Section 8(4) of the DPDP Act, including:',
    section7List: [
      'Bcrypt hashing for all passwords.',
      'Secure, HTTP-only, SameSite cookies for session management.',
      'Enforced HTTPS/TLS encryption in transit.',
      'Strict rate limiting on authentication endpoints.'
    ],
    section8Title: '8. Cross-Border Transfers',
    section8Text: 'Your data is hosted in secure data centers managed by our infrastructure partners (Vercel, Neon). These facilities may be located outside of India. We ensure our partners adhere to stringent data protection standards.',
    section9Title: '9. Grievance Officer',
    section9Text: 'If you have any questions, concerns, or grievances regarding your personal data or this policy, please contact our Grievance Officer:',
    section9List: [
      'Name: Openlysts Privacy Officer (Placeholder)',
      'Via: Openlysts contact page (in-app contact form)',
      'Timeline: We will respond to your grievance within 30 days of receipt.',
      'Escalation: If your grievance is not resolved satisfactorily, you may escalate the matter to the Data Protection Board of India (https://dpbi.gov.in).'
    ],
  },
  hi: {
    title: 'गोपनीयता नीति और DPDP सूचना',
    lastUpdated: '30 अगस्त 2026',
    intro: 'यह गोपनीयता नीति और सूचना डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम, 2023 और DPDP नियम 2025 के अनुसार प्रदान की गई है। यह बताती है कि Openlysts ("डेटा फ़िड्यूशरी", "हम") आपके व्यक्तिगत डेटा को कैसे एकत्र, उपयोग और सुरक्षित करता है।',
    section1Title: '1. हम कौन सा व्यक्तिगत डेटा एकत्र करते हैं',
    section1Text: 'जब आप Openlysts का उपयोग करते हैं, तो हम निम्नलिखित व्यक्तिगत डेटा एकत्र कर सकते हैं:',
    section1List: [
      'खाता जानकारी: नाम, ईमेल पता और एन्क्रिप्टेड पासवर्ड (यदि ईमेल के माध्यम से पंजीकरण कर रहे हैं)।',
      'OAuth डेटा: प्रदाता का नाम, प्रदाता खाता आईडी, अवतार URL (यदि GitHub या Google के माध्यम से पंजीकरण कर रहे हैं)।',
      'सत्र (Session) डेटा: लॉगिन सत्र, प्रमाणीकरण कुकीज़ और पासकी (यदि कॉन्फ़िगर किया गया है)।',
      'प्लेटफ़ॉर्म डेटा: आपके बुकमार्क, प्राथमिकताएं और कार्यक्षेत्र सेटिंग्स।',
      'ऑडिट लॉग: सुरक्षा निगरानी के लिए महत्वपूर्ण कार्य (जैसे लॉगिन, पासवर्ड बदलना) करते समय आईपी पते।'
    ],
    section2Title: '2. प्रसंस्करण का उद्देश्य',
    section2Text: 'हम आपके व्यक्तिगत डेटा का प्रसंस्करण केवल निम्नलिखित उद्देश्यों के लिए करते हैं:',
    section2List: [
      'आपके Openlysts खाते और बुकमार्क प्रदान करने, संचालित करने और बनाए रखने के लिए।',
      'आपको सुरक्षित रूप से प्रमाणित करने और अनधिकृत पहुंच को रोकने के लिए।',
      'आपके अनुभव को वैयक्तिकृत करने और आपकी प्राथमिकताओं को लागू करने के लिए।',
      'ऑडिट लॉगिंग और सुरक्षा के संबंध में हमारे कानूनी दायित्वों का पालन करने के लिए।'
    ],
    section3Title: '3. डेटा प्रिंसिपल के अधिकार',
    section3Text: 'DPDP अधिनियम 2023 के तहत, आपके व्यक्तिगत डेटा के संबंध में आपके निम्नलिखित अधिकार हैं:',
    section3List: [
      'पहुंच का अधिकार: आप अपने संसाधित किए जा रहे व्यक्तिगत डेटा का सारांश मांग सकते हैं।',
      'सुधार का अधिकार: आप अपनी खाता सेटिंग्स के माध्यम से अपना व्यक्तिगत डेटा अपडेट या सही कर सकते हैं।',
      'मिटाने का अधिकार: आप अपने व्यक्तिगत डेटा को हटाने का अनुरोध कर सकते हैं। कानूनी प्रतिधारण आवश्यकताओं के अधीन, खाता हटाने पर हम आपका डेटा मिटा देंगे।',
      'शिकायत निवारण का अधिकार: आपको हमारे नामित शिकायत अधिकारी के पास शिकायत दर्ज करने का अधिकार है।',
      'नामांकन का अधिकार: आप मृत्यु या अक्षमता की स्थिति में अपने अधिकारों का प्रयोग करने के लिए किसी व्यक्ति को नामित कर सकते हैं।',
      'सहमति वापस लेने का अधिकार: आप सेटिंग्स में अपना खाता हटाकर किसी भी समय प्रसंस्करण के लिए अपनी सहमति वापस ले सकते हैं।'
    ],
    section4Title: '4. थर्ड-पार्टी डेटा प्रोसेसर',
    section4Text: 'हम Openlysts को संचालित करने के लिए निम्नलिखित तृतीय-पक्ष सेवाओं (डेटा प्रोसेसर) का उपयोग करते हैं:',
    section4List: [
      'Vercel (होस्टिंग और इंफ्रास्ट्रक्चर)',
      'Neon (PostgreSQL डेटाबेस होस्टिंग)',
      'Cloudflare (Turnstile बॉट सुरक्षा)',
      'GitHub / Google (OAuth प्रमाणीकरण प्रदाता)'
    ],
    section5Title: '5. डेटा प्रतिधारण (Retention)',
    section5Text: 'हम आपके व्यक्तिगत डेटा को केवल तब तक बनाए रखते हैं जब तक इस नीति में उल्लिखित उद्देश्यों को पूरा करने के लिए आवश्यक हो:',
    section5List: [
      'खाता डेटा (नाम, ईमेल, बुकमार्क, OAuth लिंक) तब तक रखा जाता है जब तक आप अपना खाता हटा नहीं देते या सहमति वापस नहीं लेते।',
      'सत्र कुकीज़ 30 दिनों की निष्क्रियता तक रखी जाती हैं।',
      'ऑडिट लॉग (आईपी पते सहित) सुरक्षा और कानूनी दायित्वों का पालन करने के लिए 1 वर्ष तक बनाए रखे जाते हैं।'
    ],
    section6Title: '6. बच्चों की गोपनीयता',
    section6Text: 'Openlysts केवल उन उपयोगकर्ताओं के लिए है जो 18 वर्ष या उससे अधिक आयु के हैं। हम 18 वर्ष से कम उम्र के बच्चों से जानबूझकर व्यक्तिगत डेटा एकत्र नहीं करते हैं। सहमति प्रदान करके, आप प्रमाणित करते हैं कि आपकी आयु कम से कम 18 वर्ष है।',
    section7Title: '7. सुरक्षा उपाय',
    section7Text: 'हम DPDP अधिनियम की धारा 8(4) के अनुसार उचित सुरक्षा उपाय लागू करते हैं, जिनमें शामिल हैं:',
    section7List: [
      'सभी पासवर्ड के लिए Bcrypt हैशिंग।',
      'सत्र प्रबंधन के लिए सुरक्षित, HTTP-only, SameSite कुकीज़।',
      'ट्रांजिट में HTTPS/TLS एन्क्रिप्शन।',
      'प्रमाणीकरण एंडपॉइंट्स पर दर सीमन (Rate limiting)।'
    ],
    section8Title: '8. सीमा पार स्थानांतरण',
    section8Text: 'आपका डेटा हमारे बुनियादी ढांचा भागीदारों (Vercel, Neon) द्वारा प्रबंधित सुरक्षित डेटा केंद्रों में होस्ट किया जाता है। ये सुविधाएँ भारत के बाहर स्थित हो सकती हैं। हम सुनिश्चित करते हैं कि हमारे भागीदार कड़े डेटा संरक्षण मानकों का पालन करें।',
    section9Title: '9. शिकायत अधिकारी',
    section9Text: 'यदि आपके व्यक्तिगत डेटा या इस नीति के संबंध में आपके कोई प्रश्न या शिकायतें हैं, तो कृपया हमारे शिकायत अधिकारी से संपर्क करें:',
    section9List: [
      'नाम: Openlysts गोपनीयता अधिकारी (Placeholder)',
      'संपर्क: Openlysts संपर्क पृष्ठ (इन-ऐप संपर्क फ़ॉर्म)',
      'समयरेखा: हम प्राप्ति के 30 दिनों के भीतर आपकी शिकायत का जवाब देंगे।',
      'वृद्धि (Escalation): यदि आपकी शिकायत का संतोषजनक समाधान नहीं होता है, तो आप भारतीय डेटा संरक्षण बोर्ड (https://dpbi.gov.in) को मामला बढ़ा सकते हैं।'
    ],
  }
};

export default function PrivacyPolicy() {
  usePageTitle('Privacy Policy');
  const [lang, setLang] = useState('en');

  const t = content[lang];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-text">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setLang('en')} 
            className={`px-3 py-1 rounded-md text-sm transition-colors ${lang === 'en' ? 'bg-primary text-primary-content' : 'bg-bg-subtle text-text-secondary hover:bg-bg-modifier-hover'}`}
          >
            English
          </button>
          <button 
            onClick={() => setLang('hi')} 
            className={`px-3 py-1 rounded-md text-sm transition-colors ${lang === 'hi' ? 'bg-primary text-primary-content' : 'bg-bg-subtle text-text-secondary hover:bg-bg-modifier-hover'}`}
          >
            हिंदी
          </button>
        </div>
      </div>
      <p className="mb-8 text-text-muted"><strong>Last Updated:</strong> {t.lastUpdated}</p>
      
      <div className="space-y-6 text-text-secondary leading-relaxed pb-12">
        <p className="mb-4">{t.intro}</p>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">{t.section1Title}</h2>
          <p className="mb-2">{t.section1Text}</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            {t.section1List.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">{t.section2Title}</h2>
          <p className="mb-2">{t.section2Text}</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            {t.section2List.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">{t.section3Title}</h2>
          <p className="mb-2">{t.section3Text}</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            {t.section3List.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">{t.section4Title}</h2>
          <p className="mb-2">{t.section4Text}</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            {t.section4List.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">{t.section5Title}</h2>
          <p className="mb-2">{t.section5Text}</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            {t.section5List.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">{t.section6Title}</h2>
          <p className="mb-2">{t.section6Text}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">{t.section7Title}</h2>
          <p className="mb-2">{t.section7Text}</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            {t.section7List.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">{t.section8Title}</h2>
          <p className="mb-2">{t.section8Text}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">{t.section9Title}</h2>
          <p className="mb-2">{t.section9Text}</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            {t.section9List.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>
        
        <div className="mt-8">
          <Link to="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
