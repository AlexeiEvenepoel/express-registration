/**
 * UI Utilities
 * Common UI helper functions
 */

/**
 * Format a date for display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  return date.toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Add a message to the results area
 * @param {HTMLElement} resultsElement - Element where results are displayed
 * @param {string} message - Message to add
 */
export function addToResults(resultsElement, message) {
  if (!resultsElement) return;

  const timestamp = new Date().toLocaleTimeString();
  resultsElement.textContent = `[${timestamp}] ${message}\n${resultsElement.textContent}`;
}

/**
 * Clear the results area
 * @param {HTMLElement} resultsElement - Element to clear
 */
export function clearResults(resultsElement) {
  if (resultsElement) {
    resultsElement.textContent = "Results will be displayed here...";
  }
}
