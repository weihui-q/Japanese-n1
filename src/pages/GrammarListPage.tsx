import { useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { getGrammarReading } from '../utils/japanese';
import { speakJapanese } from '../utils/speech';
import type { Grammar } from '../types';

const HIRAGANA_INDEX = [
  ['あ', 'か', 'が', 'さ', 'ざ', 'た', 'だ', 'な', 'は', 'ば', 'ぱ', 'ま', 'や', 'ら', 'わ'],
  ['い', 'き', 'ぎ', 'し', 'じ', 'ち', 'ぢ', 'に', 'ひ', 'び', 'ぴ', 'み', '', 'り', ''],
  ['う', 'く', 'ぐ', 'す', 'ず', 'つ', 'づ', 'ぬ', 'ふ', 'ぶ', 'ぷ', 'む', 'ゆ', 'る', ''],
  ['え', 'け', 'げ', 'せ', 'ぜ', 'て', 'で', 'ね', 'へ', 'べ', 'ぺ', 'め', '', 'れ', ''],
  ['お', 'こ', 'ご', 'そ', 'ぞ', 'と', 'ど', 'の', 'ほ', 'ぼ', 'ぽ', 'も', 'よ', 'ろ', 'を'],
];

function getGrammarStartKana(pattern: string) {
  const cleaned = pattern.replace(/^〜+/u, '');
  return cleaned[0] || '';
}

function mapGrammarCategory(category: string) {
  if (/時間|時点|経過|場面|終点|起點/.test(category)) {
    return '時間・場面';
  }
  if (/原因|理由|根拠|関連|対応/.test(category)) {
    return '原因・理由';
  }
  if (/条件|仮定|譲歩|逆接/.test(category)) {
    return '条件・仮定';
  }
  if (/否定|限定|非限定|不必要/.test(category)) {
    return '否定・限定';
  }
  if (/対比|比況|並列|付加|例示/.test(category)) {
    return '対比・付加';
  }
  if (/強調|評価|判断|立場|感情/.test(category)) {
    return '強調・評価';
  }
  if (/可能|義務|強制|目的|手段|禁止|意図/.test(category)) {
    return '可能・義務';
  }
  if (/様子|状態|付帯|対象/.test(category)) {
    return '様子・状態';
  }
  return 'その他';
}

export default function GrammarListPage() {
  const grammar = useAppStore(state => state.grammar);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedKana, setSelectedKana] = useState('');

  const categories = useMemo(
    () => Array.from(new Set(grammar.map(g => mapGrammarCategory(g.category)))).sort(),
    [grammar]
  );

  const filteredGrammar = useMemo(() => {
    return grammar.filter(g => {
      const categoryGroup = mapGrammarCategory(g.category);
      const matchesCategory = !selectedCategory || categoryGroup === selectedCategory;
      const matchesKana =
        !selectedKana || getGrammarStartKana(g.pattern) === selectedKana;
      const matchesSearch =
        g.pattern.includes(searchTerm) ||
        g.meaning.includes(searchTerm) ||
        g.explanation.includes(searchTerm);
      return matchesCategory && matchesSearch && matchesKana;
    });
  }, [grammar, searchTerm, selectedCategory, selectedKana]);

  return (
    <div className="space-y-6 h-full overflow-y-auto scrollbar-custom pb-6">
      <h1 className="text-4xl font-bold text-white mb-6">文法一覧</h1>

      {/* 五十音インデックス */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
        <div className="grid grid-cols-[repeat(15,40px)] gap-px justify-center">
          {HIRAGANA_INDEX.flatMap((row, rowIndex) =>
            row.map((kana, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;
              if (!kana) {
                return <div key={key} className="aspect-square w-[40px] rounded-lg bg-white/5" />;
              }
              const count = grammar.filter(g => getGrammarStartKana(g.pattern) === kana).length;
              const isActive = selectedKana === kana;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKana(isActive ? '' : kana)}
                  className={`aspect-square w-[40px] rounded-lg transition-all text-[11px] font-medium ${
                    isActive
                      ? 'bg-white/40 text-white scale-110'
                      : count > 0
                      ? 'bg-white/15 text-white/90 hover:bg-white/25'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                  disabled={count === 0}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-0.5 px-0.5">
                    <div>{kana}</div>
                    {count > 0 && <div className="text-[9px] opacity-60">{count}</div>}
                  </div>
                </button>
              );
            })
          )}
        </div>
        {selectedKana && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setSelectedKana('')}
              className="text-sm text-white/70 hover:text-white underline"
            >
              フィルターをクリア (選択中: {selectedKana})
            </button>
          </div>
        )}
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 space-y-4">
        <input
          type="text"
          placeholder="文法を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
        />

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg transition-all ${
              !selectedCategory ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            全て
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedCategory === category ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 結果数表示 */}
      <div className="text-white/80 text-sm">
        {filteredGrammar.length}件 の文法が見つかりました
      </div>

      {/* 文法リスト - 3列グリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredGrammar.map((g) => (
          <GrammarCard key={g.id} grammar={g} />
        ))}
      </div>

      {filteredGrammar.length === 0 && (
        <div className="text-center text-white/70 py-12">
          該当する文法が見つかりません
        </div>
      )}
    </div>
  );
}

function GrammarCard({ grammar }: { grammar: Grammar }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleExamples = useMemo(
    () =>
      grammar.examples.filter(
        (ex) =>
          !ex.japanese.startsWith('これは「') &&
          !ex.translation.startsWith('这是「') &&
          !ex.japanese.includes('例文です')
      ),
    [grammar.examples]
  );

  return (
    <div
      className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-white cursor-pointer hover:bg-white/20 transition-all border border-white/10"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold leading-tight">{grammar.pattern}</h3>
            <button
              type="button"
              aria-label="発音を再生"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                speakJapanese(getGrammarReading(grammar.pattern) ?? grammar.pattern);
              }}
              className="text-sm text-white/70 hover:text-white transition"
            >
              🔊
            </button>
          </div>
          {getGrammarReading(grammar.pattern) && (
            <p className="text-xs text-white/60 mt-1">読み: {getGrammarReading(grammar.pattern)}</p>
          )}
          <p className="text-sm text-white/80 mt-1 line-clamp-2">{grammar.meaning}</p>
        </div>
        <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/80">{grammar.category}</span>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3 text-sm text-white/80">
          <p>{grammar.explanation}</p>
          {visibleExamples.length > 0 && (
            <div className="space-y-2">
              {visibleExamples.map((ex, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3">
                  <p className="text-sm text-white">{ex.japanese}</p>
                  <p className="text-xs text-white/60 mt-1">{ex.translation}</p>
                </div>
              ))}
            </div>
          )}
          {grammar.importedAt && (
            <p className="text-xs text-white/60">インポート: {new Date(grammar.importedAt).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
