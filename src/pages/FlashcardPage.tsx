import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import type { Word, Grammar } from '../types';

export default function FlashcardPage() {
  const words = useAppStore(state => state.words);
  const grammar = useAppStore(state => state.grammar);
  const updateProgress = useAppStore(state => state.updateProgress);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyType, setStudyType] = useState<'all' | 'words' | 'grammar'>('all');
  const [studyItems, setStudyItems] = useState<Array<Word | Grammar>>([]);

  useEffect(() => {
    let items: Array<Word | Grammar> = [];
    if (studyType === 'all' || studyType === 'words') {
      items = [...items, ...words];
    }
    if (studyType === 'all' || studyType === 'grammar') {
      items = [...items, ...grammar];
    }
    setStudyItems(items);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [studyType, words, grammar]);

  const currentItem = studyItems[currentIndex];

  const handleQuality = async (quality: number) => {
    if (!currentItem) return;
    
    const itemType = 'kanji' in currentItem ? 'word' : 'grammar';
    await updateProgress(currentItem.id, itemType, quality);
    
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % studyItems.length);
    }, 200);
  };

  if (studyItems.length === 0) {
    return (
      <div className="text-center text-white py-20">
        <p className="text-2xl">学習するデータがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full overflow-hidden">
      <h1 className="text-3xl font-bold text-white mb-4">フラッシュカード</h1>

      {/* 学習タイプ選択 */}
      <div className="flex gap-4 justify-center">
        {(['all', 'words', 'grammar'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setStudyType(type)}
            className={`px-6 py-2 rounded-lg transition-all ${
              studyType === type
                ? 'bg-white/30 text-white font-semibold'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {type === 'all' ? '全て' : type === 'words' ? '単語' : '文法'}
          </button>
        ))}
      </div>

      {/* プログレス */}
      <div className="text-center text-white/80">
        {currentIndex + 1} / {studyItems.length}
      </div>

      {/* フラッシュカード */}
      <div className="flex justify-center">
        <div
          className="w-full max-w-2xl h-96 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIndex}-${isFlipped}`}
              initial={{ rotateY: isFlipped ? 0 : 180 }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* 表面 */}
              {!isFlipped && currentItem && (
                <div
                  className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center justify-center text-white border-2 border-white/30"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {'kanji' in currentItem ? (
                    <>
                      <div className="text-6xl font-bold mb-4">{currentItem.kanji}</div>
                      <div className="text-2xl opacity-80">{currentItem.kana}</div>
                    </>
                  ) : (
                    <div className="text-4xl font-bold text-center">{currentItem.pattern}</div>
                  )}
                  <div className="mt-8 text-sm opacity-60">クリックして答えを見る</div>
                </div>
              )}

              {/* 裏面 */}
              {isFlipped && currentItem && (
                <div
                  className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center justify-center text-white border-2 border-white/30"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  {'kanji' in currentItem ? (
                    <>
                      {(() => {
                        const meaningInfo = currentItem.meanings[0] ?? { meaning: '', example: '', exampleTranslation: '' };
                        return (
                          <>
                            <div className="text-3xl font-bold mb-2">{meaningInfo.meaning}</div>
                            <div className="text-lg opacity-80 mb-4">{currentItem.romaji}</div>
                            <div className="bg-white/10 rounded-lg p-4 max-w-lg">
                              {meaningInfo.example && <p className="mb-2">{meaningInfo.example}</p>}
                              {meaningInfo.exampleTranslation && (
                                <p className="text-sm opacity-80">{meaningInfo.exampleTranslation}</p>
                              )}
                              {currentItem.meanings.length > 1 && (
                                <p className="mt-3 text-xs opacity-70">
                                  他に{currentItem.meanings.length - 1}つの意味・例があります
                                </p>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold mb-2">{currentItem.meaning}</div>
                      <div className="text-sm opacity-80 mb-4 text-center">{currentItem.explanation}</div>
                      <div className="bg-white/10 rounded-lg p-4 max-w-lg">
                        <p className="mb-2">{currentItem.examples[0]?.japanese}</p>
                        <p className="text-sm opacity-80">{currentItem.examples[0]?.translation}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 評価ボタン */}
      {isFlipped && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => handleQuality(1)}
            className="bg-red-500/30 hover:bg-red-500/50 text-white px-6 py-3 rounded-lg transition-all"
          >
            難しい
          </button>
          <button
            onClick={() => handleQuality(3)}
            className="bg-yellow-500/30 hover:bg-yellow-500/50 text-white px-6 py-3 rounded-lg transition-all"
          >
            まあまあ
          </button>
          <button
            onClick={() => handleQuality(5)}
            className="bg-green-500/30 hover:bg-green-500/50 text-white px-6 py-3 rounded-lg transition-all"
          >
            簡単
          </button>
        </div>
      )}
    </div>
  );
}
