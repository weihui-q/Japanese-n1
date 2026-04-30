# JLPT N1 学習アプリ

日本語能力試験N1向けの単語・文法学習ウェブサイト

## 機能

- 📚 **単語一覧** - N1単語の検索・閲覧
- 📝 **文法一覧** - N1文法の検索・閲覧
- 🎴 **フラッシュカード** - 間隔反復アルゴリズムによる効率的な記憶
- ✅ **テスト** - 4択クイズで理解度を確認
- 📊 **学習進捗** - 習得度のトラッキング
- 📥 **データインポート** - JSON形式でのデータ追加

## 使い方

### 開発サーバーの起動

```bash
cd jlpt-n1-study-new
npm install
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス

### ビルド

```bash
npm run build
```

### データのインポート

1. 「インポート」ページに移動
2. 単語または文法を選択
3. JSON形式でデータを入力
4. 「インポート」ボタンをクリック

#### 単語データのフォーマット

```json
[
  {
    "id": "w001",
    "kanji": "深刻",
    "kana": "しんこく",
    "romaji": "shinkoku",
    "meaning": "严峻,严重",
    "example": "環境問題が深刻化している。",
    "exampleTranslation": "环境问题日益严重。",
    "category": "形容動詞",
    "difficulty": 3,
    "tags": ["社会", "問題"]
  }
]
```

#### 文法データのフォーマット

```json
[
  {
    "id": "g001",
    "pattern": "〜にもかかわらず",
    "meaning": "尽管...但是...",
    "explanation": "表示前后项相反...",
    "examples": [
      {
        "japanese": "雨が降っていたにもかかわらず、彼は外出した。",
        "translation": "尽管下着雨,他还是外出了。"
      }
    ],
    "level": "N1",
    "category": "譲歩",
    "tags": ["逆接", "譲歩"]
  }
]
```

## 技術スタック

- React 18 + TypeScript
- Vite
- React Router
- Zustand (状態管理)
- TailwindCSS
- Framer Motion (アニメーション)
- IndexedDB (ローカル数据存储)

## 間隔反復アルゴリズム

SM-2アルゴリズムをベースに実装:
- 回答品質(0-5)に基づいて復習間隔を計算
- 習得度(0-5)をトラッキング
- 効率的な復習スケジュールを自動生成

## プロジェクト構造

```
jlpt-n1-study-new/
├── src/
│   ├── components/        # コンポーネント
│   │   └── Layout.tsx
│   ├── pages/            # ページ
│   │   ├── HomePage.tsx
│   │   ├── WordListPage.tsx
│   │   ├── GrammarListPage.tsx
│   │   ├── FlashcardPage.tsx
│   │   ├── QuizPage.tsx
│   │   ├── ProgressPage.tsx
│   │   └── ImportPage.tsx
│   ├── store/            # 状態管理
│   │   └── appStore.ts
│   ├── utils/            # ユーティリティ
│   │   ├── indexedDB.ts
│   │   └── spacedRepetition.ts
│   ├── data/             # データ
│   │   ├── words.json
│   │   └── grammar.json
│   ├── types/            # 型定義
│   │   └── index.ts
│   └── App.tsx
└── package.json
```

## カスタマイズ

- 単語データを編集: `src/data/words.json`
- 文法データを編集: `src/data/grammar.json`
- スタイルを変更: TailwindCSSクラスを編集

## ライセンス

MIT
