import { useAppStore } from '../store/appStore';

export default function ProgressPage() {
  const getStats = useAppStore(state => state.getStats);
  const progresses = useAppStore(state => state.progresses);
  const words = useAppStore(state => state.words);
  const grammar = useAppStore(state => state.grammar);

  const stats = getStats();

  const wordProgress = progresses.filter(p => p.itemType === 'word');
  const grammarProgress = progresses.filter(p => p.itemType === 'grammar');

  const getMasteryLabel = (level: number) => {
    if (level >= 5) return '完全に習得';
    if (level >= 4) return 'よく知っている';
    if (level >= 3) return '覚えている';
    if (level >= 2) return '少し覚えている';
    if (level >= 1) return '勉強中';
    return '未学習';
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4 overflow-hidden">
      <h1 className="text-3xl font-bold text-white mb-4">学習進捗</h1>

      {/* 統計サマリー - 缩小 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white text-center">
          <div className="text-2xl font-bold mb-1">{stats.totalWords}</div>
          <div className="text-xs opacity-80">総単語数</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white text-center">
          <div className="text-2xl font-bold mb-1">{wordProgress.length}</div>
          <div className="text-xs opacity-80">学習済み</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white text-center">
          <div className="text-2xl font-bold mb-1">{stats.totalGrammar}</div>
          <div className="text-xs opacity-80">総文法数</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white text-center">
          <div className="text-2xl font-bold mb-1">{grammarProgress.length}</div>
          <div className="text-xs opacity-80">学習済み</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-4 h-full min-h-0">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white flex flex-col h-full min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">単語の習得度</h2>
              <div className="text-xs opacity-70">
                学習済み: {wordProgress.length} / {stats.totalWords}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 h-full min-h-0">
              {/* 左側: 正解した単語 */}
              <div className="flex flex-col h-full min-h-0">
                <h3 className="text-base font-semibold mb-3 text-green-300 flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <span>正解 ({wordProgress.filter(p => p.correctCount > 0).length}語)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto min-h-0 pr-1 scrollbar-custom">
                  {wordProgress
                    .filter(p => p.correctCount > 0)
                    .slice(0, 15)
                    .map((p) => {
                      const word = words.find(w => w.id === p.itemId);
                      if (!word) return null;
                      const incorrectCount = p.reviewCount - p.correctCount;
                      return (
                        <div key={p.itemId} className="bg-green-500/10 rounded-lg p-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2 flex-1 min-w-0">
                              <span className="font-bold truncate">{word.kanji}</span>
                              <span className="text-xs opacity-70 flex-shrink-0">{word.kana}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs flex-shrink-0 ml-2">
                              <span className="text-green-400 font-medium">○{p.correctCount}</span>
                              {incorrectCount > 0 && <span className="text-red-400">×{incorrectCount}</span>}
                              <span className="opacity-50">({p.reviewCount})</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {wordProgress.filter(p => p.correctCount > 0).length === 0 && (
                    <div className="text-center opacity-60 py-8 text-sm">まだ正解した単語はありません</div>
                  )}
                </div>
              </div>

              {/* 右側: 錯誤した単語 */}
              <div className="flex flex-col h-full min-h-0">
                <h3 className="text-base font-semibold mb-3 text-red-300 flex items-center gap-2">
                  <span className="text-lg">✗</span>
                  <span>錯誤 ({wordProgress.filter(p => p.reviewCount > p.correctCount).length}語)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto min-h-0 pr-1 scrollbar-custom">
                  {wordProgress
                    .filter(p => p.reviewCount > p.correctCount)
                    .slice(0, 15)
                    .map((p) => {
                      const word = words.find(w => w.id === p.itemId);
                      if (!word) return null;
                      const incorrectCount = p.reviewCount - p.correctCount;
                      return (
                        <div key={p.itemId} className="bg-red-500/10 rounded-lg p-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2 flex-1 min-w-0">
                              <span className="font-bold truncate">{word.kanji}</span>
                              <span className="text-xs opacity-70 flex-shrink-0">{word.kana}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs flex-shrink-0 ml-2">
                              {p.correctCount > 0 && <span className="text-green-400">○{p.correctCount}</span>}
                              <span className="text-red-400 font-medium">×{incorrectCount}</span>
                              <span className="opacity-50">({p.reviewCount})</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {wordProgress.filter(p => p.reviewCount > p.correctCount).length === 0 && (
                    <div className="text-center opacity-60 py-8 text-sm">錯誤した単語はありません</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 h-full min-h-0">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white flex flex-col h-full min-h-0 overflow-hidden">
            <h2 className="text-xl font-bold mb-3">文法の習得度</h2>
            <div className="space-y-2 overflow-y-auto max-h-full pr-1 scrollbar-custom">
              {grammarProgress.slice(0, 10).map((p) => {
                const g = grammar.find(item => item.id === p.itemId);
                if (!g) return null;
                return (
                  <div key={p.itemId} className="flex items-center gap-4">
                    <div className="flex-1">
                      <span className="font-bold">{g.pattern}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{getMasteryLabel(p.masteryLevel)}</div>
                      <div className="text-xs opacity-60">復習 {p.reviewCount}回</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
