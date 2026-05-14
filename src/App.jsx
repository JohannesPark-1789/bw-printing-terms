import React, { useState, useEffect, useMemo } from 'react';
import {
  Shuffle, Search, BookOpen, Brain, X, Check,
  ChevronLeft, ChevronRight, Filter, BarChart3,
  Download, WifiOff
} from 'lucide-react';
import DATA from './data.json';

const CATEGORIES = {
  PRC: { ko: '인쇄 공정', en: 'Process', color: '#0066B3', accent: '#E6F0F8' },
  FIN: { ko: '후가공', en: 'Finishing', color: '#D4145A', accent: '#FBE4ED' },
  MAT: { ko: '재료', en: 'Materials', color: '#F5A623', accent: '#FEF1DD' },
  EQP: { ko: '장비', en: 'Equipment', color: '#3D3D3D', accent: '#EAEAEA' },
  QC: { ko: '품질', en: 'Quality', color: '#7B2CBF', accent: '#F0E4F8' },
  GEN: { ko: '공통', en: 'General', color: '#2B6E4F', accent: '#E3EFE9' },
  PKG: { ko: '패키징', en: 'Packaging', color: '#C9580C', accent: '#FCEADB' },
  DTP: { ko: 'DTP', en: 'DTP', color: '#1A8FB5', accent: '#E1F1F7' },
  IDG: { ko: 'HP Indigo', en: 'HP Indigo', color: '#0096D6', accent: '#DFF1FA' },
};

const hasRegionalVariant = (item) => item.en_gb || item.en_au;

// PWA용 진도 저장 (localStorage)
const STORAGE_KEYS = {
  progress: 'bw-printing-progress',
  selectedCats: 'bw-printing-cats',
  installPromptDismissed: 'bw-printing-install-dismissed',
};

const storage = {
  get(key) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
};

// ========== Small Components ==========

