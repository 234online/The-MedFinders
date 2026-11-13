// =============================================================
//  SCORE: the average of all reviews for a place (1–5, one decimal).
//  Reviews = the demo ones in places.json + the ones users write.
//  Change getScore() if you want a different formula.
// =============================================================

export function getReviews(place, userReviews = []) {
  return [...userReviews, ...(place.reviews ?? [])];
}

export function getScore(place, userReviews = []) {
  const all = getReviews(place, userReviews);
  if (all.length === 0) return { score: null, reviewCount: 0 };
  const average = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
  return { score: Math.round(average * 10) / 10, reviewCount: all.length };
}

// How many reviews have 5 stars, 4 stars, ... (for the bars in the details window)
export function ratingBreakdown(reviews) {
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));
}

// Colour of the score badge
export function scoreColor(score) {
  if (score == null) return "#9ca3af"; // no reviews yet
  if (score >= 4.5) return "#16a34a"; // green
  if (score >= 3.5) return "#ca8a04"; // amber
  return "#dc2626"; // red
}
