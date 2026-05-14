// Web Speech API 기반 TTS
// 브라우저에 따라 지원 언어가 다름. iOS Safari는 시스템 보이스 사용.

let voicesCache = null;

function getVoices() {
  if (voicesCache) return voicesCache;
  if (typeof speechSynthesis === 'undefined') return [];
  voicesCache = speechSynthesis.getVoices();
  // 첫 호출이 비어있는 경우 (Chrome 이슈) 잠시 후 다시
  if (voicesCache.length === 0) {
    voicesCache = null;
  }
  return voicesCache || [];
}

// voices 로드 이벤트
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = () => {
    voicesCache = speechSynthesis.getVoices();
  };
}

const LANG_CODES = {
  ko: ['ko-KR', 'ko'],
  zh: ['zh-CN', 'zh-Hans-CN', 'zh', 'cmn-Hans-CN'],
  ja: ['ja-JP', 'ja'],
  en: ['en-US', 'en-GB', 'en-AU', 'en'],
};

function pickVoice(lang) {
  const voices = getVoices();
  if (voices.length === 0) return null;
  const codes = LANG_CODES[lang] || [lang];
  for (const code of codes) {
    const exact = voices.find(v => v.lang === code);
    if (exact) return exact;
  }
  for (const code of codes) {
    const partial = voices.find(v => v.lang && v.lang.startsWith(code.split('-')[0]));
    if (partial) return partial;
  }
  return null;
}

/**
 * 텍스트를 해당 언어로 발음
 * @param {string} text
 * @param {'ko'|'zh'|'ja'|'en'} lang
 * @param {object} opts {rate, pitch}
 */
export function speak(text, lang, opts = {}) {
  if (typeof speechSynthesis === 'undefined') return false;
  if (!text) return false;

  try {
    speechSynthesis.cancel(); // 기존 발화 중단
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(lang);
    if (voice) utter.voice = voice;
    utter.lang = (LANG_CODES[lang] && LANG_CODES[lang][0]) || lang;
    utter.rate = opts.rate ?? (lang === 'zh' || lang === 'ja' ? 0.85 : 0.95);
    utter.pitch = opts.pitch ?? 1.0;
    speechSynthesis.speak(utter);
    return true;
  } catch (e) {
    console.warn('TTS error:', e);
    return false;
  }
}

export function isTTSAvailable() {
  return typeof speechSynthesis !== 'undefined';
}

export function cancelTTS() {
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
  }
}
