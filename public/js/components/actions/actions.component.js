/**
 * Actions Component
 * Handles the execution actions - run now, schedule, and stop
 */
import {
  runNowRequest,
  scheduleRequest,
  stopExecution,
  cancelSchedule,
} from "../../services/api-service.js";
import { formatDate } from "../../utils/ui-utils.js";

export class ActionsComponent {
  constructor(resultsCallback) {
    this.runNowBtn = null;
    this.scheduleBtn = null;
    this.stopBtn = null;
    this.scheduleDateInput = null;
    this.horaInicioInput = null;
    this.statusElement = null;
    this.nextExecutionElement = null;
    this.runBadgeElement = null;
    this.resultsCallback = resultsCallback;

    // Internal state
    this.state = {
      isRunning: false,
      isScheduled: false,
      scheduleTime: null,
      userConfigs: {},
    };
  }

  /**
   * Initialize the component
   */
  init() {
    // Get DOM references
    this.runNowBtn = document.getElementById("runNowBtn");
    this.scheduleBtn = document.getElementById("scheduleBtn");
    this.stopBtn = document.getElementById("stopBtn");
    this.scheduleDateInput = document.getElementById("scheduleDateInput");
    this.horaInicioInput = document.getElementById("horaInicio");
    this.statusElement = document.getElementById("status");
    this.nextExecutionElement = document.getElementById("nextExecution");
    this.runBadgeElement = document.getElementById("runBadge");

    // Set today's date in the date input
    this.setDefaultDate();

    // Initialize badge count to 0
    this.updateRunBadge(0);

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Updates the badge count on the Run Now button
   * @param {number} count - Number to display in the badge
   */
  updateRunBadge(count) {
    if (this.runBadgeElement) {
      this.runBadgeElement.textContent = count.toString();
      this.runBadgeElement.style.display = count > 0 ? "flex" : "none";
    }
  }

  /**
   * Set up event handlers for action buttons
   */
  setupEventHandlers() {
    if (this.runNowBtn) {
      this.runNowBtn.addEventListener("click", () => this.handleRunNow());
    }

    if (this.scheduleBtn) {
      this.scheduleBtn.addEventListener("click", () =>
        this.handleScheduleExecution()
      );
    }

    if (this.stopBtn) {
      this.stopBtn.addEventListener("click", () => this.handleStopExecution());
    }
  }

  /**
   * Set the date input to today's date
   */
  setDefaultDate() {
    if (this.scheduleDateInput) {
      const today = new Date();
      this.scheduleDateInput.valueAsDate = today;
    }
  }

  /**
   * Sets the status display
   * @param {string} type - Status type (active, scheduled, error, inactive)
   * @param {string} text - Status text to display
   */
  setStatus(type, text) {
    if (this.statusElement) {
      this.statusElement.textContent = text;
      this.statusElement.className = "status-indicator";

      if (type) {
        this.statusElement.classList.add(`status-${type}`);
      }
    }
  }

  /**
   * Handle run now button click
   * @param {Array<string>} selectedUsers - IDs of selected users
   * @param {Object} globalConfig - Global configuration
   * @param {Object} userConfigs - User-specific configurations
   */
  async handleRunNow(selectedUsers, globalConfig, userConfigs = {}) {
    if (!selectedUsers || selectedUsers.length === 0) {
      this.resultsCallback("❌ You must select at least one user");
      return;
    }

    this.setStatus("active", "Running requests...");
    this.state.isRunning = true;

    // Update badge with selected users count
    this.updateRunBadge(selectedUsers.length);

    try {
      // Save configurations before execution
      this.saveConfigs(globalConfig, userConfigs);

      // Call API to run now
      const data = await runNowRequest(
        selectedUsers,
        globalConfig,
        userConfigs
      );

      this.resultsCallback(
        `✅ Execution request sent for ${
          selectedUsers.length
        } users: ${selectedUsers.join(", ")}`
      );

      if (data.success) {
        this.resultsCallback(`📊 ${data.message || "Process started"}`);
      } else {
        this.setStatus("error", "Execution error");
        this.resultsCallback(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      this.setStatus("error", "Connection error");
      this.resultsCallback(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Handle schedule button click
   */
  async handleScheduleExecution(selectedUsers, globalConfig, userConfigs = {}) {
    if (!selectedUsers || selectedUsers.length === 0) {
      this.resultsCallback("❌ You must select at least one user");
      return;
    }

    const horaInicio = this.horaInicioInput.value;
    const scheduleDate = this.scheduleDateInput.value;

    if (!horaInicio || !scheduleDate) {
      this.resultsCallback("❌ You must enter a valid date and time");
      return;
    }

    // Calculate next execution date and time
    const [hours, minutes] = horaInicio.split(":").map(Number);

    // Create date from selected date to avoid timezone issues
    const dateParts = scheduleDate.split("-").map(Number);
    const selectedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

    // Set time on selected date
    selectedDate.setHours(hours, minutes, 0, 0);

    // Check if date is in the future
    if (selectedDate < new Date()) {
      this.resultsCallback(
        "⚠️ Warning: Selected date and time has already passed. Please select a future time."
      );
      return;
    }

    this.state.scheduleTime = selectedDate;
    this.state.isScheduled = true;

    // Format date for display
    const formattedDate = formatDate(selectedDate);

    this.setStatus("scheduled", "Scheduled");
    if (this.nextExecutionElement) {
      this.nextExecutionElement.textContent = `Next execution: ${formattedDate}`;
    }

    this.resultsCallback(
      `🕒 Execution scheduled for ${selectedUsers.length} users at ${formattedDate}`
    );

    try {
      // Save configurations before scheduling
      await this.saveConfigs(globalConfig, userConfigs);

      // Call API to schedule
      const data = await scheduleRequest(
        selectedUsers,
        globalConfig,
        userConfigs,
        selectedDate
      );

      if (!data.success) {
        this.resultsCallback(
          `⚠️ Warning: ${data.error || "Error saving schedule on server"}`
        );
      }
    } catch (error) {
      this.resultsCallback(`⚠️ Warning: ${error.message}`);
    }
  }

  /**
   * Handle stop button click
   */
  async handleStopExecution(selectedUsers) {
    if (!selectedUsers || selectedUsers.length === 0) {
      this.resultsCallback("❌ You must select at least one user to stop");
      return;
    }

    try {
      // Call API to stop execution
      const response = await stopExecution(selectedUsers);

      if (response.success) {
        this.setStatus("inactive", "Inactive");
        if (this.nextExecutionElement) {
          this.nextExecutionElement.textContent = "";
        }

        this.resultsCallback(
          `🛑 Execution stopped for ${
            selectedUsers.length
          } users: ${selectedUsers.join(", ")}`
        );

        // If there was a schedule, also cancel it
        if (this.state.isScheduled) {
          const cancelResponse = await cancelSchedule(selectedUsers);
          if (cancelResponse.success) {
            this.state.isScheduled = false;
            this.state.scheduleTime = null;
            this.resultsCallback("🛑 Schedule has also been cancelled");
          }
        }
      } else {
        this.resultsCallback(
          `⚠️ ${response.message || "Could not stop execution"}`
        );
      }
    } catch (error) {
      this.resultsCallback(`❌ Error stopping execution: ${error.message}`);
    }
  }

  /**
   * Save configurations to server before actions
   * @param {object} globalConfig - Global configuration
   * @param {object} userConfigs - User configurations
   */
  async saveConfigs(globalConfig, userConfigs = {}) {
    // Save configs for next time
    this.state.userConfigs = userConfigs;

    try {
      const response = await apiSaveUserConfigs(userConfigs, globalConfig);
      return response;
    } catch (error) {
      console.error("Error saving configurations:", error);
      // Non-blocking error
      return { success: false, error: error.message };
    }
  }
}
