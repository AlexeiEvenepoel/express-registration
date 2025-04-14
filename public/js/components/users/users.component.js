/**
 * Users Component
 * Manages the user list, selection, and custom user creation
 */
import {
  saveSelectedUsers,
  loadSelectedUsers,
  removeCustomUser,
  addCustomUser,
  loadCustomUsers,
  profilesList,
} from "../../utils/profiles.js";

export class UsersComponent {
  constructor() {
    this.userListContainer = null;
    this.selectedUsers = [];
    this.userStates = {};
    this.userCountElement = null;
    this.selectAllBtn = null;
    this.addUserBtn = null;
    this.addUserModal = null;
    this.customUserForm = null;
    this.onUserSelectionChange = null; // Callback para notificar cambios en la selección
  }

  /**
   * Initialize the component
   */
  init() {
    // Get DOM references
    this.userListContainer = document.getElementById("userList");
    this.userCountElement = document.getElementById("user-count");
    this.selectAllBtn = document.getElementById("selectAllBtn");
    this.addUserBtn = document.getElementById("addUserBtn");
    this.customUserForm = document.getElementById("customUserForm");
    this.addUserModal = document.getElementById("addUserModal");

    // Load saved selections
    this.selectedUsers = loadSelectedUsers();

    // Set up event handlers
    this.setupEventHandlers();

    // Render initial user list
    this.renderUserList();
  }

  /**
   * Set up event handlers for user interaction
   */
  setupEventHandlers() {
    // Set up select all button
    if (this.selectAllBtn) {
      this.selectAllBtn.addEventListener("click", () => this.toggleSelectAll());
    }

    // Set up custom user form
    if (this.customUserForm) {
      this.customUserForm.addEventListener("submit", (event) =>
        this.handleAddCustomUser(event)
      );
    }

    // Reset form when modal is closed
    if (this.addUserModal) {
      this.addUserModal.addEventListener("hidden.bs.modal", () => {
        this.resetCustomUserForm();
      });
    }
  }

  /**
   * Handle user selection event
   * @param {string} userId - ID of the selected user
   * @param {boolean} isSelected - Whether the user is now selected
   */
  handleUserSelect(userId, isSelected) {
    if (isSelected && !this.selectedUsers.includes(userId)) {
      this.selectedUsers.push(userId);
    } else if (!isSelected) {
      this.selectedUsers = this.selectedUsers.filter((id) => id !== userId);
    }

    // Save selection to localStorage
    saveSelectedUsers(this.selectedUsers);

    // Update UI
    this.updateSelectAllButton();
    this.updateUserCount(true);

    // Notify selection change
    if (this.onUserSelectionChange) {
      this.onUserSelectionChange(this.selectedUsers);
    }
  }

  /**
   * Update the select all button text based on current selections
   */
  updateSelectAllButton() {
    if (!this.selectAllBtn) return;

    const checkboxes = this.userListContainer.querySelectorAll(
      'input[type="checkbox"]'
    );
    const allSelected =
      Array.from(checkboxes).length > 0 &&
      Array.from(checkboxes).every((cb) => cb.checked);

    this.selectAllBtn.textContent = allSelected ? "Deselect All" : "Select All";
  }

  /**
   * Update the user count with optional animation
   * @param {boolean} animate - Whether to animate the count change
   */
  updateUserCount(animate = false) {
    if (!this.userCountElement) return;

    const currentCount = parseInt(this.userCountElement.textContent, 10);
    const newCount = this.selectedUsers.length;

    if (animate && currentCount !== newCount) {
      // Animate the number change
      this.userCountElement.style.transform = "scale(1.2)";
      this.userCountElement.style.color = "var(--primary)";

      setTimeout(() => {
        this.userCountElement.textContent = newCount;

        setTimeout(() => {
          this.userCountElement.style.transform = "scale(1)";
          if (newCount === 0) {
            this.userCountElement.style.color = "var(--gray-600)";
          }
        }, 50);
      }, 150);
    } else {
      this.userCountElement.textContent = newCount;
    }
  }

