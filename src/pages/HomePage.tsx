import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useEffect } from 'react';

export default function HomePage() {
  const getStats = useAppStore(state => state.getStats);
  const isInitialized = useAppStore(state => state.isInitialized);
  const initialize = useAppStore(state => state.initialize);

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const stats = getStats();

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* ヒーローセクション - 缩小 */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white text-center flex-shrink-0">
        <h1 className="text-4xl font-bold mb-3">JLPT N1 学習アプリ</h1>
        <p className="text-lg opacity-90 mb-4">
          単語と文法を効率的にマスターしよう
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            to="/flashcard"
            className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg font-semibold transition-all text-sm"
          >
            🎴 フラッシュカード
          </Link>
          <Link
            to="/quiz"
            className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg font-semibold transition-all text-sm"
          >
            ✅ テスト
          </Link>
        </div>
      </div>

      {/* 統計ダッシュボード - 缩小间距和内边距 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 flex-shrink-0">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white">
          <div className="text-2xl font-bold mb-1">{stats.totalWords}</div>
          <div className="text-xs opacity-80">総単語数</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white">
          <div className="text-2xl font-bold mb-1">{stats.totalGrammar}</div>
          <div className="text-xs opacity-80">総文法数</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white">
          <div className="text-2xl font-bold mb-1">{stats.masteredWords + stats.masteredGrammar}</div>
          <div className="text-xs opacity-80">習得済み</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white">
          <div className="text-2xl font-bold mb-1">{stats.todayStudyCount}</div>
          <div className="text-xs opacity-80">今日学習</div>
        </div>
      </div>

      {/* 学习进度和快速访问 - 使用flex-1自适应 */}
      <div className="flex-1 mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* 学習進捗 - 缩小 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white">
          <h2 className="text-xl font-bold mb-3">学習進捗</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>単語</span>
                <span>{stats.totalWords > 0 ? Math.round((stats.masteredWords / stats.totalWords) * 100) : 0}%</span>
              </div>
              <div className="bg-white/20 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats.totalWords > 0 ? (stats.masteredWords / stats.totalWords) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>文法</span>
                <span>{stats.totalGrammar > 0 ? Math.round((stats.masteredGrammar / stats.totalGrammar) * 100) : 0}%</span>
              </div>
              <div className="bg-white/20 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats.totalGrammar > 0 ? (stats.masteredGrammar / stats.totalGrammar) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクセス - 缩小 */}
        <div className="grid grid-cols-1 gap-3">
          <Link
            to="/words"
            className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white hover:bg-white/20 transition-all block"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">📚</div>
              <div>
                <h3 className="text-lg font-bold">単語一覧</h3>
                <p className="text-xs opacity-80">N1単語を検索・閲覧</p>
              </div>
            </div>
          </Link>
          <Link
            to="/grammar"
            className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white hover:bg-white/20 transition-all block"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">📝</div>
              <div>
                <h3 className="text-lg font-bold">文法一覧</h3>
                <p className="text-xs opacity-80">N1文法を検索・閲覧</p>
              </div>
            </div>
          </Link>
          <Link
            to="/progress"
            className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white hover:bg-white/20 transition-all block"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">📊</div>
              <div>
                <h3 className="text-lg font-bold">学習進捗</h3>
                <p className="text-xs opacity-80">詳細な統計を確認</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
