// =============================================================
//  SCORE (out of 5): combines
//    - the public ratings from the database (ratings table), each
//      counted as many times as it has votes
//    - the reviews written by users on this site (1 vote each)
//  Change getScore() if you want a different formula.
// =============================================================

// Reviews written on this site (the database has no written reviews)
export function getReviews(place, userReviews = []) {
  return [...userReviews];
}

export function getScore(place, userReviews = []) {
  let total = 0;
  let votes = 0;

  for (const r of place.ratings ?? []) {
    const weight = r.votes ?? 1;
    total += (r.score / (r.maxScore || 5)) * 5 * weight;
    votes += weight;
  }
  for (const r of userReviews) {
    total += r.rating;
    votes += 1;
  }

  if (votes === 0) return { score: null, reviewCount: 0 };
  return { score: Math.round((total / votes) * 10) / 10, reviewCount: votes };
}

// How many site reviews have 5 stars, 4 stars, ...
export function ratingBreakdown(reviews) {
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));
}

// Colour of the score badge
export function scoreColor(score) {
  if (score == null) return "#9ca3af"; // no ratings yet
  if (score >= 4.5) return "#16a34a"; // green
  if (score >= 3.5) return "#ca8a04"; // amber
  return "#dc2626"; // red
}
