import type { Progress } from '../types';

// SM-2アルゴリズムに基づく間隔反復計算
export function calculateNextReview(
  quality: number,        // 回答品質 0-5 (0=全く分からない, 5=完全に覚えている)
  currentProgress?: Progress
): Progress {
  // デフォルト値
  let ease = currentProgress?.ease ?? 2.5;
  let interval = currentProgress?.interval ?? 1;
  let reviewCount = currentProgress?.reviewCount ?? 0;
  let correctCount = currentProgress?.correctCount ?? 0;

  // 品質に基づいて容易度係数を更新
  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  // 正解・不正解で分岐
  if (quality < 3) {
    // 不正解の場合は最初から
    interval = 1;
    reviewCount += 1;
  } else {
    // 正解の場合
    reviewCount += 1;
    correctCount += 1;

    if (reviewCount === 1) {
      interval = 1;
    } else if (reviewCount === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
  }

  // 習得度を計算 (0-5)
  const masteryLevel = Math.min(5, Math.floor((correctCount / Math.max(1, reviewCount)) * 5));

  // 次の復習日を計算
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    itemId: currentProgress?.itemId ?? '',
    itemType: currentProgress?.itemType ?? 'word',
    masteryLevel,
    nextReview: nextReview.toISOString(),
    reviewCount,
    correctCount,
    lastReviewed: new Date().toISOString(),
    ease,
    interval
  };
}

// 習得度に基づいてカードの優先度を計算
export function calculatePriority(progress?: Progress): number {
  if (!progress) return 100; // 未学習は最優先

  const now = new Date();
  const nextReview = new Date(progress.nextReview);
  
  // 期日を過ぎている場合は優先度高
  if (now >= nextReview) {
    return 100 - progress.masteryLevel * 10;
  }

  // まだ期日が来ていない場合は優先度低
  const daysUntilReview = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, 50 - daysUntilReview * 5);
}

// 復習すべきアイテムをソート
export function sortItemsForReview<T extends { id: string }>(
  items: T[],
  progresses: Progress[]
): T[] {
  const progressMap = new Map(progresses.map(p => [p.itemId, p]));

  return items.sort((a, b) => {
    const progressA = progressMap.get(a.id);
    const progressB = progressMap.get(b.id);
    
    const priorityA = calculatePriority(progressA);
    const priorityB = calculatePriority(progressB);
    
    return priorityB - priorityA; // 優先度が高い順
  });
}
