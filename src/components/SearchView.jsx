import React, { useState, useMemo } from 'react';
import { Search, Check, Volume2 } from 'lucide-react';
import { CategoryBadge, hasRegionalVariant } from './common.jsx';
import { speak, isTTSAvailable } from '../lib/tts.js';

export default function SearchView({ items, progress }) {
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

  const handlePlay = (lang, text, e) => {
    e.stopPropagation();
    speak(text, lang);
  };

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

      <div className="space-y-2 pb-4">
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
                isExpanded ? 'border-stone-900 shadow-brut-sm' : 'border-stone-200'
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
                {status === 'review' && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-stone-100 mt-1">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-stone-50 p-2 rounded-sm">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="text-[10px] font-mono text-stone-400">中 中文</div>
                        {isTTSAvailable() && (
                          <button onClick={(e) => handlePlay('zh', item.zh, e)} className="text-stone-400 p-0.5">
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="font-bold">{item.zh}</div>
                      <div className="text-xs text-stone-500 italic font-mono">{item.zh_pinyin}</div>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-sm">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="text-[10px] font-mono text-stone-400">日 日本語</div>
                        {isTTSAvailable() && (
                          <button onClick={(e) => handlePlay('ja', item.ja, e)} className="text-stone-400 p-0.5">
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="font-bold">{item.ja}</div>
                      <div className="text-xs text-stone-500 font-mono">{item.ja_kana} · {item.ja_romaji}</div>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-sm col-span-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="text-[10px] font-mono text-stone-400">EN 🇺🇸</div>
                        {isTTSAvailable() && (
                          <button onClick={(e) => handlePlay('en', item.en_us, e)} className="text-stone-400 p-0.5">
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
