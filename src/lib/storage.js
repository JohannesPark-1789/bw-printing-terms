// localStorage 헬퍼

const KEYS = {
  progress: 'bw-printing-progress-v2',     // 카드별 SRS 상태
  daily: 'bw-printing-daily',              // 일별 학습 기록 {date: {new, review, again}}
  settings: 'bw-printing-settings',        // 설정
  selectedCats: 'bw-printing-cats',
  installDismissed: 'bw-printing-install-dismissed',
};

const DEFAULTS = {
  settings: {
    dailyNewLimit: 20,        // 일일 신규 카드 수
    studyDirection: 'all',    // all | ko-to-zh | ko-to-ja | ko-to-en | zh-to-ko | ja-to-ko | en-to-ko
    enableTTS: true,          // TTS 발음 자동 재생
    showPronunFront: true,    // 카드 앞면에 발음 표시
  }
};

export const storage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  clear(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
};

export const getProgress = () => storage.get(KEYS.progress, {});
export const setProgress = (p) => storage.set(KEYS.progress, p);

export const getDaily = () => storage.get(KEYS.daily, {});
export const setDaily = (d) => storage.set(KEYS.daily, d);

export const getSettings = () => ({ ...DEFAULTS.settings, ...storage.get(KEYS.settings, {}) });
export const setSettings = (s) => storage.set(KEYS.settings, s);

export const getSelectedCats = (defaultCats) => storage.get(KEYS.selectedCats, defaultCats);
export const setSelectedCats = (c) => storage.set(KEYS.selectedCats, c);

export const getInstallDismissed = () => storage.get(KEYS.installDismissed, false);
export const setInstallDismissed = () => storage.set(KEYS.installDismissed, true);

/**
 * 오늘 학습 기록 업데이트
 */
export function logStudy(cardWasNew, rating) {
  const daily = getDaily();
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (!daily[key]) daily[key] = { new: 0, review: 0, again: 0, total: 0 };
  if (cardWasNew) daily[key].new += 1;
  else daily[key].review += 1;
  if (rating === 'again') daily[key].again += 1;
  daily[key].total += 1;
  setDaily(daily);
  return daily[key];
}

export const KEY_NAMES = KEYS;
