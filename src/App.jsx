import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shuffle, Search, BookOpen, Brain, Filter, BarChart3,
  Keyboard, Settings as SettingsIcon, Download, WifiOff, X
} from 'lucide-react';
import DATA from './data.json';
import { CATEGORIES, CMYKDots, STUDY_DIRECTIONS } from './components/common.jsx';
import Flashcard from './components/Flashcard.jsx';
import QuizView from './components/QuizView.jsx';
import SearchView from './components/SearchView.jsx';
import StatsView from './components/StatsView.jsx';
import TypeAnswerView from './components/TypeAnswerView.jsx';
import SettingsView from './components/Settings.jsx';
import {
  applyRating, buildQueue, newCardState, nextDueLabel,
} from './lib/srs.js';
import {
  getProgress, setProgress as saveProgress,
  getDaily, setDaily,
  getSettings, setSettings as saveSettings,
  getSelectedCats, setSelectedCats as saveSelectedCats,
  getInstallDismissed, setInstallDismissed,
  logStudy,
} from './lib/storage.js';

// ====================== PWA 설치 배너 ======================

function InstallBanner({ onDismiss }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(isIOSDevice);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      onDismiss();
    }
  };

  if (isInstalled) return null;

  if (isIOS) {
    return (
      <div className="bg-stone-900 text-white px-4 py-2 text-xs flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex-1">
          <div className="font-bold mb-0.5">📱 홈화면에 추가</div>
          <div className="text-[10px] text-stone-300">Safari 공유 → "홈 화면에 추가"</div>
        </div>
        <button onClick={onDismiss} className="text-stone-400 p-1" aria-label="닫기">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <div className="bg-stone-900 text-white px-4 py-2 text-xs flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex-1">
          <div className="font-bold mb-0.5">📱 앱으로 설치</div>
          <div className="text-[10px] text-stone-300">홈화면에서 바로 실행, 오프라인 OK</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleInstall} className="bg-amber-400 text-stone-900 font-bold px-2.5 py-1 rounded-sm text-xs flex items-center gap-1">
            <Download className="w-3 h-3" />설치
          </button>
          <button onClick={onDismiss} className="text-stone-400 p-1" aria-label="닫기">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ====================== Main App ======================

const MODES = [
  { id: 'flashcard', label: '카드', icon: BookOpen },
  { id: 'type', label: '타이핑', icon: Keyboard },
  { id: 'quiz', label: '퀴즈', icon: Brain },
  { id: 'search', label: '찾기', icon: Search },
  { id: 'stats', label: '통계', icon: BarChart3 },
  { id: 'settings', label: '설정', icon: SettingsIcon },
];

export default function App() {
  const [mode, setMode] = useState('flashcard');
  const [selectedCats, setSelectedCats] = useState(getSelectedCats(Object.keys(CATEGORIES)));
  const [showFilter, setShowFilter] = useState(false);
  const [progress, setProgress] = useState(getProgress());
  const [settings, setSettings] = useState(getSettings());
  const [installDismissed, setInstallDismissedState] = useState(getInstallDismissed());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 큐 시드 (큐 새로고침용)
  const [queueSeed, setQueueSeed] = useState(0);
  const [queueIdx, setQueueIdx] = useState(0);

  // 진도/설정 저장
  useEffect(() => { saveProgress(progress); }, [progress]);
  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => { saveSelectedCats(selectedCats); }, [selectedCats]);

  // 온오프라인
  useEffect(() => {
    const online = () => setIsOffline(false);
    const offline = () => setIsOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  // 오늘 본 신규 카드 수 계산
  const newToday = useMemo(() => {
    const daily = getDaily();
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return daily[key]?.new || 0;
  }, [progress, queueSeed]);

  // SRS 큐 구성
  const queueData = useMemo(() => {
    return buildQueue(DATA, progress, {
      dailyNewLimit: settings.dailyNewLimit,
      selectedCats,
      newToday,
    });
    // eslint-disable-next-line
  }, [progress, settings.dailyNewLimit, selectedCats, newToday, queueSeed]);

  // 큐 변경 시 인덱스 조정
  useEffect(() => {
    if (queueIdx >= queueData.queue.length) setQueueIdx(0);
  }, [queueData.queue.length, queueIdx]);

  const currentCard = queueData.queue[queueIdx];

  // 응답 → 진도 업데이트
  const handleRate = useCallback((rating) => {
    if (!currentCard) return;
    const oldState = progress[currentCard.id];
    const wasNew = !oldState || oldState.status === 'new';
    const newState = applyRating(oldState, rating);
    setProgress(p => ({ ...p, [currentCard.id]: newState }));
    logStudy(wasNew, rating);

    // 다음 카드로
    setQueueIdx(i => i + 1);
    setQueueSeed(s => s + 1);
  }, [currentCard, progress]);

  // 타이핑·퀴즈에서 호출하는 정/오답 기록
  const handleSimpleAnswer = useCallback((item, isCorrect) => {
    const oldState = progress[item.id];
    const wasNew = !oldState || oldState.status === 'new';
    const rating = isCorrect ? 'good' : 'again';
    const newState = applyRating(oldState, rating);
    setProgress(p => ({ ...p, [item.id]: newState }));
    logStudy(wasNew, rating);
  }, [progress]);

  // 다음/이전 (rating 없이 이동만)
  const handleNext = () => setQueueIdx(i => (i + 1) % Math.max(1, queueData.queue.length));
  const handlePrev = () => setQueueIdx(i => (i - 1 + queueData.queue.length) % Math.max(1, queueData.queue.length));

  // 카테고리 토글
  const toggleCat = (cat) => {
    setSelectedCats(cs => cs.includes(cat) ? cs.filter(c => c !== cat) : [...cs, cat]);
    setQueueIdx(0);
  };

  // 설치 배너 닫기
  const dismissInstall = () => {
    setInstallDismissedState(true);
    setInstallDismissed();
  };

  // 진도 초기화
  const handleResetProgress = () => {
    setProgress({});
    setDaily({});
    setQueueIdx(0);
    setQueueSeed(s => s + 1);
  };

  // 현재 카드 응답별 예상 인터벌
  const intervals = useMemo(() => {
    if (!currentCard) return { again: '', hard: '', good: '', easy: '' };
    const state = progress[currentCard.id];
    return {
      again: nextDueLabel(applyRating(state, 'again')),
      hard: nextDueLabel(applyRating(state, 'hard')),
      good: nextDueLabel(applyRating(state, 'good')),
      easy: nextDueLabel(applyRating(state, 'easy')),
    };
  }, [currentCard, progress]);

  // 필터링된 데이터 (검색·타이핑·퀴즈용)
  const filteredAll = useMemo(
    () => DATA.filter(item => selectedCats.includes(item.cat)),
    [selectedCats]
  );

  return (
    <div className="bg-stone-100 flex flex-col overflow-hidden app-root">
      {!installDismissed && <InstallBanner onDismiss={dismissInstall} />}

      {isOffline && (
        <div className="bg-amber-500 text-stone-900 px-4 py-1 text-[11px] font-bold flex items-center justify-center gap-2 flex-shrink-0">
          <WifiOff className="w-3 h-3" />
          오프라인 모드
        </div>
      )}

      {/* Header */}
      <header className="bg-stone-900 text-white flex-shrink-0">
        <div className="max-w-5xl mx-auto px-3 pt-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-black tracking-tight">印刷</h1>
            <span className="text-[10px] font-mono tracking-[0.2em] text-stone-400">GLOSSARY</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            {mode === 'flashcard' && queueData.queue.length > 0 && (
              <>
                <span className="text-amber-300">L {queueData.learningCount}</span>
                <span className="text-sky-300">R {queueData.reviewCount}</span>
                <span className="text-stone-400">N {queueData.newToShow}</span>
              </>
            )}
            <CMYKDots progress={Math.max(0.05, (queueData.queue.length - queueIdx) / Math.max(1, queueData.queue.length))} />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-0.5 flex overflow-x-auto">
          {MODES.map(t => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`flex-1 min-w-[58px] flex items-center justify-center gap-1 px-1.5 py-1.5 text-[11px] font-bold tracking-wide border-b-2 transition-colors ${
                mode === t.id
                  ? 'border-amber-400 text-white'
                  : 'border-transparent text-stone-400'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Sub toolbar (학습 모드에서만) */}
      {(mode === 'flashcard' || mode === 'type' || mode === 'quiz' || mode === 'search') && (
        <div className="bg-white border-b border-stone-200 flex-shrink-0">
          <div className="max-w-5xl mx-auto px-3 py-1.5 flex items-center gap-1.5">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold tracking-wider bg-white border border-stone-900 rounded-sm"
            >
              <Filter className="w-3 h-3" />
              {selectedCats.length}/9
            </button>
            {mode === 'flashcard' && (
              <button
                onClick={() => setQueueSeed(s => s + 1)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold tracking-wider bg-white border border-stone-300 rounded-sm"
                aria-label="큐 새로고침"
              >
                <Shuffle className="w-3 h-3" />
                갱신
              </button>
            )}
            <div className="ml-auto text-[11px] font-mono text-stone-500">
              {mode === 'flashcard' ? `${queueData.queue.length} 큐` : `${filteredAll.length} terms`}
            </div>
          </div>

          {showFilter && (
            <div className="max-w-5xl mx-auto px-3 pb-2 flex flex-wrap gap-1">
              {Object.entries(CATEGORIES).map(([cat, c]) => {
                const active = selectedCats.includes(cat);
                const count = DATA.filter(d => d.cat === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-sm border transition-all ${
                      active ? 'border-stone-900 text-white' : 'border-stone-200 bg-white text-stone-500'
                    }`}
                    style={active ? { backgroundColor: c.color, borderColor: c.color } : {}}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
              <button
                onClick={() => { setSelectedCats(Object.keys(CATEGORIES)); setQueueIdx(0); }}
                className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-sm border border-stone-300 bg-white"
              >
                전체
              </button>
              <button
                onClick={() => setSelectedCats([])}
                className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-sm border border-stone-300 bg-white"
              >
                해제
              </button>
            </div>
          )}
        </div>
      )}

      {/* 본문 */}
      <main className={`max-w-5xl mx-auto w-full flex-1 overflow-hidden ${
        mode === 'flashcard' ? 'px-3 py-2 flex flex-col' : 'px-3 py-3 overflow-y-auto'
      }`}>
        {mode === 'flashcard' ? (
          queueData.queue.length === 0 ? (
            <EmptyQueueMessage
              newAvailable={queueData.newAvailable}
              dailyNewLimit={settings.dailyNewLimit}
              newToday={newToday}
              onGoSettings={() => setMode('settings')}
            />
          ) : (
            <Flashcard
              item={currentCard}
              cardState={progress[currentCard?.id]}
              direction={settings.studyDirection}
              settings={settings}
              onRate={handleRate}
              onPrev={handlePrev}
              onNext={handleNext}
              currentIdx={queueIdx}
              totalCount={queueData.queue.length}
              intervals={intervals}
            />
          )
        ) : mode === 'type' ? (
          <TypeAnswerView items={filteredAll} onAnswer={handleSimpleAnswer} />
        ) : mode === 'quiz' ? (
          <QuizView items={filteredAll} allItems={DATA} onAnswer={handleSimpleAnswer} />
        ) : mode === 'search' ? (
          <SearchView items={filteredAll} progress={progress} />
        ) : mode === 'stats' ? (
          <StatsView allItems={DATA} progress={progress} />
        ) : (
          <SettingsView
            settings={settings}
            onChange={setSettings}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>
    </div>
  );
}

// 빈 큐 안내
function EmptyQueueMessage({ newAvailable, dailyNewLimit, newToday, onGoSettings }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div className="text-5xl mb-3">🎉</div>
      <h2 className="text-xl font-black mb-2">오늘 학습 완료!</h2>
      {newToday >= dailyNewLimit && newAvailable > 0 ? (
        <>
          <p className="text-sm text-stone-600 mb-1">
            오늘 신규 카드 <span className="font-bold">{newToday}/{dailyNewLimit}</span> 모두 학습했습니다.
          </p>
          <p className="text-xs text-stone-500 mb-4">
            남은 신규 카드 {newAvailable}개는 내일 또는 신규 한도를 늘리면 학습 가능해요.
          </p>
          <button
            onClick={onGoSettings}
            className="px-4 py-2 bg-stone-900 text-white text-sm font-bold rounded-sm"
          >
            설정에서 한도 조정
          </button>
        </>
      ) : newAvailable === 0 ? (
        <p className="text-sm text-stone-600">
          선택한 카테고리의 모든 단어를 학습했습니다. 다른 카테고리를 추가해보세요.
        </p>
      ) : (
        <p className="text-sm text-stone-600">
          학습할 카드가 없어요. 카테고리를 확인해주세요.
        </p>
      )}
    </div>
  );
}
