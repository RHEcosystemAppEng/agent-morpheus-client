/**
 * Pure function to calculate repositories analyzed count
 * Returns the count of repositories with "completed" state only
 */
export function calculateRepositoriesAnalyzed(
  componentStates: Record<string, number>
): number {
  return componentStates["completed"] || 0;
}

/**
 * Pure function to format repositories analyzed display
 * Formats the count as "analyzedCount/totalCount analyzed"
 */
export function formatRepositoriesAnalyzed(
  analyzedCount: number,
  totalCount: number
): string {
  return `${analyzedCount}/${totalCount} analyzed`;
}

