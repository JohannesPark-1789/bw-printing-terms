import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryBadge, CMYKDots, CATEGORIES } from './common.jsx';
import { speak, isTTSAvailable } from '../lib/tts.js';
import { nextDueLabel } from '../lib/srs.js';

/**
 * 학습 방향에 따른 카드 앞/뒤면 구성
 *
 * direction: all | ko-to-zh | ko-to-ja | ko-to-en | zh-to-ko | ja-to-ko | en-to-ko
 *
 * 각 방향마다 "프롬프트"(앞면)와 "답"(뒤면)이 다름
 */
function renderFront(item, direction, settings) {
  const showPronun = settings.showPronunFront;

  switch (direction) {
    case 'ko-to-zh':
      return {
        label: '韓 → 中',
        main: item.ko,
        sub: item.ko_hanja || '',
        hint: showPronun ? null : null, // 발음은 뒤집어야 보임 (학습 효과)
        ttsLang: 'ko',
        ttsText: item.ko,
      };
    case 'ko-to-ja':
      return {
        label: '韓 → 日',
        main: item.ko,
        sub: item.ko_hanja || '',
        hint: null,
        ttsLang: 'ko',
        ttsText: item.ko,
      };
    case 'ko-to-en':
      return {
        label: '韓 → EN',
        main: item.ko,
        sub: item.ko_hanja || '',
        hint: null,
        ttsLang: 'ko',
        ttsText: item.ko,
      };
    case 'zh-to-ko':
      return {
        label: '中 → 韓',
        main: item.zh,
        sub: showPronun ? item.zh_pinyin : '',
        hint: showPronun ? null : '병음 가려짐 — 발음을 떠올려보세요',
        ttsLang: 'zh',
        ttsText: item.zh,
      };
    case 'ja-to-ko':
      return {
        label: '日 → 韓',
        main: item.ja,
        sub: showPronun ? `${item.ja_kana} · ${item.ja_romaji}` : '',
        hint: showPronun ? null : '읽기 가려짐 — 떠올려보세요',
        ttsLang: 'ja',
        ttsText: item.ja,
      };
    case 'en-to-ko':
      return {
        label: 'EN → 韓',
        main: item.en_us,
        sub: showPronun ? item.en_ipa : '',
        hint: null,
        ttsLang: 'en',
        ttsText: item.en_us,
      };
    case 'all':
    default:
      return {
        label: '韓 KOREAN',
        main: item.ko,
        sub: item.ko_hanja || item.ko_alt || '',
        hint: null,
        ttsLang: 'ko',
        ttsText: item.ko,
      };
  }
}

function renderBack(item, direction) {
  // 뒤면 = 정답 + 발음 + 컨텍스트
  // 단방향 모드에서도 발음이 명확히 보이도록 별도 블록으로 분리
  const blocks = [];

  if (direction === 'all') {
    blocks.push({
      label: '中 CHINESE', main: item.zh, pronun: item.zh_pinyin, ttsLang: 'zh', ttsText: item.zh
    });
    blocks.push({
      label: '日 JAPANESE', main: item.ja, pronun: `${item.ja_kana} · ${item.ja_romaji}`, ttsLang: 'ja', ttsText: item.ja
    });
    blocks.push({
      label: 'EN 🇺🇸 US', main: item.en_us, pronun: item.en_ipa + (item.en_ko ? ` [${item.en_ko}]` : ''), ttsLang: 'en', ttsText: item.en_us
    });
  } else if (direction === 'ko-to-zh') {
    blocks.push({
      label: '中 정답', main: item.zh, pronun: item.zh_pinyin, pronunLabel: '병음', ttsLang: 'zh', ttsText: item.zh, isPrimary: true
    });
    // 한국어 뜻을 컨텍스트로
    blocks.push({
      label: '韓 의미', main: item.ko, pronun: item.ko_hanja, ttsLang: 'ko', ttsText: item.ko, isContext: true
    });
  } else if (direction === 'ko-to-ja') {
    blocks.push({
      label: '日 정답', main: item.ja, pronun: `${item.ja_kana} · ${item.ja_romaji}`, pronunLabel: '읽기', ttsLang: 'ja', ttsText: item.ja, isPrimary: true
    });
    blocks.push({
      label: '韓 의미', main: item.ko, pronun: item.ko_hanja, ttsLang: 'ko', ttsText: item.ko, isContext: true
    });
  } else if (direction === 'ko-to-en') {
    blocks.push({
      label: 'EN 정답', main: item.en_us, pronun: item.en_ipa + (item.en_ko ? ` [${item.en_ko}]` : ''), pronunLabel: '발음', ttsLang: 'en', ttsText: item.en_us, isPrimary: true
    });
    blocks.push({
      label: '韓 의미', main: item.ko, pronun: item.ko_hanja, ttsLang: 'ko', ttsText: item.ko, isContext: true
    });
  } else if (direction === 'zh-to-ko') {
    blocks.push({
      label: '韓 정답', main: item.ko, pronun: item.ko_hanja, ttsLang: 'ko', ttsText: item.ko, isPrimary: true
    });
    // 중국어 발음도 확인용으로 다시
    blocks.push({
      label: '中 (참고)', main: item.zh, pronun: item.zh_pinyin, pronunLabel: '병음', ttsLang: 'zh', ttsText: item.zh, isContext: true
    });
  } else if (direction === 'ja-to-ko') {
    blocks.push({
      label: '韓 정답', main: item.ko, pronun: item.ko_hanja, ttsLang: 'ko', ttsText: item.ko, isPrimary: true
    });
    blocks.push({
      label: '日 (참고)', main: item.ja, pronun: `${item.ja_kana} · ${item.ja_romaji}`, pronunLabel: '읽기', ttsLang: 'ja', ttsText: item.ja, isContext: true
    });
  } else if (direction === 'en-to-ko') {
    blocks.push({
      label: '韓 정답', main: item.ko, pronun: item.ko_hanja, ttsLang: 'ko', ttsText: item.ko, isPrimary: true
    });
    blocks.push({
      label: 'EN (참고)', main: item.en_us, pronun: item.en_ipa + (item.en_ko ? ` [${item.en_ko}]` : ''), pronunLabel: '발음', ttsLang: 'en', ttsText: item.en_us, isContext: true
    });
  }

  return blocks;
}

