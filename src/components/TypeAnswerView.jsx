import React, { useState, useEffect, useRef } from 'react';
import { Check, X, ChevronRight, Volume2 } from 'lucide-react';
import { CategoryBadge, CATEGORIES } from './common.jsx';
import { speak, isTTSAvailable } from '../lib/tts.js';

// 입력 정규화 (공백·구두점·대소문자 무시)
function normalize(s) {
  return (s || '').toLowerCase().replace(/[\s\-_/().,;:'"!?]/g, '').trim();
}

// 답 후보 추출 (방향별)
// 슬래시(/), 괄호()로 구분된 복수 답안을 모두 후보로 분해
function expandAnswerVariants(raw) {
  if (!raw) return [];
  const variants = new Set();

  // 원본 그대로
  variants.add(raw.trim());

  // 슬래시로 분리한 각 부분
  raw.split('/').forEach(part => {
    const p = part.trim();
    if (p) variants.add(p);
  });

  // 괄호 안 내용과 괄호 밖 내용을 분리
  // 예: "BID (Binary Ink Developer)" → "BID", "Binary Ink Developer"
  const outsideParens = raw.replace(/\([^)]*\)/g, '').trim();
  if (outsideParens) variants.add(outsideParens);

  const parensMatches = raw.matchAll(/\(([^)]+)\)/g);
  for (const m of parensMatches) {
    const inside = m[1].trim();
    if (inside) {
      variants.add(inside);
      // 괄호 안에도 슬래시 있으면 더 분리
      inside.split('/').forEach(p => {
        const t = p.trim();
        if (t) variants.add(t);
      });
    }
  }

  // 슬래시 + 괄호 조합: 슬래시 분리 후 각 항목의 괄호 처리
  raw.split('/').forEach(part => {
    const p = part.trim();
    const withoutParens = p.replace(/\([^)]*\)/g, '').trim();
    if (withoutParens) variants.add(withoutParens);
  });

  return [...variants].filter(v => v.length > 0);
}

function getAnswers(item, direction) {
  switch (direction) {
    case 'ko-to-en': {
      const raws = [item.en_us, item.en_gb, item.en_au].filter(Boolean);
      const all = new Set();
      raws.forEach(r => expandAnswerVariants(r).forEach(v => all.add(v)));
      return [...all];
    }
    case 'en-to-ko': {
      const raws = [item.ko, item.ko_alt].filter(Boolean);
      const all = new Set();
      raws.forEach(r => expandAnswerVariants(r).forEach(v => all.add(v)));
      return [...all];
    }
    default: return [];
  }
}

function getQuestion(item, direction) {
  switch (direction) {
    case 'ko-to-en':
      return { label: '한국어 → 영어 입력', main: item.ko, sub: item.ko_hanja, ttsLang: 'ko', ttsText: item.ko };
    case 'en-to-ko':
      return { label: '영어 → 한국어 입력', main: item.en_us, sub: item.en_ipa, ttsLang: 'en', ttsText: item.en_us };
    default:
      return { label: '', main: '', sub: '' };
  }
}

