/**
 * Main Application Controller
 * Coordinates between services and handles application lifecycle
 */

class NameListApp {
  constructor() {
    this.isInitialized = false;
    this.isDestroyed = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.isInitialized) {
      console.warn('App already initialized');
      return;
    }

    try {
      console.log('Initializing Names List Application...');

      // Setup accessibility features
      accessibilityService.setupFocusManagement();
      accessibilityService.setupSkipLinks();

      // Setup state change listeners
      this._setupStateListeners();

      // Setup UI event handlers
      this._setupUIEventHandlers();

      // Load initial data
      await this.loadData();

      this.isInitialized = true;
      console.log('Application initialized successfully');

      // Announce initial state to screen readers
      setTimeout(() => {
        accessibilityService.announceCurrentState();
      }, 500);
    } catch (error) {
      console.error('Failed to initialize application:', error);
      appState.setError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Setup listeners for application state changes
   */
  _setupStateListeners() {
    // Data changes - re-render the list
    appState.on('dataChange', (data) => {
      const pageData = appState.currentPageData;
      uiService.renderList(pageData);
      uiService.updatePaginationControls(appState.paginationInfo);

      // Announce data changes
      if (data.data.length === 0) {
        accessibilityService.announceDataChange('loaded', { count: 0 });
      }
    });

    // Sort changes - update UI and re-render
    appState.on('sortChange', (data) => {
      uiService.updateSortButtons(data.sortMode);
      const pageData = appState.currentPageData;
      uiService.renderList(pageData);
      uiService.updatePaginationControls(appState.paginationInfo);

      // Announce sort change
      accessibilityService.announceSortChange(data.sortMode);
    });

    // Page changes - re-render current page
    appState.on('pageChange', (data) => {
      const pageData = appState.currentPageData;
      uiService.renderList(pageData);
      uiService.updatePaginationControls(appState.paginationInfo);

      if (data.pageSizeChanged) {
        uiService.updatePageSizeButtons(data.pageSize);
      }

      // Announce page change
      accessibilityService.announcePageChange({
        currentPage: data.currentPage,
        totalPages: Math.ceil(data.totalItems / data.pageSize),
        pageSize: data.pageSize,
        pageSizeChanged: data.pageSizeChanged,
      });
    });

    // Error changes - show/hide error messages
    appState.on('errorChange', (data) => {
      uiService.showError(data.error);

      if (data.error) {
        accessibilityService.announceDataChange('error', { error: data.error });
      }
    });

    // Loading changes - could show/hide loading indicator
    appState.on('loadingChange', (data) => {
      // Future: show loading spinner
      accessibilityService.announceLoading(data.isLoading);
    });
  }

  /**
   * Setup UI event handlers
   */
  _setupUIEventHandlers() {
    uiService.setupEventListeners({
      onAdd: () => this.handleAddName(),
      onSort: (mode) => this.handleSortChange(mode),
      onPageChange: (direction) => this.handlePageChange(direction),
      onPageSizeChange: (size) => this.handlePageSizeChange(size),
      onDelete: (id) => this.handleDeleteName(id),
    });
  }

  /**
   * Load data from the API
   */
  async loadData() {
    appState.setLoading(true);
    appState.clearError();

    try {
      const data = await apiService.fetchNames();
      appState.setData(data);

      // Announce successful load
      accessibilityService.announceDataChange('loaded', { count: data.length });
    } catch (error) {
      console.error('Failed to load data:', error);
      appState.setError(error.message);
    } finally {
      appState.setLoading(false);
    }
  }

  /**
   * Handle adding a new name
   */
  async handleAddName() {
    const name = uiService.getInputValue();

    if (!name) {
      const error = 'Name cannot be empty.';
      appState.setError(error);
      accessibilityService.announceValidationError('Name input', error);
      uiService.focusInput();
      return;
    }

    appState.setLoading(true);
    appState.clearError();

    try {
      await apiService.addName(name);
      uiService.clearInput();

      // Reload data to get the updated list
      await this.loadData();

      // Announce success
      accessibilityService.announceDataChange('added', { name });
    } catch (error) {
      console.error('Failed to add name:', error);
      appState.setError(error.message);
      uiService.focusInput();
    } finally {
      appState.setLoading(false);
    }
  }

  /**
   * Handle deleting a name
   * @param {string} id - ID of the name to delete
   */
  async handleDeleteName(id) {
    appState.setLoading(true);
    appState.clearError();

    try {
      await apiService.deleteName(id);

      // Reload data to get the updated list
      await this.loadData();

      // Announce success
      accessibilityService.announceDataChange('deleted');
    } catch (error) {
      console.error('Failed to delete name:', error);
      appState.setError(error.message);
    } finally {
      appState.setLoading(false);
    }
  }

  /**
   * Handle sort mode changes
   * @param {string} mode - New sort mode
   */
  handleSortChange(mode) {
    appState.setSortMode(mode);
  }

  /**
   * Handle page navigation
   * @param {string|number} direction - 'prev', 'next', or page number
   */
  handlePageChange(direction) {
    const currentPage = appState.currentPage;
    const pageInfo = appState.paginationInfo;

    let newPage;

    if (direction === 'prev') {
      newPage = Math.max(1, currentPage - 1);
    } else if (direction === 'next') {
      newPage = Math.min(pageInfo.totalPages, currentPage + 1);
    } else if (typeof direction === 'number') {
      newPage = direction;
    } else {
      console.warn('Invalid page change direction:', direction);
      return;
    }

    appState.setCurrentPage(newPage);
  }

  /**
   * Handle page size changes
   * @param {number} size - New page size
   */
  handlePageSizeChange(size) {
    appState.setPageSize(size);
  }

  /**
   * Handle browser back/forward navigation
   */
  _setupHistoryHandling() {
    // Future enhancement: manage browser history for pagination/sorting
    window.addEventListener('popstate', (event) => {
      // Handle browser back/forward
      console.log('History navigation:', event.state);
    });
  }

  /**
   * Cleanup when the app is destroyed
   */
  destroy() {
    if (this.isDestroyed) return;

    // Clear all state listeners
    appState.reset();

    // Clear all announcements
    accessibilityService.clearAnnouncements();

    this.isDestroyed = true;
    console.log('Application destroyed');
  }

  /**
   * Get current application state for debugging
   */
  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      isDestroyed: this.isDestroyed,
      state: appState.getState(),
      uiElements: Object.keys(uiService.elements).filter((key) => uiService.elements[key] !== null),
    };
  }
}

// Initialize the application when DOM is ready
let app = null;

function initializeApp() {
  if (app) {
    console.warn('App already exists');
    return;
  }

  app = new NameListApp();
  app.init().catch((error) => {
    console.error('Critical application error:', error);

    // Show fallback error message
    const errorEl = document.getElementById('error');
    if (errorEl) {
      errorEl.textContent = 'Application failed to start. Please refresh the page.';
    }
  });
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (app && !app.isDestroyed) {
    appState.setError('An unexpected error occurred. Please refresh the page.');
  }
});

// Export for debugging
window.debugApp = () => (app ? app.getDebugInfo() : 'App not initialized');
