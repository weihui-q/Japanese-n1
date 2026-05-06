import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { getGrammarReading } from '../utils/japanese';
import { speakJapanese } from '../utils/speech';
import type { Word, Grammar } from '../types';

type QuizType = 'words' | 'grammar' | 'all';

type QuestionData = {
  item: Word | Grammar;
  type: 'word' | 'grammar';
  options: Array<{
    text: string;
    meaning: string;
    isCorrect: boolean;
  }>;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  answered: boolean;
  selectedMeaning?: {
    meaning: string;
    example?: string;
    exampleTranslation?: string;
  };
};

export default function QuizPage() {
  const words = useAppStore(state => state.words);
  const grammar = useAppStore(state => state.grammar);
  const updateProgress = useAppStore(state => state.updateProgress);

  const [quizType, setQuizType] = useState<QuizType>('words');
  const [questionHistory, setQuestionHistory] = useState<QuestionData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const generateQuestion = () => {
    let availableItems: Array<{ item: Word | Grammar; type: 'word' | 'grammar' }> = [];

    if (quizType === 'words' || quizType === 'all') {
      availableItems.push(...words.map(item => ({ item, type: 'word' as const })));
    }
    if (quizType === 'grammar' || quizType === 'all') {
      availableItems.push(...grammar.map(item => ({ item, type: 'grammar' as const })));
    }

    if (availableItems.length < 4) return;

    const askedIds = questionHistory.map(q => `${q.type}:${q.item.id}`);
    const remainingItems = availableItems.filter(item => !askedIds.includes(`${item.type}:${item.item.id}`));
    const questionPool = remainingItems.length >= 4 ? remainingItems : availableItems;

    const randomIndex = Math.floor(Math.random() * questionPool.length);
    const questionData = questionPool[randomIndex];
    const selectedMeaning = questionData.type === 'word'
      ? ((questionData.item as Word).meanings[Math.floor(Math.random() * (questionData.item as Word).meanings.length)] || (questionData.item as Word).meanings[0])
      : undefined;

    let correctAnswer: string;
    let optionsWithMeaning: Array<{ text: string; meaning: string; isCorrect: boolean }>;

    if (questionData.type === 'word') {
      // 对于单词，选择中文意思
      correctAnswer = selectedMeaning?.meaning || '';
      const otherMeanings = words
        .filter(w => w.id !== questionData.item.id)
        .map(w => w.meanings[0]?.meaning)
        .filter(Boolean)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      optionsWithMeaning = [correctAnswer, ...otherMeanings].map(meaning => ({
        text: meaning,
        meaning: '',
        isCorrect: meaning === correctAnswer
      }));
    } else {
      // 对于语法，改为选择中文意思
      correctAnswer = (questionData.item as Grammar).meaning;
      const wrongOptions = grammar
        .filter(g => g.id !== questionData.item.id)
        .map(g => g.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      optionsWithMeaning = [correctAnswer, ...wrongOptions].map(meaning => ({
        text: meaning,
        meaning: '',
        isCorrect: meaning === correctAnswer
      }));
    }

    const shuffledOptions = optionsWithMeaning.sort(() => Math.random() - 0.5);

    const newQuestion: QuestionData = {
      item: questionData.item,
      type: questionData.type,
      options: shuffledOptions,
      selectedAnswer: null,
      isCorrect: null,
      answered: false,
      selectedMeaning
    };

    setQuestionHistory(prev => {
      const next = [...prev, newQuestion];
      setCurrentQuestionIndex(next.length - 1);
      return next;
    });
  };

  useEffect(() => {
    setQuestionHistory([]);
    setCurrentQuestionIndex(0);
    setScore({ correct: 0, total: 0 });
    generateQuestion();
  }, [words, grammar, quizType]);

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questionHistory.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      generateQuestion();
    }
  };

  const handleAnswer = async (answer: string) => {
    const currentQuestion = questionHistory[currentQuestionIndex];
    if (!currentQuestion || currentQuestion.answered) return;

    const correct = currentQuestion.options.find(opt => opt.text === answer)?.isCorrect || false;

    setQuestionHistory(prev =>
      prev.map((q, index) =>
        index === currentQuestionIndex
          ? { ...q, selectedAnswer: answer, isCorrect: correct, answered: true }
          : q
      )
    );

    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));

    await updateProgress(currentQuestion.item.id, currentQuestion.type, correct ? 5 : 1);
  };

  const getTotalItems = () => {
    switch (quizType) {
      case 'words': return words.length;
      case 'grammar': return grammar.length;
      case 'all': return words.length + grammar.length;
      default: return 0;
    }
  };

  if (getTotalItems() < 4) {
    return (
      <div className="text-center text-white py-20">
        <p className="text-2xl">テストを行うには最低4つの項目が必要です</p>
        <p className="text-sm opacity-70 mt-2">
          現在の選択: {quizType === 'words' ? '単語' : quizType === 'grammar' ? '文法' : '全て'} ({getTotalItems()}項目)
        </p>
      </div>
    );
  }

  const currentQuestion = questionHistory[currentQuestionIndex];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">テスト</h1>

          {/* 题目类型选择 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setQuizType('words')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  quizType === 'words'
                    ? 'bg-white/30 text-white font-semibold'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                単語 ({words.length})
              </button>
              <button
                onClick={() => setQuizType('grammar')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  quizType === 'grammar'
                    ? 'bg-white/30 text-white font-semibold'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                文法 ({grammar.length})
              </button>
              <button
                onClick={() => setQuizType('all')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  quizType === 'all'
                    ? 'bg-white/30 text-white font-semibold'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                全て ({words.length + grammar.length})
              </button>
            </div>
          </div>

          {/* スコア */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1">
              {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
            </div>
            <div className="text-sm md:text-base opacity-80">
              {score.correct} / {score.total} 正解
            </div>
          </div>

          {/* 問題 */}
          {currentQuestion && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
              <div className="text-center mb-5">
                <div className="text-sm md:text-base opacity-70 mb-2">
                  {currentQuestion.type === 'word' ? '単語' : '文法'} • {currentQuestion.type === 'word' ? '以下の単語の意味を選んでください' : '以下の文法の意味を選んでください'}
                </div>
                <div className="text-sm md:text-base opacity-80">
                  問題 {currentQuestionIndex + 1} / {questionHistory.length}
                </div>
              </div>

              {currentQuestion.type === 'word' ? (
                // 单词：显示 kanji，选择中文意思
                <div className="text-center mb-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl md:text-3xl font-bold">
                      {(currentQuestion.item as Word).kanji}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <span>読み: {(currentQuestion.item as Word).kana}</span>
                      <button
                        type="button"
                        aria-label="発音を再生"
                        onClick={() => speakJapanese((currentQuestion.item as Word).kana)}
                        className="text-white/70 hover:text-white transition"
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                  {currentQuestion.answered && currentQuestion.selectedMeaning && (
                    <div className="text-sm opacity-80 bg-white/10 rounded-2xl p-4 mx-auto max-w-2xl">
                      <strong>{currentQuestion.selectedMeaning.meaning}</strong>
                      {currentQuestion.selectedMeaning.example && (
                        <div className="mt-1 italic">{currentQuestion.selectedMeaning.example.replace('{kanji}', (currentQuestion.item as Word).kanji)}</div>
                      )}
                      {currentQuestion.selectedMeaning.exampleTranslation && (
                        <div className="mt-1 opacity-70">{currentQuestion.selectedMeaning.exampleTranslation.replace('{kanji}', (currentQuestion.item as Word).kanji)}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // 语法：显示文法形式，选择中文意思
                <div className="text-center mb-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl md:text-3xl font-bold">
                      {(currentQuestion.item as Grammar).pattern}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      {getGrammarReading((currentQuestion.item as Grammar).pattern) && (
                        <span>読み: {getGrammarReading((currentQuestion.item as Grammar).pattern)}</span>
                      )}
                      <button
                        type="button"
                        aria-label="発音を再生"
                        onClick={() => speakJapanese(getGrammarReading((currentQuestion.item as Grammar).pattern) ?? (currentQuestion.item as Grammar).pattern)}
                        className="text-white/70 hover:text-white transition"
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                  {currentQuestion.answered && (
                    <div className="text-sm opacity-80 bg-white/10 rounded-2xl p-4 mx-auto max-w-2xl">
                      <strong>{(currentQuestion.item as Grammar).meaning}</strong>
                      {((currentQuestion.item as Grammar).examples[0]?.japanese) && (
                        <div className="mt-1 italic">{(currentQuestion.item as Grammar).examples[0].japanese}</div>
                      )}
                      {((currentQuestion.item as Grammar).examples[0]?.translation) && (
                        <div className="mt-1 opacity-70">{(currentQuestion.item as Grammar).examples[0].translation}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="text-center text-sm md:text-base opacity-70 mb-4">
                {currentQuestion.type === 'word' ? '正しい意味を選んでください' : '正しい意味を選んでください'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto mb-4">
                {currentQuestion.options.map((option, index) => {
                  let buttonClass = 'bg-white/10 hover:bg-white/20';

                  if (currentQuestion.answered) {
                    if (option.isCorrect) {
                      buttonClass = 'bg-green-500/50';
                    } else if (option.text === currentQuestion.selectedAnswer && !option.isCorrect) {
                      buttonClass = 'bg-red-500/50';
                    } else {
                      buttonClass = 'bg-white/5 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option.text)}
                      disabled={currentQuestion.answered}
                      className={`w-full px-4 py-4 rounded-2xl text-left text-sm md:text-base transition-all ${buttonClass}`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                          <span className="font-semibold">{option.text}</span>
                        </div>
                        {currentQuestion.answered && option.meaning && (
                          <span className="text-xs opacity-70">{option.meaning}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <button
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`w-full sm:w-auto px-4 py-3 rounded-2xl text-sm md:text-base transition-all ${
                    currentQuestionIndex === 0
                      ? 'bg-white/5 opacity-50 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  ← 前の問題
                </button>

                <div className="flex flex-wrap justify-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={goToNextQuestion}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all text-sm md:text-base"
                  >
                    次の問題 →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