  /**
   * Toggle select all/none functionality
   */
  toggleSelectAll() {
    const checkboxes = this.userListContainer.querySelectorAll(
      'input[type="checkbox"]'
    );
    const anyUnchecked = Array.from(checkboxes).some((cb) => !cb.checked);

    checkboxes.forEach((cb) => {
      cb.checked = anyUnchecked;
      const userId = cb.id.replace("checkbox-", "");
      this.handleUserSelect(userId, anyUnchecked);

      // Update UI for each user item
      const userItem = document.getElementById(`user-${userId}`);
      if (userItem) {
        if (anyUnchecked) {
          userItem.classList.add("selected");
        } else {
          userItem.classList.remove("selected");
        }
      }
    });
  }

  /**
   * Handle adding a custom user
   * @param {Event} event - Form submission event
   */
  async handleAddCustomUser(event) {
    event.preventDefault();

    const userData = {
      name: document.getElementById("customUserName").value,
      dni: document.getElementById("customUserDni").value,
      codigo: document.getElementById("customUserCode").value,
    };

    try {
      const userId = addCustomUser(userData);

      // Update UI
      this.renderUserList();

      // Close modal
      const modal = bootstrap.Modal.getInstance(this.addUserModal);
      if (modal) {
        modal.hide();
      }

      return userId;
    } catch (error) {
      this.showCustomUserError(error.message);
    }
  }

  /**
   * Show error message in the custom user form
   * @param {string} message - Error message to display
   */
  showCustomUserError(message) {
    // Remove any existing error message
    const existingError = this.customUserForm.querySelector(".alert");
    if (existingError) {
      existingError.remove();
    }

    // Create error message
    const errorFeedback = document.createElement("div");
    errorFeedback.className = "alert alert-danger mt-3";
    errorFeedback.textContent = message;

    this.customUserForm.appendChild(errorFeedback);
  }

  /**
   * Reset the custom user form
   */
  resetCustomUserForm() {
    if (this.customUserForm) {
      this.customUserForm.reset();
      const existingError = this.customUserForm.querySelector(".alert");
      if (existingError) {
        existingError.remove();
      }
    }
  }

  /**
   * Renders the user list with current state
   */
  renderUserList() {
    if (!this.userListContainer) return;

    // Update user count with animation
    this.updateUserCount(true);

    // Clear the container
    this.userListContainer.innerHTML = "";

    // Get all profiles including custom ones
    const customUsers = loadCustomUsers();
    const allProfiles = [
      ...profilesList.filter((p) => p.userId !== "custom"),
      ...Object.values(customUsers),
    ];

    // Create elements for each user
    allProfiles.forEach((profile, index) => {
      const userDiv = document.createElement("div");
      userDiv.className = `user-item group relative p-2.5 rounded-lg border-l-4 border-transparent hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ${
        profile.userId.startsWith("custom_") ? "custom-user" : ""
      }`;

      // Add selected class if user is selected
      if (this.selectedUsers.includes(profile.userId)) {
        userDiv.classList.add("border-primary", "bg-primary/5");
      }

      userDiv.id = `user-${profile.userId}`;

      // Add animation delay based on index
      userDiv.style.animationDelay = `${index * 50}ms`;
      userDiv.classList.add("new-user-animation");

      // Create user item content
      userDiv.innerHTML = `
        <div class="absolute top-2.5 right-2.5 flex items-center gap-2">
          ${
            profile.userId.startsWith("custom_")
              ? `
            <button class="delete-user-btn opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white">
              <i class="fas fa-times text-xs"></i>
            </button>
          `
              : ""
          }
          <input type="checkbox" id="checkbox-${profile.userId}" 
                 class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                 ${
                   this.selectedUsers.includes(profile.userId) ? "checked" : ""
                 }>
        </div>
        
        <label for="checkbox-${profile.userId}" class="block cursor-pointer">
          <div class="pr-16">
            <h4 class="font-medium text-base text-gray-800 mb-1.5">${
              profile.name
            }</h4>
            <div class="flex gap-2 mb-1.5">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs">
                <i class="fas fa-id-card text-gray-500 text-xs"></i>
                ${profile.dni}
              </span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs">
                <i class="fas fa-key text-gray-500 text-xs"></i>
                ${profile.codigo}
              </span>
            </div>
          </div>
        </label>
        
        <div class="status-indicator mt-1 py-1 px-3 rounded-full text-xs font-medium text-center transition-all duration-200">
          ${this.userStates[profile.userId]?.text || "Inactive"}
        </div>
      `;

      // Add event listeners
      const checkbox = userDiv.querySelector(`#checkbox-${profile.userId}`);
      if (checkbox) {
        checkbox.addEventListener("change", () => {
          this.handleUserSelect(profile.userId, checkbox.checked);

          // Update item styling with smooth transition
          if (checkbox.checked) {
            userDiv.classList.add("border-primary", "bg-primary/5");
          } else {
            userDiv.classList.remove("border-primary", "bg-primary/5");
          }
        });
      }

      // Add delete button handler for custom users
      if (profile.userId.startsWith("custom_")) {
        const deleteBtn = userDiv.querySelector(".delete-user-btn");
        if (deleteBtn) {
          deleteBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (await this.handleDeleteUser(profile.userId)) {
              userDiv.style.height = userDiv.offsetHeight + "px";
              userDiv.style.marginTop = "0";
              userDiv.style.marginBottom = "0";

              // Start remove animation
              requestAnimationFrame(() => {
                userDiv.style.opacity = "0";
                userDiv.style.height = "0";
                userDiv.style.marginTop = "-8px";
                userDiv.style.marginBottom = "0";
                userDiv.style.padding = "0";

                setTimeout(() => {
                  userDiv.remove();
                  // Update counter if was selected
                  if (this.selectedUsers.includes(profile.userId)) {
                    this.handleUserSelect(profile.userId, false);
                  }
                }, 300);
              });
            }
          };
        }
      }

      // Add to container
      this.userListContainer.appendChild(userDiv);
    });

