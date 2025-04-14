/**
 * Results Component
 * Handles displaying operation results and logs
 */
import { clearResults } from "../../utils/ui-utils.js";

export class ResultsComponent {
  constructor() {
    this.resultsElement = null;
    this.clearResultsBtn = null;
  }

  /**
   * Initialize the component
   */
  init() {
    this.resultsElement = document.getElementById("results");
    this.clearResultsBtn = document.getElementById("clearResultsBtn");

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for results area
   */
  setupEventHandlers() {
    if (this.clearResultsBtn) {
      this.clearResultsBtn.addEventListener("click", () => this.clear());
    }
  }

  /**
   * Add a message to the results
   * @param {string} message - Message to add
   */
  addMessage(message) {
    if (!this.resultsElement) return;

    const timestamp = new Date().toLocaleTimeString();
    this.resultsElement.textContent = `[${timestamp}] ${message}\n${this.resultsElement.textContent}`;
  }

  /**
   * Clear all results
   */
  clear() {
    if (this.resultsElement) {
      this.resultsElement.textContent = "Results will be displayed here...";
    }
  }
}