export default function TypeAnswerView({ items, onAnswer }) {
  const [direction, setDirection] = useState('ko-to-en');
  const [currentItem, setCurrentItem] = useState(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const inputRef = useRef(null);

  const pickNext = () => {
    if (items.length === 0) {
      setCurrentItem(null);
      return;
    }
    const candidates = items.filter(i => {
      const answers = getAnswers(i, direction);
      return answers.length > 0 && answers[0];
    });
    if (candidates.length === 0) {
      setCurrentItem(null);
      return;
    }
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    setCurrentItem(next);
    setInput('');
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    pickNext();
    // eslint-disable-next-line
  }, [direction, items.length]);

  const check = () => {
    if (!currentItem || !input.trim()) return;
    const answers = getAnswers(currentItem, direction).map(normalize);
    const userInput = normalize(input);
    const ok = answers.some(a => a === userInput);
    setResult(ok ? 'correct' : 'wrong');
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    onAnswer(currentItem, ok);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      if (result) pickNext();
      else check();
    }
  };

  if (!currentItem) {
    return (
      <div className="text-center py-12 text-stone-500">
        타이핑 모드는 영어↔한국어만 지원합니다.<br />
        카테고리를 선택해주세요.
      </div>
    );
  }

  const q = getQuestion(currentItem, direction);
  const correctAnswers = getAnswers(currentItem, direction);

  return (
    <div className="max-w-2xl mx-auto pb-4">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { val: 'ko-to-en', label: '한→英 입력' },
          { val: 'en-to-ko', label: '英→한 입력' },
        ].map(d => (
          <button
            key={d.val}
            onClick={() => setDirection(d.val)}
            className={`px-2.5 py-1 text-xs font-mono font-bold tracking-wider rounded-sm border ${
              direction === d.val
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-700 border-stone-300'
            }`}
          >
            {d.label}
          </button>
        ))}
        <div className="ml-auto font-mono text-[11px] flex items-center gap-2 px-2 py-1 bg-white border border-stone-300 rounded-sm">
          <span className="text-stone-500">정답률</span>
          <span className="font-black">{score.correct}/{score.total}</span>
        </div>
      </div>

      <div className="bg-white border-2 border-stone-900 rounded-sm shadow-brut p-6 mb-3 relative">
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: CATEGORIES[currentItem.cat].color }} />
        <div className="flex items-center justify-between mb-3 pt-1">
          <CategoryBadge cat={currentItem.cat} size="sm" />
          <span className="text-[10px] font-mono tracking-[0.2em] text-stone-400">{q.label}</span>
        </div>
        <h2 className="text-4xl font-black tracking-tight text-center my-4 break-keep">{q.main}</h2>
        {q.sub && <div className="text-center text-stone-500 text-base">{q.sub}</div>}
        {isTTSAvailable() && q.ttsLang && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => speak(q.ttsText, q.ttsLang)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono tracking-wider bg-stone-100 text-stone-700 rounded-sm"
            >
              <Volume2 className="w-3.5 h-3.5" />
              듣기
            </button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={!!result}
          placeholder={direction === 'ko-to-en' ? '영어로 입력...' : '한국어로 입력...'}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          className={`w-full px-4 py-3 text-lg bg-white border-2 rounded-sm focus:outline-none ${
            result === 'correct' ? 'border-emerald-600 bg-emerald-50' :
            result === 'wrong' ? 'border-rose-600 bg-rose-50' :
            'border-stone-900'
          }`}
        />
      </div>

      {!result ? (
        <button
          onClick={check}
          disabled={!input.trim()}
          className="w-full py-3 bg-stone-900 active:bg-stone-700 text-white font-bold rounded-sm disabled:opacity-40"
        >
          확인
        </button>
      ) : (
        <div className="space-y-3">
          <div className={`p-3 rounded-sm border-l-4 ${
            result === 'correct' ? 'bg-emerald-50 border-emerald-600' : 'bg-rose-50 border-rose-600'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {result === 'correct' ? (
                <><Check className="w-5 h-5 text-emerald-600" /><span className="font-bold text-emerald-900">정답!</span></>
              ) : (
                <><X className="w-5 h-5 text-rose-600" /><span className="font-bold text-rose-900">오답</span></>
              )}
            </div>
            <div className="text-sm text-stone-700">
              정답: <span className="font-bold">{correctAnswers.join(' / ')}</span>
            </div>
            {currentItem.note && (
              <div className="text-xs text-stone-600 italic mt-2">💡 {currentItem.note}</div>
            )}
          </div>
          <button
            onClick={pickNext}
            className="w-full py-3 bg-stone-900 text-white font-bold rounded-sm flex items-center justify-center gap-2"
          >
            다음 문제 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
