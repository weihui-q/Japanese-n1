// 単語データ構造
export interface Word {
  id: string;
  kanji: string;        // 漢字表記
  kana: string;         // 読み方
  romaji: string;       // ローマ字
  meanings: Array<{
    meaning: string;    // 意味
    example?: string;   // 例文
    exampleTranslation?: string; // 例文翻訳
  }>;
  category: string;     // 分類
  difficulty: number;   // 難易度 1-5
  tags: string[];       // タグ
  partOfSpeech?: string; // 品詞
  importedAt?: string;  // インポート日時
}

// 文法データ構造
export interface Grammar {
  id: string;
  pattern: string;      // 文型
  meaning: string;      // 意味
  explanation: string;  // 説明
  examples: Array<{
    japanese: string;
    translation: string;
  }>;
  level: 'N1';
  category: string;
  tags: string[];
  importedAt?: string;  // インポート日時
}

// 学習進捗
export interface Progress {
  itemId: string;
  itemType: 'word' | 'grammar';
  masteryLevel: number;     // 0-5 習得度
  nextReview: string;       // 次の復習日
  reviewCount: number;      // 復習回数
  correctCount: number;     // 正解回数
  lastReviewed: string;     // 最終復習日
  ease: number;            // 容易度係数
  interval: number;        // 復習間隔（日）
}

// 收藏項目
export interface FavoriteItem {
  itemId: string;
  itemType: 'word' | 'grammar';
}

// テスト結果
export interface QuizResult {
  itemId: string;
  itemType: 'word' | 'grammar';
  correct: boolean;
  timestamp: string;
}

// 学習統計
export interface StudyStats {
  totalWords: number;
  totalGrammar: number;
  masteredWords: number;
  masteredGrammar: number;
  studyStreak: number;
  todayStudyCount: number;
  totalStudyTime: number;
}
