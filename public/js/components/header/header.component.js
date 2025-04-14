/**
 * Header Component
 * Manages the header section with the clock display
 */
import { updateClock } from "../../utils/clock.utils.js";

export class HeaderComponent {
  constructor() {
    this.clockElement = null;
    this.clockInterval = null;
  }

  /**
   * Initialize the component
   */
  init() {
    this.clockElement = document.getElementById("clock");
    this.startClock();
  }

  /**
   * Start the clock update interval
   */
  startClock() {
    if (!this.clockElement) {
      console.error("Clock element not found");
      return null;
    }

    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    return this.clockInterval;
  }

  /**
   * Update the clock display with current time
   */
  updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    this.clockElement.textContent = `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Stop the clock interval
   */
  stopClock() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }
}
