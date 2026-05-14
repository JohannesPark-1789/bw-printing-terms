import React, { useMemo } from 'react';
import { BarChart3, Calendar } from 'lucide-react';
import { CategoryBadge, CATEGORIES } from './common.jsx';
import { getDaily } from '../lib/storage.js';

export default function StatsView({ allItems, progress }) {
  const stats = useMemo(() => {
    const total = allItems.length;
    let learned = 0, learning = 0, reviewing = 0, neww = 0;
    for (const item of allItems) {
      const p = progress[item.id];
      if (!p || p.status === 'new') neww++;
      else if (p.status === 'review') reviewing++;
      else if (p.status === 'learning') learning++;
      else if (p.status === 'lapsed') learning++;
      if (p && (p.status === 'review') && p.repetitions >= 1) learned++;
    }
    return {
      total, learned, learning, reviewing, neww,
      pct: Math.round(100 * learned / total),
    };
  }, [allItems, progress]);

  const catStats = useMemo(() => {
    return Object.entries(CATEGORIES).map(([cat, c]) => {
      const items = allItems.filter(d => d.cat === cat);
      const learned = items.filter(d => {
        const p = progress[d.id];
        return p && p.status === 'review' && p.repetitions >= 1;
      }).length;
      return { cat, ...c, total: items.length, learned, pct: Math.round(100 * learned / items.length) };
    });
  }, [allItems, progress]);

  const daily = getDaily();
  const grassCells = useMemo(() => {
    // 최근 30일치 잔디
    const cells = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry = daily[key];
      const count = entry?.total || 0;
      // 강도 0~4
      let level = 0;
      if (count > 0) level = 1;
      if (count >= 10) level = 2;
      if (count >= 30) level = 3;
      if (count >= 60) level = 4;
      cells.push({ key, date: d, count, level });
    }
    return cells;
  }, [daily]);

  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const todayStat = daily[todayKey] || { new: 0, review: 0, again: 0, total: 0 };

  const grassColors = ['#e7e5e4', '#a7d8b3', '#5dbf77', '#2e9b50', '#1a6e36'];

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-4">
      {/* 오늘 학습 */}
      <div className="bg-white border-2 border-stone-900 rounded-sm p-4 shadow-brut-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm tracking-wide">오늘 학습</h3>
          <Calendar className="w-4 h-4 text-stone-400" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-stone-50 p-2 rounded-sm">
            <div className="text-2xl font-black font-mono">{todayStat.new}</div>
            <div className="text-[10px] font-mono tracking-wider text-stone-500">신규</div>
          </div>
          <div className="bg-stone-50 p-2 rounded-sm">
            <div className="text-2xl font-black font-mono text-emerald-700">{todayStat.review}</div>
            <div className="text-[10px] font-mono tracking-wider text-stone-500">복습</div>
          </div>
          <div className="bg-stone-50 p-2 rounded-sm">
            <div className="text-2xl font-black font-mono text-stone-900">{todayStat.total}</div>
            <div className="text-[10px] font-mono tracking-wider text-stone-500">총합</div>
          </div>
        </div>
      </div>

      {/* 최근 30일 잔디 */}
      <div className="bg-white border-2 border-stone-900 rounded-sm p-4 shadow-brut-sm">
        <h3 className="font-black text-sm tracking-wide mb-3">최근 30일 학습</h3>
        <div className="grid grid-cols-10 gap-1">
          {grassCells.map(cell => (
            <div
              key={cell.key}
              className="aspect-square rounded-[2px]"
              style={{ backgroundColor: grassColors[cell.level] }}
              title={`${cell.key}: ${cell.count}회`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-stone-500">
          <span>30일 전</span>
          <div className="flex items-center gap-1">
            <span>적게</span>
            {grassColors.map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span>많이</span>
          </div>
          <span>오늘</span>
        </div>
      </div>

      {/* 전체 진도 */}
      <div className="bg-white border-2 border-stone-900 rounded-sm p-4 shadow-brut-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm tracking-wide">전체 진도</h3>
          <BarChart3 className="w-4 h-4 text-stone-400" />
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xl font-black font-mono text-emerald-600">{stats.learned}</div>
            <div className="text-[10px] font-mono tracking-wider text-stone-500">완료</div>
          </div>
          <div>
            <div className="text-xl font-black font-mono text-sky-600">{stats.reviewing}</div>
            <div className="text-[10px] font-mono tracking-wider text-stone-500">복습 중</div>
          </div>
          <div>
            <div className="text-xl font-black font-mono text-amber-600">{stats.learning}</div>
            <div className="text-[10px] font-mono tracking-wider text-stone-500">학습 중</div>
          </div>
          <div>
            <div className="text-xl font-black font-mono text-stone-400">{stats.neww}</div>
            <div className="text-[10px] font-mono tracking-wider text-stone-500">신규</div>
          </div>
        </div>
        <div className="mt-3 h-2.5 bg-stone-200 rounded-sm overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${stats.pct}%` }} />
        </div>
        <div className="mt-1 text-right text-[11px] font-mono text-stone-500">{stats.pct}% 완료</div>
      </div>

      {/* 카테고리별 */}
      <div className="bg-white border-2 border-stone-900 rounded-sm p-4 shadow-brut-sm">
        <h3 className="font-black text-sm tracking-wide mb-3">카테고리별 진도</h3>
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
                <div className="h-full transition-all duration-500" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] font-mono text-stone-400 text-center tracking-wider pt-2">
        BETTERWAY SYSTEMS · 인쇄용어 학습 PWA · 280 terms
      </div>
    </div>
  );
}
