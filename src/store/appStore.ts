import { create } from 'zustand';
import type { Word, Grammar, Progress, StudyStats } from '../types';
import wordsData from '../data/words.json';
import grammarData from '../data/grammar.json';
import { getAllProgress, saveProgress, initDB } from '../utils/indexedDB';
import { calculateNextReview } from '../utils/spacedRepetition';

function normalizeString(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function createWordContentKey(word: Word): string {
  return [
    normalizeString(word.kanji),
    normalizeString(word.kana),
    normalizeString(word.romaji),
    normalizeString(word.category),
    word.difficulty,
    word.meanings
      .map(m => `${normalizeString(m.meaning)}|${normalizeString(m.example)}|${normalizeString(m.exampleTranslation)}`)
      .join('||'),
    word.tags.map(tag => normalizeString(tag)).join(',')
  ].join('||');
}

function createGrammarContentKey(grammar: Grammar): string {
  return [
    normalizeString(grammar.pattern),
    normalizeString(grammar.meaning),
    normalizeString(grammar.explanation),
    grammar.examples
      .map(ex => `${normalizeString(ex.japanese)}|${normalizeString(ex.translation)}`)
      .join('||'),
    normalizeString(grammar.level),
    normalizeString(grammar.category),
    grammar.tags.map(tag => normalizeString(tag)).join(',')
  ].join('||');
}

function generateImportId(prefix: string, start: number, existingIds: Set<string>): string {
  let next = start;
  let id = `${prefix}${String(next).padStart(4, '0')}`;
  while (existingIds.has(id)) {
    next += 1;
    id = `${prefix}${String(next).padStart(4, '0')}`;
  }
  existingIds.add(id);
  return id;
}

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
  importWords: (words: Word[]) => { added: number; skipped: number };
  importGrammar: (grammar: Grammar[]) => { added: number; skipped: number };
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
    const existingWords = get().words;
    const existingIds = new Set(existingWords.map(word => word.id));
    const existingContentKeys = new Set(existingWords.map(createWordContentKey));
    let nextIndex = existingWords.length + 1;
    const importedAt = new Date().toISOString();

    const uniqueWords = words.reduce<Word[]>((acc, word) => {
      const contentKey = createWordContentKey(word);
      if (!contentKey || existingContentKeys.has(contentKey)) {
        return acc;
      }

      const id = generateImportId('w_import_', nextIndex, existingIds);
      nextIndex = Number(id.replace('w_import_', '')) + 1;

      existingContentKeys.add(contentKey);
      acc.push({
        ...word,
        id,
        importedAt
      });
      return acc;
    }, []);

    set(state => ({ words: [...state.words, ...uniqueWords] }));
    return { added: uniqueWords.length, skipped: words.length - uniqueWords.length };
  },

  importGrammar: (grammar: Grammar[]) => {
    const existingGrammar = get().grammar;
    const existingIds = new Set(existingGrammar.map(item => item.id));
    const existingContentKeys = new Set(existingGrammar.map(createGrammarContentKey));
    let nextIndex = existingGrammar.length + 1;
    const importedAt = new Date().toISOString();

    const uniqueGrammar = grammar.reduce<Grammar[]>((acc, item) => {
      const contentKey = createGrammarContentKey(item);
      if (!contentKey || existingContentKeys.has(contentKey)) {
        return acc;
      }

      const id = generateImportId('g_import_', nextIndex, existingIds);
      nextIndex = Number(id.replace('g_import_', '')) + 1;

      existingContentKeys.add(contentKey);
      acc.push({
        ...item,
        id,
        importedAt
      });
      return acc;
    }, []);

    set(state => ({ grammar: [...state.grammar, ...uniqueGrammar] }));
    return { added: uniqueGrammar.length, skipped: grammar.length - uniqueGrammar.length };
  }
}));