function CategoryBadge({ cat, size = 'sm' }) {
  const c = CATEGORIES[cat];
  if (!c) return null;
  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold tracking-wider rounded-sm ${sizes[size]}`}
      style={{ backgroundColor: c.accent, color: c.color }}
    >
      {cat}
    </span>
  );
}

function CMYKDots({ progress }) {
  const colors = ['#00AEEF', '#EC008C', '#FFF200', '#000000'];
  return (
    <div className="flex gap-0.5">
      {colors.map((c, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full transition-opacity"
          style={{ backgroundColor: c, opacity: progress > i / 4 ? 1 : 0.2 }}
        />
      ))}
    </div>
  );
}

// ========== Flashcard ==========

function FlashcardView({ items, progress, onMark, currentIdx, setCurrentIdx }) {
  const [flipped, setFlipped] = useState(false);

  const item = items[currentIdx];

  useEffect(() => {
    setFlipped(false);
  }, [currentIdx]);

  if (!item) return null;

  const cat = CATEGORIES[item.cat];
  const status = progress[item.id]?.status || 'new';
  const studyCount = progress[item.id]?.count || 0;

  const next = () => setCurrentIdx((currentIdx + 1) % items.length);
  const prev = () => setCurrentIdx((currentIdx - 1 + items.length) % items.length);
  const handleMark = (s) => {
    onMark(item.id, s);
    setTimeout(next, 200);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 px-1 flex-shrink-0">
        <div className="flex items-center gap-2">
          <CategoryBadge cat={item.cat} size="sm" />
          <span className="font-mono text-[10px] text-stone-500 tracking-wider">{item.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-stone-500">
            {currentIdx + 1} / {items.length}
          </span>
          <CMYKDots progress={studyCount / 5} />
        </div>
      </div>

      <div
        className="relative bg-white border-2 border-stone-900 rounded-sm shadow-brut cursor-pointer select-none transition-all active:translate-x-0 active:translate-y-0 flex-1 flex flex-col overflow-hidden"
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1.5 flex-shrink-0"
          style={{ backgroundColor: cat.color }}
        />

        {!flipped ? (
          <div className="p-6 pt-8 flex flex-col items-center justify-center text-center flex-1">
            <div className="text-[10px] font-mono tracking-[0.3em] text-stone-400 mb-3">韓 KOREAN</div>
            <h2 className="text-5xl font-black mb-3 tracking-tight leading-none">
              {item.ko}
            </h2>
            {item.ko_hanja && (
              <div className="text-xl text-stone-500 font-serif mb-2">{item.ko_hanja}</div>
            )}
            {item.ko_alt && (
              <div className="text-xs text-stone-500 italic">별칭: {item.ko_alt}</div>
            )}
            <div className="mt-6 text-[10px] text-stone-400 font-mono tracking-wider">TAP TO REVEAL ▾</div>
          </div>
        ) : (
          <div className="p-4 pt-6 space-y-2.5 flex-1 overflow-y-auto">
            <div className="border-b border-stone-200 pb-2">
              <div className="text-[10px] font-mono tracking-[0.2em] text-stone-400 mb-0.5">中 CHINESE</div>
              <div className="text-xl font-bold leading-tight">{item.zh}</div>
              <div className="text-xs text-stone-500 italic font-mono">{item.zh_pinyin}</div>
            </div>

            <div className="border-b border-stone-200 pb-2">
              <div className="text-[10px] font-mono tracking-[0.2em] text-stone-400 mb-0.5">日 JAPANESE</div>
              <div className="text-xl font-bold leading-tight">{item.ja}</div>
              <div className="text-xs text-stone-500 font-mono">
                {item.ja_kana} · <span className="italic">{item.ja_romaji}</span>
              </div>
            </div>

            <div className="border-b border-stone-200 pb-2">
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-[10px] font-mono tracking-[0.2em] text-stone-400">EN 🇺🇸 US</span>
                {item.en_ipa && (
                  <span className="text-[10px] text-stone-400 font-mono">{item.en_ipa}</span>
                )}
              </div>
              <div className="text-xl font-bold leading-tight">{item.en_us}</div>
              {item.en_ko && (
                <div className="text-xs text-stone-500">[{item.en_ko}]</div>
              )}
            </div>

            {(item.en_gb || item.en_au) && (
              <div className="rounded-sm p-2 bg-amber-50 border-l-4 border-amber-500">
                <div className="text-[10px] font-mono tracking-[0.2em] text-amber-800 mb-0.5">⚠ 영국/호주 차이</div>
                {item.en_gb && (
                  <div className="text-xs"><span className="font-bold text-amber-900">🇬🇧 UK:</span> {item.en_gb}</div>
                )}
                {item.en_au && (
                  <div className="text-xs"><span className="font-bold text-amber-900">🇦🇺 AU:</span> {item.en_au}</div>
                )}
              </div>
            )}

            {item.note && (
              <div className="text-[11px] text-stone-600 italic pt-1 leading-relaxed">
                💡 {item.note}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 flex-shrink-0">
        <button
          onClick={prev}
          className="p-3 border-2 border-stone-900 bg-white hover:bg-stone-100 rounded-sm transition-colors"
          aria-label="이전"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-2 flex-1 justify-center">
          <button
            onClick={() => handleMark('hard')}
            className="flex-1 max-w-[120px] py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" /> 어려움
          </button>
          <button
            onClick={() => handleMark('easy')}
            className="flex-1 max-w-[120px] py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> 알아요
          </button>
        </div>

        <button
          onClick={next}
          className="p-3 border-2 border-stone-900 bg-white hover:bg-stone-100 rounded-sm transition-colors"
          aria-label="다음"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {status !== 'new' && (
        <div className="mt-1.5 text-center text-[10px] font-mono text-stone-500 tracking-wider flex-shrink-0">
          {status === 'easy' ? '✓ 학습 완료' : '↻ 복습 필요'} · 학습 {studyCount}회
        </div>
      )}
    </div>
  );
}

// ========== Quiz ==========

function QuizView({ items, allItems, onMark }) {
  const [quizQ, setQuizQ] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [direction, setDirection] = useState('ko-to-en');

  const generateQuestion = () => {
    if (items.length < 4) return null;
    const correct = items[Math.floor(Math.random() * items.length)];
    const sameCat = allItems.filter(i => i.cat === correct.cat && i.id !== correct.id);
    const others = allItems.filter(i => i.id !== correct.id);
    const pool = sameCat.length >= 3 ? sameCat : others;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const wrongs = shuffled.slice(0, 3);
    const options = [correct, ...wrongs].sort(() => Math.random() - 0.5);
    return { correct, options, direction };
  };

  useEffect(() => {
    if (items.length >= 4) {
      setQuizQ(generateQuestion());
      setAnswered(false);
      setSelectedAnswer(null);
    }
    // eslint-disable-next-line
  }, [items, direction]);

  const handleAnswer = (option) => {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);
    const isCorrect = option.id === quizQ.correct.id;
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
    onMark(quizQ.correct.id, isCorrect ? 'easy' : 'hard');
  };

  const nextQuestion = () => {
    setAnswered(false);
    setSelectedAnswer(null);
    setQuizQ(generateQuestion());
  };

  if (!quizQ) {
    return (
      <div className="text-center py-12 text-stone-500">
        {items.length < 4 ? '퀴즈는 최소 4개 단어 필요. 카테고리를 더 추가해보세요.' : '퀴즈 준비 중...'}
      </div>
    );
  }

  const getQuestionText = (item) => {
    switch(direction) {
      case 'ko-to-en': return { label: '한국어 → 영어', main: item.ko, sub: item.ko_hanja };
      case 'ko-to-ja': return { label: '한국어 → 일본어', main: item.ko, sub: item.ko_hanja };
      case 'ko-to-zh': return { label: '한국어 → 중국어', main: item.ko, sub: item.ko_hanja };
      case 'en-to-ko': return { label: '영어 → 한국어', main: item.en_us, sub: item.en_ipa };
      default: return { label: '', main: item.ko, sub: '' };
    }
  };

  const getOptionText = (item) => {
    switch(direction) {
      case 'ko-to-en': return item.en_us;
      case 'ko-to-ja': return item.ja;
      case 'ko-to-zh': return item.zh;
      case 'en-to-ko': return item.ko;
      default: return item.en_us;
    }
  };

  const getOptionSub = (item) => {
    switch(direction) {
      case 'ko-to-ja': return item.ja_kana;
      case 'ko-to-zh': return item.zh_pinyin;
      case 'en-to-ko': return item.ko_hanja;
      default: return '';
    }
  };

  const q = getQuestionText(quizQ.correct);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { val: 'ko-to-en', label: '한→영' },
          { val: 'ko-to-ja', label: '한→日' },
          { val: 'ko-to-zh', label: '한→中' },
          { val: 'en-to-ko', label: '영→한' },
        ].map(d => (
          <button
            key={d.val}
            onClick={() => setDirection(d.val)}
            className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wider rounded-sm border-2 transition-colors ${
              direction === d.val
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900'
            }`}
          >
            {d.label}
          </button>
        ))}
        <div className="ml-auto font-mono text-xs flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-stone-300 rounded-sm">
          <span className="text-stone-500">SCORE</span>
          <span className="font-black">{score.correct}/{score.total}</span>
          {score.total > 0 && (
            <span className="text-stone-500">({Math.round(100 * score.correct / score.total)}%)</span>
          )}
        </div>
      </div>

      <div className="bg-white border-2 border-stone-900 rounded-sm shadow-brut p-8 mb-6 relative">
        <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: CATEGORIES[quizQ.correct.cat].color }} />
        <div className="flex items-center justify-between mb-4 pt-2">
          <CategoryBadge cat={quizQ.correct.cat} size="sm" />
          <span className="text-xs font-mono tracking-[0.2em] text-stone-400">{q.label}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-center my-6">
          {q.main}
        </h2>
        {q.sub && (
          <div className="text-center text-stone-500 text-lg">{q.sub}</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {quizQ.options.map((opt, i) => {
          const isCorrect = opt.id === quizQ.correct.id;
          const isSelected = selectedAnswer?.id === opt.id;
          let style = 'bg-white border-stone-300 hover:border-stone-900 hover:bg-stone-50';
          if (answered) {
            if (isCorrect) style = 'bg-emerald-50 border-emerald-600 text-emerald-900';
            else if (isSelected) style = 'bg-rose-50 border-rose-600 text-rose-900';
            else style = 'bg-white border-stone-200 text-stone-400';
          }
          return (
            <button
              key={opt.id}
              onClick={() => handleAnswer(opt)}
              disabled={answered}
              className={`p-4 border-2 rounded-sm text-left transition-all ${style}`}
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-stone-400 mt-1">{String.fromCharCode(65 + i)}</span>
                <div className="flex-1">
                  <div className="font-bold text-lg">{getOptionText(opt)}</div>
                  {answered && getOptionSub(opt) && (
                    <div className="text-xs text-stone-500 mt-1 font-mono">{getOptionSub(opt)}</div>
                  )}
                </div>
                {answered && isCorrect && <Check className="w-5 h-5 text-emerald-600" />}
                {answered && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-600" />}
              </div>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-6 space-y-3">
          {quizQ.correct.note && (
            <div className="bg-stone-100 border-l-4 border-stone-900 p-3 text-sm text-stone-700">
              💡 {quizQ.correct.note}
            </div>
          )}
          {(quizQ.correct.en_gb || quizQ.correct.en_au) && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 text-sm">
              {quizQ.correct.en_gb && <div><span className="font-bold">🇬🇧 UK:</span> {quizQ.correct.en_gb}</div>}
              {quizQ.correct.en_au && <div><span className="font-bold">🇦🇺 AU:</span> {quizQ.correct.en_au}</div>}
            </div>
          )}
          <button
            onClick={nextQuestion}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-sm transition-colors"
          >
            다음 문제 →
          </button>
        </div>
      )}
    </div>
  );
}

// ========== Search ==========

function SearchView({ items, progress, onMark }) {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter(item =>
      item.ko.toLowerCase().includes(q) ||
      item.ko_alt?.toLowerCase().includes(q) ||
      item.ko_hanja?.includes(q) ||
      item.zh.includes(q) ||
      item.zh_pinyin?.toLowerCase().includes(q) ||
      item.ja.includes(q) ||
      item.ja_kana?.includes(q) ||
      item.ja_romaji?.toLowerCase().includes(q) ||
      item.en_us.toLowerCase().includes(q) ||
      item.en_gb?.toLowerCase().includes(q) ||
      item.en_au?.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="한·중·일·영 어떤 언어로도 검색"
          className="w-full pl-11 pr-4 py-3 bg-white border-2 border-stone-900 rounded-sm font-medium focus:outline-none focus:shadow-brut-sm transition-shadow"
        />
      </div>

      <div className="text-xs font-mono tracking-wider text-stone-500 mb-3">
        {filtered.length} / {items.length} TERMS
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-stone-500">검색 결과 없음</div>
        )}
        {filtered.map(item => {
          const isExpanded = expandedId === item.id;
          const status = progress[item.id]?.status;
          return (
            <div
              key={item.id}
              className={`bg-white border-2 rounded-sm transition-all ${
                isExpanded ? 'border-stone-900 shadow-brut-sm' : 'border-stone-200 hover:border-stone-400'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-3 flex items-center gap-3 text-left"
              >
                <CategoryBadge cat={item.cat} size="xs" />
                <span className="font-mono text-[10px] text-stone-400">{item.id}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold text-base">{item.ko}</span>
                    {item.ko_hanja && (
                      <span className="text-sm text-stone-500">{item.ko_hanja}</span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500 truncate mt-0.5">
                    {item.zh} · {item.ja} · {item.en_us}
                  </div>
                </div>
                {hasRegionalVariant(item) && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-sm">🇬🇧/🇦🇺</span>
                )}
                {status === 'easy' && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-stone-100 mt-1">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-stone-50 p-2 rounded-sm">
                      <div className="text-[10px] font-mono text-stone-400 mb-0.5">中 中文</div>
                      <div className="font-bold">{item.zh}</div>
                      <div className="text-xs text-stone-500 italic font-mono">{item.zh_pinyin}</div>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-sm">
                      <div className="text-[10px] font-mono text-stone-400 mb-0.5">日 日本語</div>
                      <div className="font-bold">{item.ja}</div>
                      <div className="text-xs text-stone-500 font-mono">{item.ja_kana} · {item.ja_romaji}</div>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-sm col-span-2">
                      <div className="text-[10px] font-mono text-stone-400 mb-0.5">EN 🇺🇸</div>
                      <div className="font-bold">{item.en_us}</div>
                      <div className="text-xs text-stone-500 font-mono">{item.en_ipa} [{item.en_ko}]</div>
                    </div>
                    {item.en_gb && (
                      <div className="bg-amber-50 p-2 rounded-sm col-span-2 border-l-4 border-amber-500">
                        <div className="text-[10px] font-mono text-amber-700 mb-0.5">🇬🇧 UK</div>
                        <div className="text-sm">{item.en_gb}</div>
                      </div>
                    )}
                    {item.en_au && (
                      <div className="bg-amber-50 p-2 rounded-sm col-span-2 border-l-4 border-amber-500">
                        <div className="text-[10px] font-mono text-amber-700 mb-0.5">🇦🇺 AU</div>
                        <div className="text-sm">{item.en_au}</div>
                      </div>
                    )}
                  </div>
                  {item.note && (
                    <div className="text-xs text-stone-600 italic leading-relaxed bg-yellow-50 p-2 rounded-sm">
                      💡 {item.note}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => onMark(item.id, 'easy')}
                      className="text-xs px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-sm font-bold"
                    >
                      ✓ 외움
                    </button>
                    <button
                      onClick={() => onMark(item.id, 'hard')}
                      className="text-xs px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-sm font-bold"
                    >
                      ↻ 복습
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========== PWA Install Banner ==========

function InstallBanner({ onDismiss }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // 이미 설치된 PWA로 실행 중인지 확인
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

  // iOS는 수동 설치 안내만 가능
  if (isIOS) {
    return (
      <div className="bg-stone-900 text-white px-4 py-3 text-sm flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="font-bold mb-0.5">📱 홈화면에 추가</div>
          <div className="text-xs text-stone-300">Safari 공유 버튼 → "홈 화면에 추가"</div>
        </div>
        <button
          onClick={onDismiss}
          className="text-stone-400 hover:text-white p-1"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Android/Desktop Chrome
  if (deferredPrompt) {
    return (
      <div className="bg-stone-900 text-white px-4 py-3 text-sm flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="font-bold mb-0.5">📱 앱으로 설치하기</div>
          <div className="text-xs text-stone-300">홈화면에서 바로 실행. 오프라인도 OK</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold px-3 py-1.5 rounded-sm text-xs flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            설치
          </button>
          <button
            onClick={onDismiss}
            className="text-stone-400 hover:text-white p-1"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ========== Main App ==========

export default function App() {
  const [mode, setMode] = useState('flashcard');
  const [selectedCats, setSelectedCats] = useState(Object.keys(CATEGORIES));
  const [showFilter, setShowFilter] = useState(false);
  const [progress, setProgress] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 초기 로드
  useEffect(() => {
    const saved = storage.get(STORAGE_KEYS.progress);
    if (saved) setProgress(saved);
    const savedCats = storage.get(STORAGE_KEYS.selectedCats);
    if (savedCats) setSelectedCats(savedCats);
    const dismissed = storage.get(STORAGE_KEYS.installPromptDismissed);
    if (dismissed) setInstallDismissed(true);
    setLoaded(true);
  }, []);

  // 진도 저장
  useEffect(() => {
    if (loaded) storage.set(STORAGE_KEYS.progress, progress);
  }, [progress, loaded]);

  useEffect(() => {
    if (loaded) storage.set(STORAGE_KEYS.selectedCats, selectedCats);
  }, [selectedCats, loaded]);

  // 온/오프라인 감지
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

  const filteredItems = useMemo(() => {
    let items = DATA.filter(item => selectedCats.includes(item.cat));
    if (shuffleSeed > 0) {
      items = [...items].sort((a, b) => {
        const ha = (a.id + shuffleSeed).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
        const hb = (b.id + shuffleSeed).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
        return ha - hb;
      });
    }
    return items;
  }, [selectedCats, shuffleSeed]);

  useEffect(() => {
    if (currentIdx >= filteredItems.length) setCurrentIdx(0);
  }, [filteredItems.length, currentIdx]);

  const handleMark = (id, status) => {
    setProgress(p => ({
      ...p,
      [id]: {
        status,
        count: (p[id]?.count || 0) + 1,
        lastSeen: Date.now(),
      }
    }));
  };

  const toggleCat = (cat) => {
    setSelectedCats(cs => cs.includes(cat) ? cs.filter(c => c !== cat) : [...cs, cat]);
  };

  const dismissInstall = () => {
    setInstallDismissed(true);
    storage.set(STORAGE_KEYS.installPromptDismissed, true);
  };

  const stats = useMemo(() => {
    const total = DATA.length;
    const learned = Object.values(progress).filter(p => p.status === 'easy').length;
    const reviewing = Object.values(progress).filter(p => p.status === 'hard').length;
    return { total, learned, reviewing, pct: Math.round(100 * learned / total) };
  }, [progress]);

  return (
    <div className="h-screen bg-stone-100 flex flex-col overflow-hidden">
      {/* PWA 설치 배너 */}
      {!installDismissed && <InstallBanner onDismiss={dismissInstall} />}

      {/* 오프라인 인디케이터 */}
      {isOffline && (
        <div className="bg-amber-500 text-stone-900 px-4 py-1 text-[11px] font-bold flex items-center justify-center gap-2 flex-shrink-0">
          <WifiOff className="w-3 h-3" />
          오프라인 모드
        </div>
      )}

      {/* Compact Header */}
      <header className="bg-stone-900 text-white flex-shrink-0">
        <div className="max-w-5xl mx-auto px-3 pt-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-black tracking-tight">印刷</h1>
            <span className="text-[10px] font-mono tracking-[0.2em] text-stone-400">GLOSSARY</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-stone-400">{stats.learned}/{stats.total}</span>
            <span className="text-emerald-400">({stats.pct}%)</span>
            <CMYKDots progress={stats.pct / 100} />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-1 flex">
          {[
            { id: 'flashcard', label: '단어카드', icon: BookOpen },
            { id: 'quiz', label: '퀴즈', icon: Brain },
            { id: 'search', label: '검색', icon: Search },
            { id: 'stats', label: '통계', icon: BarChart3 },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-bold tracking-wide border-b-2 transition-colors ${
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

      {/* Sub toolbar - compact */}
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
              onClick={() => { setShuffleSeed(Date.now()); setCurrentIdx(0); }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold tracking-wider bg-white border border-stone-300 rounded-sm"
            >
              <Shuffle className="w-3 h-3" />
              섞기
            </button>
          )}
          <div className="ml-auto text-[11px] font-mono text-stone-500">
            {filteredItems.length} terms
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
              onClick={() => setSelectedCats(Object.keys(CATEGORIES))}
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

      {/* Main content - takes remaining space */}
      <main className={`max-w-5xl mx-auto w-full flex-1 overflow-hidden ${mode === 'flashcard' ? 'px-3 py-2 flex flex-col' : 'px-3 py-3 overflow-y-auto'}`}>
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-stone-500">
            <p className="mb-2">카테고리를 하나 이상 선택해주세요.</p>
            <button
              onClick={() => setSelectedCats(Object.keys(CATEGORIES))}
              className="mt-2 px-4 py-2 bg-stone-900 text-white text-sm font-bold rounded-sm"
            >
              전체 선택
            </button>
          </div>
        ) : mode === 'flashcard' ? (
          <FlashcardView
            items={filteredItems}
            progress={progress}
            onMark={handleMark}
            currentIdx={currentIdx}
            setCurrentIdx={setCurrentIdx}
          />
        ) : mode === 'quiz' ? (
          <QuizView
            items={filteredItems}
            allItems={DATA}
            onMark={handleMark}
          />
        ) : mode === 'search' ? (
          <SearchView
            items={filteredItems}
            progress={progress}
            onMark={handleMark}
          />
        ) : (
          <StatsView stats={stats} progress={progress} />
        )}
      </main>
    </div>
  );
}

// ========== Stats View ==========

function StatsView({ stats, progress }) {
  // 카테고리별 진도 계산
  const catStats = useMemo(() => {
    return Object.entries(CATEGORIES).map(([cat, c]) => {
      const items = DATA.filter(d => d.cat === cat);
      const learned = items.filter(d => progress[d.id]?.status === 'easy').length;
      return { cat, ...c, total: items.length, learned, pct: Math.round(100 * learned / items.length) };
    });
  }, [progress]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* 전체 통계 카드 */}
      <div className="bg-white border-2 border-stone-900 rounded-sm p-4 shadow-brut-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-base tracking-wide">전체 진도</h3>
          <BarChart3 className="w-4 h-4 text-stone-400" />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-3xl font-black font-mono text-emerald-600">{stats.learned}</div>
            <div className="text-[10px] font-mono tracking-wider text-stone-500">LEARNED</div>
          </div>
          <div>
            <div className="text-3xl font-black font-mono text-amber-600">{stats.reviewing}</div>
            <div className="text-[10px] font-mono tracking-wider text-stone-500">REVIEWING</div>
          </div>
          <div>
            <div className="text-3xl font-black font-mono text-stone-400">{stats.total - stats.learned - stats.reviewing}</div>
            <div className="text-[10px] font-mono tracking-wider text-stone-500">NEW</div>
          </div>
        </div>
        <div className="mt-3 h-3 bg-stone-200 rounded-sm overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
        <div className="mt-1 text-right text-xs font-mono text-stone-500">{stats.pct}% 완료</div>
      </div>

      {/* 카테고리별 진도 */}
      <div className="bg-white border-2 border-stone-900 rounded-sm p-4 shadow-brut-sm">
        <h3 className="font-black text-base tracking-wide mb-3">카테고리별 진도</h3>
        <div className="space-y-2">
          {catStats.map(c => (
            <div key={c.cat}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <CategoryBadge cat={c.cat} size="xs" />
                  <span className="text-xs font-bold">{c.ko}</span>
                </div>
                <span className="text-[11px] font-mono text-stone-500">
                  {c.learned}/{c.total} <span className="text-stone-400">({c.pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 bg-stone-200 rounded-sm overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] font-mono text-stone-400 text-center tracking-wider pb-4">
        BETTERWAY SYSTEMS · 인쇄용어 학습 PWA · 280 terms
      </div>
    </div>
  );
}
