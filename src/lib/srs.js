// SM-2 기반 간격반복 알고리즘 (Anki 변형)
// 카드마다 ease factor, interval, repetitions 추적

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MIN = 60 * 1000;

// 응답 → SM-2 등급
// again(0) / hard(3) / good(4) / easy(5)
const RATINGS = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

/**
 * 카드 학습 상태 초기값
 */
export function newCardState() {
  return {
    status: 'new',          // 'new' | 'learning' | 'review' | 'lapsed'
    ease: 2.5,              // ease factor (난이도 계수)
    interval: 0,            // 다음 복습까지 일수
    repetitions: 0,         // 성공 연속 횟수
    lapses: 0,              // 실패 누적 횟수
    learningStep: 0,        // 학습 단계 (1m, 10m 순)
    due: Date.now(),        // 다음 복습 시각 (ms timestamp)
    lastSeen: null,         // 마지막 학습 시각
    totalSeen: 0,           // 총 학습 횟수
    history: [],            // 최근 응답 기록 (최대 10개)
  };
}

/**
 * 응답에 따라 카드 상태 업데이트
 * @param {Object} card 현재 상태 (null이면 new)
 * @param {'again'|'hard'|'good'|'easy'} rating
 * @returns {Object} 새 상태
 */
export function applyRating(card, rating) {
  const now = Date.now();
  const c = card || newCardState();
  const next = { ...c, lastSeen: now, totalSeen: c.totalSeen + 1 };

  // 응답 기록 (최근 10개)
  next.history = [...(c.history || []), { rating, at: now }].slice(-10);

  // 학습 단계 (Learning steps): 1분 → 10분 → 졸업 (review)
  const learningSteps = [1, 10]; // 분

  if (next.status === 'new' || next.status === 'learning') {
    if (rating === 'again') {
      next.status = 'learning';
      next.learningStep = 0;
      next.due = now + learningSteps[0] * MS_PER_MIN;
    } else if (rating === 'hard') {
      next.status = 'learning';
      // 같은 단계 반복
      next.due = now + learningSteps[next.learningStep] * MS_PER_MIN;
    } else if (rating === 'good') {
      next.learningStep += 1;
      if (next.learningStep >= learningSteps.length) {
        // 졸업: review로
        next.status = 'review';
        next.interval = 1; // 1일
        next.ease = c.ease;
        next.due = now + next.interval * MS_PER_DAY;
      } else {
        next.status = 'learning';
        next.due = now + learningSteps[next.learningStep] * MS_PER_MIN;
      }
    } else if (rating === 'easy') {
      // 졸업 + 보너스
      next.status = 'review';
      next.interval = 4; // 4일
      next.ease = c.ease + 0.15;
      next.due = now + next.interval * MS_PER_DAY;
    }
    return next;
  }

  // Review 상태
  if (next.status === 'review' || next.status === 'lapsed') {
    if (rating === 'again') {
      // 실패 → lapsed → 다시 학습으로
      next.lapses = c.lapses + 1;
      next.status = 'lapsed';
      next.learningStep = 0;
      next.ease = Math.max(1.3, c.ease - 0.2);
      next.interval = 0;
      next.due = now + learningSteps[0] * MS_PER_MIN;
    } else if (rating === 'hard') {
      next.ease = Math.max(1.3, c.ease - 0.15);
      next.interval = Math.max(1, Math.round(c.interval * 1.2));
      next.due = now + next.interval * MS_PER_DAY;
      next.repetitions = c.repetitions + 1;
    } else if (rating === 'good') {
      next.ease = c.ease;
      next.interval = Math.max(1, Math.round(c.interval * c.ease));
      next.due = now + next.interval * MS_PER_DAY;
      next.repetitions = c.repetitions + 1;
    } else if (rating === 'easy') {
      next.ease = c.ease + 0.15;
      next.interval = Math.max(1, Math.round(c.interval * c.ease * 1.3));
      next.due = now + next.interval * MS_PER_DAY;
      next.repetitions = c.repetitions + 1;
    }
    return next;
  }

  return next;
}

/**
 * 다음 복습 시간을 사람이 읽기 좋은 문자열로
 */
export function nextDueLabel(card) {
  if (!card || card.status === 'new') return '신규';
  const now = Date.now();
  const ms = card.due - now;
  if (ms <= 0) return '지금';
  const min = Math.round(ms / MS_PER_MIN);
  if (min < 60) return `${min}분`;
  const hr = Math.round(ms / (60 * MS_PER_MIN));
  if (hr < 24) return `${hr}시간`;
  const day = Math.round(ms / MS_PER_DAY);
  if (day < 30) return `${day}일`;
  if (day < 365) return `${Math.round(day / 30)}개월`;
  return `${Math.round(day / 365)}년`;
}

/**
 * 학습 큐 구성
 * 우선순위:
 *   1. 학습 중 (learning/lapsed) due 지난 카드
 *   2. 복습 (review) due 지난 카드
 *   3. 신규 카드 (오늘 한도 내에서)
 *
 * @param {Array} allItems  - 전체 데이터 (id 필드 있음)
 * @param {Object} progress - 카드별 학습 상태 맵
 * @param {Object} options
 *   - dailyNewLimit: 하루 신규 카드 수 (기본 20)
 *   - selectedCats: 선택된 카테고리 배열
 *   - sessionDate: 오늘 날짜 (yyyy-mm-dd)
 *   - newToday: 오늘 이미 본 신규 카드 수
 * @returns {{queue, dueCount, newAvailable, learningCount, reviewCount}}
 */
export function buildQueue(allItems, progress, options = {}) {
  const {
    dailyNewLimit = 20,
    selectedCats = null,
    newToday = 0,
  } = options;

  const now = Date.now();
  const filtered = selectedCats
    ? allItems.filter(it => selectedCats.includes(it.cat))
    : allItems;

  const learning = [];
  const review = [];
  const newCards = [];

  for (const item of filtered) {
    const p = progress[item.id];
    if (!p || p.status === 'new') {
      newCards.push(item);
    } else if (p.status === 'learning' || p.status === 'lapsed') {
      if (p.due <= now) learning.push({ item, p });
    } else if (p.status === 'review') {
      if (p.due <= now) review.push({ item, p });
    }
  }

  // 학습/복습은 due 빠른 순
  learning.sort((a, b) => a.p.due - b.p.due);
  review.sort((a, b) => a.p.due - b.p.due);

  // 신규 카드는 카테고리·id 순 안정 정렬
  newCards.sort((a, b) => a.id.localeCompare(b.id));

  const newRemaining = Math.max(0, dailyNewLimit - newToday);
  const newToShow = newCards.slice(0, newRemaining);

  // 큐 구성: 학습 중인 카드를 가장 먼저, 그 다음 복습, 신규를 섞어 배치
  // 신규와 복습을 섞어서 단조롭지 않게
  const queue = [...learning.map(x => x.item)];

  // 복습과 신규를 번갈아 배치
  const reviewItems = review.map(x => x.item);
  let ri = 0, ni = 0;
  while (ri < reviewItems.length || ni < newToShow.length) {
    if (ri < reviewItems.length) queue.push(reviewItems[ri++]);
    if (ni < newToShow.length) queue.push(newToShow[ni++]);
  }

  return {
    queue,
    learningCount: learning.length,
    reviewCount: review.length,
    newAvailable: newCards.length,
    newToShow: newToShow.length,
  };
}

/**
 * 오늘 날짜 키 (yyyy-mm-dd)
 */
export function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export { RATINGS };
