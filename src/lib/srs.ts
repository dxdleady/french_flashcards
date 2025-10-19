export interface SRSResult {
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: Date;
}

export function calculateSRS(
  quality: number,
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number
): SRSResult {
  let easeFactor = currentEaseFactor;
  let interval = currentInterval;
  let repetitions = currentRepetitions;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3;
    } else if (repetitions === 2) {
      interval = 7;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    repetitions += 1;
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    repetitions = 0;
    interval = 1;
  }

  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ease_factor: easeFactor,
    interval,
    repetitions,
    next_review: nextReview
  };
}

export function getQualityFromPerformance(
  wasCorrect: boolean,
  responseTimeMs: number
): number {
  if (!wasCorrect) return 0;

  if (responseTimeMs < 2000) return 5;
  if (responseTimeMs < 5000) return 4;
  return 3;
}
