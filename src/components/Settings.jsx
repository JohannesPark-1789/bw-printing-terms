import React, { useState } from 'react';
import { Settings as SettingsIcon, Trash2, RotateCcw } from 'lucide-react';
import { STUDY_DIRECTIONS } from './common.jsx';

export default function SettingsView({ settings, onChange, onResetProgress }) {
  const [confirmReset, setConfirmReset] = useState(false);

  const update = (patch) => onChange({ ...settings, ...patch });

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-4">
      <div className="flex items-center gap-2 mb-2">
        <SettingsIcon className="w-5 h-5 text-stone-700" />
        <h2 className="text-lg font-black tracking-tight">설정</h2>
      </div>

      {/* 일일 신규 카드 수 */}
      <div className="bg-white border-2 border-stone-900 rounded-sm p-4 shadow-brut-sm">
        <h3 className="font-black text-sm tracking-wide mb-1">하루 신규 카드 수</h3>
        <p className="text-xs text-stone-500 mb-3">하루에 새로 학습할 단어 수를 정해요. 많을수록 빠르지만 복습 부담이 커집니다.</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={settings.dailyNewLimit}
            onChange={(e) => update({ dailyNewLimit: Number(e.target.value) })}
            className="flex-1 accent-stone-900"
          />
          <span className="font-mono font-bold text-lg w-12 text-right">{settings.dailyNewLimit}</span>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-stone-400 mt-1">
          <span>5</span><span>20</span><span>50</span>
        </div>
      </div>

      {/* 학습 방향 */}
      <div className="bg-white border-2 border-stone-900 rounded-sm p-4 shadow-brut-sm">
        <h3 className="font-black text-sm tracking-wide mb-1">학습 방향</h3>
        <p className="text-xs text-stone-500 mb-3">단어카드 앞면에 무엇을 보여줄지 정합니다.</p>
        <div className="space-y-1.5">
          {STUDY_DIRECTIONS.map(d => (
            <label key={d.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="direction"
                checked={settings.studyDirection === d.id}
                onChange={() => update({ studyDirection: d.id })}
                className="accent-stone-900 w-4 h-4"
              />
              <span className="text-sm font-bold">{d.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* TTS 설정 */}
      <div className="bg-white border-2 border-stone-900 rounded-sm p-4 shadow-brut-sm">
        <h3 className="font-black text-sm tracking-wide mb-3">발음 듣기 (TTS)</h3>
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div className="flex-1">
            <div className="text-sm font-bold">카드 자동 재생</div>
            <div className="text-xs text-stone-500">새 카드가 나올 때 자동 발음</div>
          </div>
          <input
            type="checkbox"
            checked={settings.enableTTS}
            onChange={(e) => update({ enableTTS: e.target.checked })}
            className="w-5 h-5 accent-stone-900"
          />
        </label>
      </div>

      {/* 카드 앞면 표시 옵션 */}
      <div className="bg-white border-2 border-stone-900 rounded-sm p-4 shadow-brut-sm">
        <h3 className="font-black text-sm tracking-wide mb-3">카드 앞면 표시</h3>
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div className="flex-1">
            <div className="text-sm font-bold">발음/병음 표시</div>
            <div className="text-xs text-stone-500">외국어 → 한국어 모드에서 발음 보여주기 (꺼두면 회상 강화)</div>
          </div>
          <input
            type="checkbox"
            checked={settings.showPronunFront}
            onChange={(e) => update({ showPronunFront: e.target.checked })}
            className="w-5 h-5 accent-stone-900"
          />
        </label>
      </div>

      {/* 진도 초기화 */}
      <div className="bg-white border-2 border-rose-300 rounded-sm p-4">
        <h3 className="font-black text-sm tracking-wide text-rose-700 mb-1">진도 초기화</h3>
        <p className="text-xs text-stone-600 mb-3">모든 학습 기록을 삭제합니다. 되돌릴 수 없습니다.</p>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full py-2 border-2 border-rose-300 text-rose-700 font-bold text-sm rounded-sm flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            진도 초기화
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-rose-700 font-bold">정말 초기화할까요?</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="py-2 border-2 border-stone-300 bg-white text-stone-700 font-bold text-sm rounded-sm"
              >
                취소
              </button>
              <button
                onClick={() => { onResetProgress(); setConfirmReset(false); }}
                className="py-2 bg-rose-600 text-white font-bold text-sm rounded-sm flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                삭제 확인
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] font-mono text-stone-400 text-center tracking-wider pt-2">
        BETTERWAY SYSTEMS · v2 · 280 terms · SM-2 SRS
      </div>
    </div>
  );
}
