export function safeRate(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}
export function deriveMetrics(m = {}) {
  const impressions = Number(m.impressions || 0);
  const engagements = ['likes','replies','reposts','bookmarks'].reduce((sum, key) => sum + Number(m[key] || 0), 0);
  return {
    engagement_rate: safeRate(engagements, impressions),
    profile_ctr: safeRate(Number(m.profile_clicks || 0), impressions),
    link_ctr: safeRate(Number(m.link_clicks || 0), impressions),
    follow_rate: safeRate(Number(m.follows || 0), impressions),
    revenue_per_impression: safeRate(Number(m.revenue || 0), impressions),
    revenue_per_post: Number(m.revenue || 0)
  };
}
export function revenueScore(row) {
  return Number(row.revenue || 0) * 1000 + Number(row.conversions || 0) * 100 + Number(row.link_clicks || 0) + Number(row.impressions || 0) / 100000;
}
