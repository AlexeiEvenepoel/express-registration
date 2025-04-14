/**
 * Component Loader
 * Dynamically loads HTML templates for components
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Component template paths with their container IDs
  const components = [
    {
      path: "js/components/header/header.component.html",
      containerId: "headerContainer",
    },
    {
      path: "js/components/users/users.component.html",
      containerId: "usersContainer",
    },
    {
      path: "js/components/config/config.component.html",
      containerId: "configContainer",
    },
    {
      path: "js/components/actions/actions.component.html",
      containerId: "actionsContainer",
    },
    {
      path: "js/components/results/results.component.html",
      containerId: "resultsContainer",
    },
  ];

  // Load each component template
  await Promise.all(
    components.map(async (component) => {
      try {
        // Fetch the HTML template
        const response = await fetch(component.path);
        if (!response.ok) {
          throw new Error(`Failed to load component: ${component.path}`);
        }

        // Get the HTML content
        const html = await response.text();

        // Insert into container
        const container = document.getElementById(component.containerId);
        if (container) {
          container.innerHTML = html;
        } else {
          console.error(
            `Container element not found: ${component.containerId}`
          );
        }
      } catch (error) {
        console.error(`Error loading component ${component.path}:`, error);
      }
    })
  );

  // Dispatch event when all components are loaded
  document.dispatchEvent(new CustomEvent("componentsLoaded"));
});