export default function Flashcard({
  item,
  cardState,
  direction = 'all',
  settings,
  onRate,        // (rating: 'again'|'hard'|'good'|'easy') => void
  onPrev,
  onNext,
  currentIdx,
  totalCount,
  intervals,     // { again, hard, good, easy } 라벨
}) {
  const [flipped, setFlipped] = useState(false);

  // 카드 바뀌면 다시 앞면으로
  useEffect(() => {
    setFlipped(false);
  }, [item?.id]);

  // 카드 등장 시 자동 TTS (앞면 진입할 때)
  useEffect(() => {
    if (!item || flipped) return;
    if (!settings.enableTTS) return;
    const front = renderFront(item, direction, settings);
    if (front.ttsLang && front.ttsText) {
      // 살짝 지연
      const t = setTimeout(() => speak(front.ttsText, front.ttsLang), 250);
      return () => clearTimeout(t);
    }
  }, [item?.id, flipped, direction, settings]);

  if (!item) {
    return <div className="text-center py-16 text-stone-500">학습할 카드가 없습니다.</div>;
  }

  const cat = CATEGORIES[item.cat];
  const front = renderFront(item, direction, settings);
  const backBlocks = renderBack(item, direction);

  const status = cardState?.status || 'new';
  const totalSeen = cardState?.totalSeen || 0;

  const handlePlay = (lang, text, e) => {
    e?.stopPropagation();
    if (text && lang) speak(text, lang);
  };

  const handleRate = (rating) => {
    onRate(rating);
    setFlipped(false);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-full">
      {/* 메타 정보 */}
      <div className="flex items-center justify-between mb-2 px-1 flex-shrink-0">
        <div className="flex items-center gap-2">
          <CategoryBadge cat={item.cat} size="sm" />
          <span className="font-mono text-[10px] text-stone-500 tracking-wider">{item.id}</span>
          {status !== 'new' && (
            <span className={`font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded-sm ${
              status === 'review' ? 'bg-emerald-100 text-emerald-800' :
              status === 'lapsed' ? 'bg-rose-100 text-rose-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {status === 'review' ? '복습' : status === 'lapsed' ? '실패' : '학습'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-stone-500">
            {currentIdx + 1} / {totalCount}
          </span>
          <CMYKDots progress={Math.min(totalSeen, 5) / 5} />
        </div>
      </div>

      {/* 카드 */}
      <div
        className="relative bg-white border-2 border-stone-900 rounded-sm shadow-brut cursor-pointer select-none flex-1 flex flex-col overflow-hidden"
        onClick={() => setFlipped(!flipped)}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: cat.color }} />

        {!flipped ? (
          /* 앞면 */
          <div className="p-5 pt-8 flex flex-col items-center justify-center text-center flex-1">
            <div className="text-[10px] font-mono tracking-[0.3em] text-stone-400 mb-3">{front.label}</div>

            <h2 className="text-5xl font-black mb-2 tracking-tight leading-none break-keep">
              {front.main}
            </h2>

            {front.sub && (
              <div className="text-lg text-stone-500 font-serif mb-2">{front.sub}</div>
            )}

            {front.hint && (
              <div className="text-xs text-stone-400 italic mb-3">{front.hint}</div>
            )}

            {/* TTS 버튼 */}
            {isTTSAvailable() && front.ttsLang && (
              <button
                onClick={(e) => handlePlay(front.ttsLang, front.ttsText, e)}
                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono tracking-wider bg-stone-900 text-white rounded-sm"
              >
                <Volume2 className="w-3.5 h-3.5" />
                듣기
              </button>
            )}

            <div className="mt-auto pt-6 text-[10px] text-stone-400 font-mono tracking-wider">TAP TO REVEAL ▾</div>
          </div>
        ) : (
          /* 뒤면 */
          <div className="p-4 pt-6 space-y-3 flex-1 overflow-y-auto">
            {backBlocks.map((b, i) => (
              <div key={i} className={`pb-2 ${i < backBlocks.length - 1 ? 'border-b border-stone-200' : ''}`}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className={`text-[10px] font-mono tracking-[0.2em] ${
                    b.isPrimary ? 'text-stone-700 font-bold' :
                    b.isContext ? 'text-stone-400' :
                    'text-stone-500'
                  }`}>
                    {b.label}
                  </span>
                  {b.ttsLang && isTTSAvailable() && (
                    <button
                      onClick={(e) => handlePlay(b.ttsLang, b.ttsText, e)}
                      className="p-1 text-stone-500 active:text-stone-900"
                      aria-label="듣기"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className={`font-bold leading-tight ${b.isPrimary ? 'text-2xl' : 'text-base'}`}>
                  {b.main}
                </div>

                {/* 발음/병음/가나를 별도 라인으로 명확하게 */}
                {b.pronun && (
                  <div className="mt-1 flex items-baseline gap-2">
                    {b.pronunLabel && (
                      <span className="text-[10px] font-mono tracking-wider text-stone-400 uppercase">
                        {b.pronunLabel}
                      </span>
                    )}
                    <span className={`font-mono italic ${b.isPrimary ? 'text-base text-stone-700' : 'text-sm text-stone-500'}`}>
                      {b.pronun}
                    </span>
                  </div>
                )}
              </div>
            ))}

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

            {item.ko_alt && (
              <div className="text-[11px] text-stone-600 italic">
                별칭: {item.ko_alt}
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

      {/* 응답 버튼 — 뒤집힌 후에만 나타남 */}
      {flipped ? (
        <div className="mt-3 flex-shrink-0">
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => handleRate('again')}
              className="py-2.5 bg-rose-500 active:bg-rose-600 text-white rounded-sm font-bold flex flex-col items-center transition-colors"
            >
              <span className="text-sm">다시</span>
              <span className="text-[10px] font-mono opacity-90">{intervals.again}</span>
            </button>
            <button
              onClick={() => handleRate('hard')}
              className="py-2.5 bg-amber-500 active:bg-amber-600 text-white rounded-sm font-bold flex flex-col items-center transition-colors"
            >
              <span className="text-sm">어려움</span>
              <span className="text-[10px] font-mono opacity-90">{intervals.hard}</span>
            </button>
            <button
              onClick={() => handleRate('good')}
              className="py-2.5 bg-emerald-600 active:bg-emerald-700 text-white rounded-sm font-bold flex flex-col items-center transition-colors"
            >
              <span className="text-sm">보통</span>
              <span className="text-[10px] font-mono opacity-90">{intervals.good}</span>
            </button>
            <button
              onClick={() => handleRate('easy')}
              className="py-2.5 bg-sky-600 active:bg-sky-700 text-white rounded-sm font-bold flex flex-col items-center transition-colors"
            >
              <span className="text-sm">쉬움</span>
              <span className="text-[10px] font-mono opacity-90">{intervals.easy}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex-shrink-0 grid grid-cols-3 gap-2">
          <button
            onClick={onPrev}
            className="py-2.5 border-2 border-stone-300 bg-white rounded-sm text-stone-600 font-bold text-sm flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> 이전
          </button>
          <button
            onClick={() => setFlipped(true)}
            className="py-2.5 bg-stone-900 active:bg-stone-700 text-white rounded-sm font-bold text-sm"
          >
            정답 보기
          </button>
          <button
            onClick={onNext}
            className="py-2.5 border-2 border-stone-300 bg-white rounded-sm text-stone-600 font-bold text-sm flex items-center justify-center gap-1"
          >
            건너뜀 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