    // Update select all button text and state
    this.updateSelectAllButton();
  }

  /**
   * Handle user deletion with confirmation
   * @param {string} userId - ID of the user to delete
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  async handleDeleteUser(userId) {
    // Show confirmation dialog
    const confirmed = await new Promise((resolve) => {
      const modal = window.confirm(
        "Are you sure you want to delete this user?"
      );
      resolve(modal);
    });

    if (!confirmed) return false;

    try {
      const success = removeCustomUser(userId);
      return success;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  /**
   * Update status of a specific user with animation
   * @param {string} userId - ID of the user
   * @param {string} type - Status type (active, scheduled, error, inactive)
   * @param {string} text - Status text to display
   */
  updateUserStatus(userId, type, text) {
    this.userStates[userId] = { type, text };

    const statusElement = document.querySelector(
      `#user-${userId} .status-indicator`
    );
    if (statusElement) {
      statusElement.classList.add("status-change");

      setTimeout(() => {
        statusElement.innerHTML = `
          <i class="fas ${this.getStatusIcon(type)} text-[8px] opacity-75"></i>
          <span>${text}</span>
        `;

        statusElement.className =
          "status-indicator mt-1 py-0.5 px-2 rounded-full text-[10px] font-medium flex items-center justify-center gap-1 transition-all duration-200";

        if (type === "active") {
          statusElement.classList.add("bg-green-100", "text-green-700");
        } else if (type === "scheduled") {
          statusElement.classList.add("bg-blue-100", "text-blue-700");
        } else if (type === "error") {
          statusElement.classList.add("bg-red-100", "text-red-700");
        } else {
          statusElement.classList.add("bg-gray-100", "text-gray-600");
        }
      }, 150);

      setTimeout(() => {
        statusElement.classList.remove("status-change");
      }, 300);
    }
  }

  /**
   * Get the appropriate icon for each status type
   * @param {string} type - Status type
   * @returns {string} - Font Awesome icon class
   */
  getStatusIcon(type) {
    switch (type) {
      case "active":
        return "fa-circle-play";
      case "scheduled":
        return "fa-calendar-check";
      case "error":
        return "fa-circle-exclamation";
      default:
        return "fa-circle";
    }
  }
}
