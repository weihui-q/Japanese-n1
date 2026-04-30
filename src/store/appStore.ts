import { create } from 'zustand';
import type { Word, Grammar, Progress, StudyStats } from '../types';
import wordsData from '../data/words.json';
import grammarData from '../data/grammar.json';
import { getAllProgress, saveProgress, initDB } from '../utils/indexedDB';
import { calculateNextReview } from '../utils/spacedRepetition';

interface AppState {
  // データ
  words: Word[];
  grammar: Grammar[];
  progresses: Progress[];
  
  // ローディング状態
  isLoading: boolean;
  isInitialized: boolean;
  
  // 初期化
  initialize: () => Promise<void>;
  
  // 単語関連
  getWord: (id: string) => Word | undefined;
  
  // 文法関連
  getGrammar: (id: string) => Grammar | undefined;
  
  // 進捗関連
  updateProgress: (itemId: string, itemType: 'word' | 'grammar', quality: number) => Promise<void>;
  getProgress: (itemId: string) => Progress | undefined;
  
  // 統計
  getStats: () => StudyStats;
  
  // データインポート
  importWords: (words: Word[]) => void;
  importGrammar: (grammar: Grammar[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  words: wordsData as Word[],
  grammar: grammarData as Grammar[],
  progresses: [],
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true });
    try {
      await initDB();
      const progresses = await getAllProgress();
      set({ progresses, isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('初期化エラー:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  getWord: (id: string) => {
    return get().words.find(w => w.id === id);
  },

  getGrammar: (id: string) => {
    return get().grammar.find(g => g.id === id);
  },

  updateProgress: async (itemId: string, itemType: 'word' | 'grammar', quality: number) => {
    const currentProgress = get().progresses.find(p => p.itemId === itemId);
    
    const newProgress = calculateNextReview(quality, currentProgress ? {
      ...currentProgress,
      itemId,
      itemType
    } : {
      itemId,
      itemType,
      masteryLevel: 0,
      nextReview: new Date().toISOString(),
      reviewCount: 0,
      correctCount: 0,
      lastReviewed: new Date().toISOString(),
      ease: 2.5,
      interval: 1
    });

    await saveProgress(newProgress);
    
    set(state => {
      const updatedProgresses = state.progresses.filter(p => p.itemId !== itemId);
      return { progresses: [...updatedProgresses, newProgress] };
    });
  },

  getProgress: (itemId: string) => {
    return get().progresses.find(p => p.itemId === itemId);
  },

  getStats: () => {
    const { words, grammar, progresses } = get();
    
    const masteredWords = progresses.filter(p => 
      p.itemType === 'word' && p.masteryLevel >= 4
    ).length;
    
    const masteredGrammar = progresses.filter(p => 
      p.itemType === 'grammar' && p.masteryLevel >= 4
    ).length;

    const today = new Date().toDateString();
    const todayStudyCount = progresses.filter(p => {
      const lastReviewed = new Date(p.lastReviewed);
      return lastReviewed.toDateString() === today;
    }).length;

    return {
      totalWords: words.length,
      totalGrammar: grammar.length,
      masteredWords,
      masteredGrammar,
      studyStreak: 0, // TODO: 実装
      todayStudyCount,
      totalStudyTime: 0 // TODO: 実装
    };
  },

  importWords: (words: Word[]) => {
    set(state => ({ words: [...state.words, ...words] }));
  },

  importGrammar: (grammar: Grammar[]) => {
    set(state => ({ grammar: [...state.grammar, ...grammar] }));
  }
}));
