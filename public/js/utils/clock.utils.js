/**
 * Clock utilities for time display
 */

/**
 * Updates the clock element with current time
 * @param {HTMLElement} clockElement - Element where clock is displayed
 */
export function updateClock(clockElement) {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

/**
 * Initialize and start the clock
 * @param {HTMLElement} clockElement - Element where clock is displayed
 * @returns {number} - Interval ID for clearing if needed
 */
export function initClock(clockElement) {
  if (!clockElement) {
    console.error("Clock element not found");
    return null;
  }

  updateClock(clockElement);
  return setInterval(() => updateClock(clockElement), 1000);
}
