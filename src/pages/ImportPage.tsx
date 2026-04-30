import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { Word, Grammar } from '../types';

export default function ImportPage() {
  const importWords = useAppStore(state => state.importWords);
  const importGrammar = useAppStore(state => state.importGrammar);
  
  const [importType, setImportType] = useState<'words' | 'grammar'>('words');
  const [jsonInput, setJsonInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      
      if (!Array.isArray(data)) {
        setMessage({ type: 'error', text: 'JSONは配列形式である必要があります' });
        return;
      }

      if (importType === 'words') {
        importWords(data as Word[]);
        setMessage({ type: 'success', text: `${data.length}個の単語をインポートしました` });
      } else {
        importGrammar(data as Grammar[]);
        setMessage({ type: 'success', text: `${data.length}個の文法をインポートしました` });
      }

      setJsonInput('');
    } catch (error) {
      setMessage({ type: 'error', text: 'JSONの解析に失敗しました' });
    }
  };

  const loadSampleData = () => {
    if (importType === 'words') {
      setJsonInput(JSON.stringify([
        {
          id: "w_sample",
          kanji: "示例",
          kana: "じれい",
          romaji: "jirei",
          meaning: "示例,例子",
          example: "これは示例です。",
          exampleTranslation: "这是示例。",
          category: "名詞",
          difficulty: 1,
          tags: ["示例"]
        }
      ], null, 2));
    } else {
      setJsonInput(JSON.stringify([
        {
          id: "g_sample",
          pattern: "〜示例",
          meaning: "示例语法",
          explanation: "这是一个示例语法",
          examples: [
            {
              japanese: "這是示例句子。",
              translation: "这是示例句子的翻译。"
            }
          ],
          level: "N1",
          category: "示例",
          tags: ["示例"]
        }
      ], null, 2));
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4 overflow-hidden">
      <h1 className="text-3xl font-bold text-white mb-4">データインポート</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* 左側: インポートフォーム */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 space-y-4 flex flex-col h-full min-h-0 overflow-hidden">
          <div className="space-y-4 overflow-y-auto min-h-0 pr-1 scrollbar-custom">
            {/* タイプ選択 */}
            <div className="flex gap-4">
              <button
                onClick={() => setImportType('words')}
                className={`px-6 py-2 rounded-lg transition-all ${
                  importType === 'words'
                    ? 'bg-white/30 text-white font-semibold'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                単語
              </button>
              <button
                onClick={() => setImportType('grammar')}
                className={`px-6 py-2 rounded-lg transition-all ${
                  importType === 'grammar'
                    ? 'bg-white/30 text-white font-semibold'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                文法
              </button>
            </div>

            {/* JSON入力 */}
            <div className="flex flex-col min-h-0">
              <label className="block text-white mb-2">JSONデータ</label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full min-h-[220px] h-64 md:h-72 lg:h-80 resize-none px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 font-mono text-sm"
                placeholder="JSONデータを入力してください..."
              />
            </div>

            {/* ボタン */}
            <div className="flex gap-4">
              <button
                onClick={handleImport}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                インポート
              </button>
              <button
                onClick={loadSampleData}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all"
              >
                サンプルデータを読み込む
              </button>
            </div>

            {/* メッセージ */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {message.text}
              </div>
            )}
          </div>
        </div>

        {/* 右側: フォーマット説明 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex flex-col h-full min-h-0 overflow-hidden">
          <h3 className="text-xl font-bold text-white mb-4">フォーマット説明</h3>
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-custom">
            <div className="bg-white/5 rounded-lg p-4 text-white/80 text-sm">
              <h4 className="font-bold mb-3">フォーマット:</h4>
              {importType === 'words' ? (
                <pre className="overflow-x-auto">
{`[
  {
    "id": "w001",
    "kanji": "漢字",
    "kana": "かな",
    "romaji": "romaji",
    "meanings": [
      {
        "meaning": "意味",
        "example": "例文",
        "exampleTranslation": "例文翻訳"
      }
    ],
    "category": "カテゴリ",
    "difficulty": 1,
    "tags": ["タグ1", "タグ2"]
  }
]`}
                </pre>
              ) : (
                <pre className="overflow-x-auto">
{`[
  {
    "id": "g001",
    "pattern": "文型",
    "meaning": "意味",
    "explanation": "説明",
    "examples": [
      {
        "japanese": "例文",
        "translation": "翻訳"
      }
    ],
    "level": "N1",
    "category": "カテゴリ",
    "tags": ["タグ1", "タグ2"]
  }
]`}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
