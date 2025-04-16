/**
 * Main App Controller
 * Connects and orchestrates all components
 */
import { HeaderComponent } from "./components/header/header.component.js";
import { UsersComponent } from "./components/users/users.component.js";
import { ConfigComponent } from "./components/config/config.component.js";
import { ActionsComponent } from "./components/actions/actions.component.js";
import { ResultsComponent } from "./components/results/results.component.js";
import { setupEventSource } from "./services/api-service.js";
import { formatDate } from "./utils/ui-utils.js";
import { initializeUserConfigs, saveUserConfigs } from "./utils/profiles.js";

class App {
  constructor() {
    // Initialize state
    this.appState = {
      isRunning: false,
      isScheduled: false,
      scheduleTime: null,
      selectedUsers: [],
      userConfigs: {},
      userStates: {},
    };

    // Create components
    this.resultsComponent = new ResultsComponent();
    this.headerComponent = new HeaderComponent();
    this.usersComponent = new UsersComponent();
    this.configComponent = new ConfigComponent((message) =>
      this.resultsComponent.addMessage(message)
    );
    this.actionsComponent = new ActionsComponent((message) =>
      this.resultsComponent.addMessage(message)
    );

    // Initialize server connection
    this.eventSource = null;
  }

  /**
   * Initialize the application
   */
  init() {
    // Wait for both DOM content and components to be loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.waitForComponents()
      );
    } else {
      this.waitForComponents();
    }
  }

  /**
   * Wait for component templates to be loaded
   */
  waitForComponents() {
    // Check if components are already loaded
    if (document.getElementById("headerContainer")?.children.length > 0) {
      this.initializeApp();
    } else {
      // Wait for components loaded event
      document.addEventListener("componentsLoaded", () => this.initializeApp());
    }
  }

  /**
   * Initialize the application after components are loaded
   */
  initializeApp() {
    console.log("Initializing application...");

    // Load configurations
    this.loadConfigs();

    // Initialize components
    this.resultsComponent.init();
    this.headerComponent.init();
    this.usersComponent.init();
    this.configComponent.init();
    this.actionsComponent.init();

    // Connect component events
    this.connectComponents();

    // Set up server updates
    this.setupServerUpdates();
  }

  /**
   * Load application configurations
   */
  loadConfigs() {
    // Initialize user configurations
    this.appState.userConfigs = initializeUserConfigs();
  }

  /**
   * Connect component events for interaction
   */
  connectComponents() {
    // Connect Run Now button
    this.actionsComponent.runNowBtn.addEventListener("click", () => {
      this.actionsComponent.handleRunNow(
        this.usersComponent.selectedUsers,
        this.configComponent.getGlobalConfig(),
        this.appState.userConfigs
      );
    });

    // Connect Schedule button
    this.actionsComponent.scheduleBtn.addEventListener("click", () => {
      this.actionsComponent.handleScheduleExecution(
        this.usersComponent.selectedUsers,
        this.configComponent.getGlobalConfig(),
        this.appState.userConfigs
      );
    });

    // Connect Stop button
    this.actionsComponent.stopBtn.addEventListener("click", () => {
      this.actionsComponent.handleStopExecution(
        this.usersComponent.selectedUsers
      );
    });

    // Connect user selection changes to update Run Now badge
    this.usersComponent.onUserSelectionChange = (selectedUsers) => {
      this.actionsComponent.updateRunBadge(selectedUsers.length);
    };
  }

  /**
   * Set up connection to receive server updates
   */
  setupServerUpdates() {
    setupEventSource(
      // Message handler
      (data) => {
        // Handle initial state when connecting
        if (data.initialState) {
          // Get user configs from server if available
          if (data.initialState.usersConfig) {
            this.appState.userConfigs = {
              ...this.appState.userConfigs,
              ...data.initialState.usersConfig,
            };

            // Save locally
            saveUserConfigs(this.appState.userConfigs);
          }

          // Get scheduled users
          if (
            data.initialState.scheduledUsers &&
            data.initialState.scheduledUsers.length > 0
          ) {
            const scheduledUsers = data.initialState.scheduledUsers;

            // Update user states for scheduled users
            const scheduleInfo = data.initialState.scheduleInfo || {};
            let scheduleTimeStr = null;

            scheduledUsers.forEach((userId) => {
              if (scheduleInfo[userId]) {
                const scheduleTime = new Date(
                  scheduleInfo[userId].scheduleTime
                );
                scheduleTimeStr = scheduleTimeStr || scheduleTime;

                // Update user state
                this.usersComponent.updateUserStatus(
                  userId,
                  "scheduled",
                  `Scheduled for: ${formatDate(scheduleTime)}`
                );
              }
            });

            // Update general status if at least one user is scheduled
            if (scheduleTimeStr) {
              this.appState.isScheduled = true;
              this.appState.scheduleTime = scheduleTimeStr;
              this.actionsComponent.setStatus("scheduled", "Scheduled");

              if (this.actionsComponent.nextExecutionElement) {
                this.actionsComponent.nextExecutionElement.textContent = `Next execution: ${formatDate(
                  scheduleTimeStr
                )}`;
              }

              this.resultsComponent.addMessage(
                `🔄 Recovered schedule for ${scheduledUsers.length} users`
              );
            }

            // Re-render user list with states
            this.usersComponent.renderUserList();
          }
        }

        // Process regular message
        if (data.message) {
          this.resultsComponent.addMessage(data.message);
        }

        // Update global status
        if (data.status) {
          this.actionsComponent.setStatus(data.status.type, data.status.text);
        }

        // Update specific user status
        if (data.userId) {
          this.usersComponent.updateUserStatus(
            data.userId,
            data.status ? data.status.type : "inactive",
            data.status ? data.status.text : "Inactive"
          );
        }

        // Handle users that have been scheduled
        if (data.scheduledUsers) {
          const scheduleTime = data.scheduleTime
            ? new Date(data.scheduleTime)
            : null;

          if (scheduleTime) {
            data.scheduledUsers.forEach((userId) => {
              this.usersComponent.updateUserStatus(
                userId,
                "scheduled",
                `Scheduled for: ${formatDate(scheduleTime)}`
              );
            });

            // Re-render user list
            this.usersComponent.renderUserList();
          }
        }

        // Handle users whose schedule has been cancelled
        if (data.cancelledUsers) {
          data.cancelledUsers.forEach((userId) => {
            this.usersComponent.updateUserStatus(
              userId,
              "inactive",
              "Inactive"
            );
          });

          // Re-render user list
          this.usersComponent.renderUserList();
        }

        // Handle completion message
        if (data.complete) {
          if (!this.appState.isScheduled) {
            this.actionsComponent.setStatus("inactive", "Inactive");
          }
        }
      },

      // Error handler
      () => {
        // Retry every 5 seconds
        setTimeout(() => this.setupServerUpdates(), 5000);
      }
    );
  }
}

// Create and initialize the application
const app = new App();
app.init();
