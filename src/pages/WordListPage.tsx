import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';import { speakJapanese } from '../utils/speech';import type { Word } from '../types';

// 五十音図インデックス
const HIRAGANA_INDEX = [
  ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'],
  ['い', 'き', 'し', 'ち', 'に', 'ひ', 'み', 'り'],
  ['う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'る'],
  ['え', 'け', 'せ', 'て', 'ね', 'へ', 'め', 'れ'],
  ['お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', 'を'],
];

// 五十音に一致するかどうかをチェック
function matchesKanaIndex(kana: string, selectedKana: string): boolean {
  if (!selectedKana) return true;
  return kana.startsWith(selectedKana);
}

function deriveWordPartOfSpeech(word: Word): string {
  if (word.partOfSpeech) {
    return word.partOfSpeech;
  }

  const kana = word.kana;
  if (!kana) {
    return '名詞';
  }

  if (kana.endsWith('い')) {
    return '形容詞';
  }
  if (kana.endsWith('に')) {
    return '副詞';
  }
  if (kana.endsWith('する') || kana.endsWith('ない') || kana.endsWith('ます') || kana.endsWith('た')) {
    return '動詞';
  }

  return '名詞';
}

export default function WordListPage() {
  const words = useAppStore(state => state.words);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedKana, setSelectedKana] = useState('');
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState('');

  const categories = Array.from(new Set(words.map(w => w.category)));
  const partOfSpeechCategories = Array.from(
    new Set(words.map(w => deriveWordPartOfSpeech(w)))
  );

  const filteredWords = useMemo(() => {
    return words.filter(word => {
      const matchesSearch =
        word.kanji.includes(searchTerm) ||
        word.kana.includes(searchTerm) ||
        word.meanings.some(m =>
          m.meaning.includes(searchTerm) ||
          m.example?.includes(searchTerm) ||
          m.exampleTranslation?.includes(searchTerm)
        );
      const matchesCategory = !selectedCategory || word.category === selectedCategory;
      const matchesKana = matchesKanaIndex(word.kana, selectedKana);
      const matchesPartOfSpeech =
        !selectedPartOfSpeech || deriveWordPartOfSpeech(word) === selectedPartOfSpeech;
      return matchesSearch && matchesCategory && matchesKana && matchesPartOfSpeech;
    });
  }, [words, searchTerm, selectedCategory, selectedKana, selectedPartOfSpeech]);

  return (
    <div className="space-y-6 h-full overflow-y-auto scrollbar-custom pb-6">
      <h1 className="text-4xl font-bold text-white mb-6">単語一覧</h1>

      {/* 五十音インデックス */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
        <div className="space-y-1">
          {HIRAGANA_INDEX.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
              {row.map((kana) => {
                const isActive = selectedKana === kana;
                const count = words.filter(w => w.kana.startsWith(kana)).length;
                return (
                  <button
                    key={kana}
                    onClick={() => setSelectedKana(isActive ? '' : kana)}
                    className={`flex-1 max-w-[60px] py-2 px-1 rounded-lg transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-white/40 text-white scale-110'
                        : count > 0
                        ? 'bg-white/15 text-white/90 hover:bg-white/25'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <div>{kana}</div>
                    {count > 0 && <div className="text-xs opacity-60">{count}</div>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {selectedKana && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setSelectedKana('')}
              className="text-sm text-white/70 hover:text-white underline"
            >
              フィルターをクリア (選択中: {selectedKana}行)
            </button>
          </div>
        )}
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 space-y-4">
        <input
          type="text"
          placeholder="単語を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
        />

        <div className="space-y-3">
          <div className="text-sm text-white/70">品詞で絞り込み</div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedPartOfSpeech('')}
              className={`px-4 py-2 rounded-lg transition-all ${
                !selectedPartOfSpeech ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              全て
            </button>
            {partOfSpeechCategories.map(pos => (
              <button
                key={pos}
                onClick={() => setSelectedPartOfSpeech(pos)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedPartOfSpeech === pos ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg transition-all ${
              !selectedCategory ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            全て
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedCategory === cat ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 結果数表示 */}
      <div className="text-white/80 text-sm">
        {filteredWords.length}件 の単語が見つかりました
      </div>

      {/* 単語リスト - 4列グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredWords.map((word) => (
          <WordCard key={word.id} word={word} />
        ))}
      </div>

      {filteredWords.length === 0 && (
        <div className="text-center text-white/70 py-12">
          該当する単語が見つかりません
        </div>
      )}
    </div>
  );
}

function WordCard({ word }: { word: Word }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatExample = (text: string) =>
    text.replace(/{kanji}/g, word.kanji).replace(/{kana}/g, word.kana);

  const partOfSpeech = deriveWordPartOfSpeech(word);

  return (
    <div
      className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white cursor-pointer hover:bg-white/20 transition-all hover:scale-105"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* 基本情報 */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="text-xl font-bold">{word.kanji}</h3>
          <span className="text-sm opacity-80">{word.kana}</span>
          <button
            type="button"
            aria-label="发音を再生"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              speakJapanese(word.kana);
            }}
            className="text-sm text-white/70 hover:text-white transition"
          >
            🔊
          </button>
        </div>
        <p className="text-sm leading-6">
          {word.meanings.map((meaningItem, index) => (
            <span key={index}>
              {word.meanings.length > 1 ? `${index + 1}. ` : ''}{meaningItem.meaning}
              {index !== word.meanings.length - 1 && '； '}
            </span>
          ))}
        </p>
      </div>

      {/* タグ */}
      <div className="flex gap-1 flex-wrap mb-2">
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{partOfSpeech}</span>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{word.category}</span>
        {word.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{tag}</span>
        ))}
      </div>

      {/* 展開コンテンツ */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/20 space-y-4 text-sm">
          <p className="opacity-80">ローマ字: {word.romaji}</p>
          <div className="bg-white/10 rounded-lg p-3 space-y-4">
            {word.meanings.map((meaningItem, index) => (
              <div key={index} className="space-y-1">
                <p className="text-xs opacity-70">
                  <strong>意味 {index + 1}:</strong> {meaningItem.meaning}
                </p>
                {meaningItem.example && (
                  <p className="text-sm">{formatExample(meaningItem.example)}</p>
                )}
                {meaningItem.exampleTranslation && (
                  <p className="text-xs opacity-80">{formatExample(meaningItem.exampleTranslation)}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs">難易度:</span>
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i} className={`text-sm ${i <= word.difficulty ? 'text-yellow-400' : 'opacity-30'}`}>★</span>
            ))}
          </div>
          {word.importedAt && (
            <p className="text-xs text-white/60">インポート: {new Date(word.importedAt).toLocaleString()}</p>
          )}
        </div>
      )}

      {/* 展開インジケータ */}
      <div className="text-center mt-2 text-xs opacity-50">
        {isExpanded ? '▲ クリックして閉じる' : '▼ クリックして詳細'}
      </div>
    </div>
  );
}
