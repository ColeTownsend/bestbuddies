/**
 * Course constants for the Best Buddies Challenge
 * These values should match the actual GPX data and course profile SVG
 */

// Course profile SVG dimensions (from course-profile.svg viewBox)
export const COURSE_PROFILE_SVG_WIDTH = 3072;
export const COURSE_PROFILE_SVG_HEIGHT = 384;

// Expected total distance in miles
// TODO: This should be validated against actual GPX totalDistance
export const EXPECTED_TOTAL_DISTANCE = 108.21;

/**
 * Convert page X coordinate to distance along the route
 * @param pageX - X coordinate on the page (mouse position + scroll)
 * @returns Distance in miles
 */
export function pageXToDistance(pageX: number): number {
  const ratio = Math.max(0, Math.min(1, pageX / COURSE_PROFILE_SVG_WIDTH));
  return ratio * EXPECTED_TOTAL_DISTANCE;
}

/**
 * Convert distance to page X coordinate
 * @param distance - Distance in miles
 * @returns Page X coordinate
 */
export function distanceToPageX(distance: number): number {
  const ratio = distance / EXPECTED_TOTAL_DISTANCE;
  return ratio * COURSE_PROFILE_SVG_WIDTH;
}

/**
 * Convert distance to array index for elevation data
 * @param distance - Distance in miles
 * @param totalPoints - Total number of data points
 * @param totalDistance - Actual total distance from GPX
 * @returns Array index
 */
export function distanceToIndex(distance: number, totalPoints: number, totalDistance: number): number {
  const ratio = distance / totalDistance;
  return Math.floor(Math.max(0, Math.min(totalPoints - 1, ratio * totalPoints)));
}

/**
 * Convert array index to distance
 * @param index - Array index
 * @param totalPoints - Total number of data points
 * @param totalDistance - Actual total distance from GPX
 * @returns Distance in miles
 */
export function indexToDistance(index: number, totalPoints: number, totalDistance: number): number {
  const ratio = index / (totalPoints - 1);
  return ratio * totalDistance;
}