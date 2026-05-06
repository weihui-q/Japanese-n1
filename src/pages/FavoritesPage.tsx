import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { speakJapanese } from '../utils/speech';
import { getGrammarReading } from '../utils/japanese';
import type { FavoriteItem } from '../types';

export default function FavoritesPage() {
  const favorites = useAppStore(state => state.favorites);
  const words = useAppStore(state => state.words);
  const grammar = useAppStore(state => state.grammar);
  const toggleFavorite = useAppStore(state => state.toggleFavorite);

  const favoriteWords = useMemo(
    () => favorites
      .filter(f => f.itemType === 'word')
      .map(f => ({ ...f, item: words.find(w => w.id === f.itemId) }))
      .filter(f => f.item),
    [favorites, words]
  );

  const favoriteGrammar = useMemo(
    () => favorites
      .filter(f => f.itemType === 'grammar')
      .map(f => ({ ...f, item: grammar.find(g => g.id === f.itemId) }))
      .filter(f => f.item),
    [favorites, grammar]
  );

  return (
    <div className="space-y-6 h-full overflow-y-auto scrollbar-custom pb-6">
      <h1 className="text-4xl font-bold text-white mb-6">お気に入り</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">単語</h2>
              <p className="text-sm text-white/70">{favoriteWords.length} 件のお気に入り</p>
            </div>
          </div>

          {favoriteWords.length === 0 ? (
            <div className="text-center text-white/60 py-10">まだお気に入りの単語はありません</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favoriteWords.map((favorite) => {
                const word = favorite.item!;
                return (
                  <div key={word.id} className="bg-white/10 rounded-2xl p-4 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-lg font-bold break-words">{word.kanji || word.kana}</div>
                        <div className="text-xs opacity-70">{word.kana}</div>
                        <div className="mt-2 text-sm opacity-80 line-clamp-2">{word.meanings[0]?.meaning}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(word.id, 'word')}
                        className="text-yellow-300 hover:text-yellow-200 transition text-xl"
                        aria-label="お気に入り解除"
                      >
                        ★
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">文法</h2>
              <p className="text-sm text-white/70">{favoriteGrammar.length} 件のお気に入り</p>
            </div>
          </div>

          {favoriteGrammar.length === 0 ? (
            <div className="text-center text-white/60 py-10">まだお気に入りの文法はありません</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {favoriteGrammar.map((favorite) => {
                const g = favorite.item!;
                return (
                  <div key={g.id} className="bg-white/10 rounded-2xl p-4 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-lg font-bold break-words">{g.pattern}</div>
                        <div className="text-xs opacity-70">{getGrammarReading(g.pattern)}</div>
                        <div className="mt-2 text-sm opacity-80 line-clamp-2">{g.meaning}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(g.id, 'grammar')}
                        className="text-yellow-300 hover:text-yellow-200 transition text-xl"
                        aria-label="お気に入り解除"
                      >
                        ★
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
