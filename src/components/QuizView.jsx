import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Volume2 } from 'lucide-react';
import { CategoryBadge, CATEGORIES } from './common.jsx';
import { speak, isTTSAvailable } from '../lib/tts.js';

export default function QuizView({ items, allItems, onAnswer }) {
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
    onAnswer(quizQ.correct, isCorrect);
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
      case 'ko-to-en': return { label: '한국어 → 영어', main: item.ko, sub: item.ko_hanja, ttsLang: 'ko', ttsText: item.ko };
      case 'ko-to-ja': return { label: '한국어 → 일본어', main: item.ko, sub: item.ko_hanja, ttsLang: 'ko', ttsText: item.ko };
      case 'ko-to-zh': return { label: '한국어 → 중국어', main: item.ko, sub: item.ko_hanja, ttsLang: 'ko', ttsText: item.ko };
      case 'en-to-ko': return { label: '영어 → 한국어', main: item.en_us, sub: item.en_ipa, ttsLang: 'en', ttsText: item.en_us };
      case 'ja-to-ko': return { label: '일본어 → 한국어', main: item.ja, sub: item.ja_kana, ttsLang: 'ja', ttsText: item.ja };
      case 'zh-to-ko': return { label: '중국어 → 한국어', main: item.zh, sub: item.zh_pinyin, ttsLang: 'zh', ttsText: item.zh };
      default: return { label: '', main: item.ko, sub: '' };
    }
  };

  const getOptionText = (item) => {
    switch(direction) {
      case 'ko-to-en': return item.en_us;
      case 'ko-to-ja': return item.ja;
      case 'ko-to-zh': return item.zh;
      case 'en-to-ko':
      case 'ja-to-ko':
      case 'zh-to-ko':
        return item.ko;
      default: return item.en_us;
    }
  };

  const getOptionSub = (item) => {
    switch(direction) {
      case 'ko-to-ja': return item.ja_kana;
      case 'ko-to-zh': return item.zh_pinyin;
      case 'en-to-ko':
      case 'ja-to-ko':
      case 'zh-to-ko':
        return item.ko_hanja;
      default: return '';
    }
  };

  const q = getQuestionText(quizQ.correct);

  return (
    <div className="max-w-2xl mx-auto pb-4">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { val: 'ko-to-en', label: '한→英' },
          { val: 'ko-to-ja', label: '한→日' },
          { val: 'ko-to-zh', label: '한→中' },
          { val: 'en-to-ko', label: '英→한' },
          { val: 'ja-to-ko', label: '日→한' },
          { val: 'zh-to-ko', label: '中→한' },
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
          <span className="text-stone-500">SCORE</span>
          <span className="font-black">{score.correct}/{score.total}</span>
          {score.total > 0 && (
            <span className="text-stone-500">({Math.round(100 * score.correct / score.total)}%)</span>
          )}
        </div>
      </div>

      <div className="bg-white border-2 border-stone-900 rounded-sm shadow-brut p-6 mb-4 relative">
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: CATEGORIES[quizQ.correct.cat].color }} />
        <div className="flex items-center justify-between mb-3 pt-1">
          <CategoryBadge cat={quizQ.correct.cat} size="sm" />
          <span className="text-[10px] font-mono tracking-[0.2em] text-stone-400">{q.label}</span>
        </div>
        <h2 className="text-4xl font-black tracking-tight text-center my-4 break-keep">
          {q.main}
        </h2>
        {q.sub && (
          <div className="text-center text-stone-500 text-base">{q.sub}</div>
        )}
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

      <div className="grid grid-cols-1 gap-2">
        {quizQ.options.map((opt, i) => {
          const isCorrect = opt.id === quizQ.correct.id;
          const isSelected = selectedAnswer?.id === opt.id;
          let style = 'bg-white border-stone-300';
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
              className={`p-3 border-2 rounded-sm text-left transition-all ${style}`}
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-stone-400 mt-0.5">{String.fromCharCode(65 + i)}</span>
                <div className="flex-1">
                  <div className="font-bold text-base">{getOptionText(opt)}</div>
                  {answered && getOptionSub(opt) && (
                    <div className="text-xs text-stone-500 mt-0.5 font-mono">{getOptionSub(opt)}</div>
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
        <div className="mt-4 space-y-2">
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
            className="w-full py-3 bg-stone-900 text-white font-bold rounded-sm"
          >
            다음 문제 →
          </button>
        </div>
      )}
    </div>
  );
}
