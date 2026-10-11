import { WorkerReputation } from '@core/models/review.model';
import { byReputation, formatRating, ratingLabel, reviewCount } from './review-criteria';

const reputation = (average: number | null, count: number, score: number): WorkerReputation => ({
  average, count, score, punctuality: average, effort: average, quality: average
});

describe('review criteria', () => {
  it('formats ratings the Brazilian way', () => {
    expect(formatRating(4.7)).toBe('4,7');
    expect(formatRating(5)).toBe('5,0');
    expect(reviewCount(1)).toBe('1 avaliação');
    expect(reviewCount(12)).toBe('12 avaliações');
  });

  it('describes the rating for screen readers', () => {
    expect(ratingLabel(reputation(4.7, 12, 4.5))).toBe('Nota 4,7 de 5, em 12 avaliações');
    expect(ratingLabel(reputation(null, 0, 3.5))).toBe('Ainda sem avaliações');
  });

  it('orders by the weighted score from the API, not by the raw average', () => {
    const oneFive = { name: 'uma nota 5', reputation: reputation(5, 1, 4) };
    const manyGood = { name: 'várias 4,7', reputation: reputation(4.7, 10, 4.5) };
    expect([oneFive, manyGood].sort(byReputation).map((x) => x.name)).toEqual(['várias 4,7', 'uma nota 5']);
  });
});
