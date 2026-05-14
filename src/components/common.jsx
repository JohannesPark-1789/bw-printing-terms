// 공통 컴포넌트와 상수

import React from 'react';

export const CATEGORIES = {
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

export const STUDY_DIRECTIONS = [
  { id: 'all', label: '전체 (한→다국어)', short: '전체' },
  { id: 'ko-to-zh', label: '한국어 → 중국어', short: '한→中' },
  { id: 'ko-to-ja', label: '한국어 → 일본어', short: '한→日' },
  { id: 'ko-to-en', label: '한국어 → 영어', short: '한→英' },
  { id: 'zh-to-ko', label: '중국어 → 한국어', short: '中→한' },
  { id: 'ja-to-ko', label: '일본어 → 한국어', short: '日→한' },
  { id: 'en-to-ko', label: '영어 → 한국어', short: '英→한' },
];

export function CategoryBadge({ cat, size = 'sm' }) {
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

export function CMYKDots({ progress }) {
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

export const hasRegionalVariant = (item) => item.en_gb || item.en_au;
