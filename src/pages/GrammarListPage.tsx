import { useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { Grammar } from '../types';

const HIRAGANA_INDEX = [
  ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'],
  ['い', 'き', 'し', 'ち', 'に', 'ひ', 'み', 'り'],
  ['う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'る'],
  ['え', 'け', 'せ', 'て', 'ね', 'へ', 'め', 'れ'],
  ['お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', 'を'],
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
    <div className="space-y-5 h-full overflow-y-auto scrollbar-custom pb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">文法一覧</h1>
          <p className="text-sm text-white/60 mt-1">分類で絞り込みできます</p>
        </div>

        <input
          type="text"
          placeholder="文法を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-80 px-4 py-2 rounded-lg bg-white/15 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <div className="bg-white/10 rounded-2xl p-4 space-y-3">
        <div className="text-sm text-white/70">五十音索引</div>
        <div className="space-y-2">
          {HIRAGANA_INDEX.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 flex-wrap justify-center">
              {row.map((kana) => {
                const count = grammar.filter(g => getGrammarStartKana(g.pattern) === kana).length;
                const isActive = selectedKana === kana;
                return (
                  <button
                    key={kana}
                    type="button"
                    onClick={() => setSelectedKana(isActive ? '' : kana)}
                    className={`py-2 px-3 rounded-lg text-sm transition ${
                      isActive
                        ? 'bg-white/30 text-white'
                        : count > 0
                        ? 'bg-white/10 text-white/70 hover:bg-white/20'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    }`}
                    disabled={count === 0}
                  >
                    {kana}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {selectedKana && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setSelectedKana('')}
              className="text-sm text-white/70 hover:text-white underline"
            >
              フィルターをクリア ({selectedKana})
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={`text-sm px-3 py-1 rounded-full transition ${!selectedCategory ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
        >
          全部类别
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`text-sm px-3 py-1 rounded-full transition ${selectedCategory === category ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredGrammar.map((g) => (
          <GrammarCard key={g.id} grammar={g} />
        ))}
      </div>
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
          <h3 className="text-xl font-semibold leading-tight">{grammar.pattern}</h3>
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
        </div>
      )}
    </div>
  );
}
