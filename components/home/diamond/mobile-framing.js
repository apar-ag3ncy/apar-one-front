/** Keep the entire burst inside a portrait camera without shrinking the resting jewel. */
export function diamondScale(compact, aspect, burst) {
  if (!compact) return 1.3;
  const progress = Math.min(1, Math.max(0, burst));
  return Math.min(1.3, 1.65 * aspect) / (1 + 2.5 * progress);
}
