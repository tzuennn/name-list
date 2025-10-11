/**
 * Accessibility Service
 * Handles screen reader announcements and accessibility features
 */

class AccessibilityService {
  constructor() {
    // Cache announcement elements
    this.elements = {
      live: document.getElementById('live'),
      sortStatus: document.getElementById('sort-status'),
      pageStatus: document.getElementById('page-status'),
    };

    // Validate elements exist
    this._validateElements();
  }

  /**
   * Validate that announcement elements exist
   */
  _validateElements() {
    const missing = Object.keys(this.elements).filter((key) => !this.elements[key]);

    if (missing.length > 0) {
      console.warn('AccessibilityService: Missing announcement elements:', missing);
      // Don't throw error - accessibility should degrade gracefully
    }
  }

  /**
   * Make a general announcement to screen readers
   * @param {string} message - Message to announce
   */
  announce(message) {
    if (!this.elements.live || !message) return;

    this.elements.live.textContent = message;

    // Clear after a delay to allow for re-announcements of the same message
    setTimeout(() => {
      if (this.elements.live) {
        this.elements.live.textContent = '';
      }
    }, 1000);
  }

  /**
   * Announce sorting changes
   * @param {string} sortMode - New sort mode
   */
  announceSortChange(sortMode) {
    if (!this.elements.sortStatus) return;

    const message = SortingService.getModeName(sortMode);
    this.elements.sortStatus.textContent = message;

    // Also make a general announcement for immediate feedback
    this.announce(message);
  }

  /**
   * Announce pagination changes
   * @param {Object} info - Pagination change information
   */
  announcePageChange(info) {
    if (!this.elements.pageStatus) return;

    let message = '';

    if (info.pageSizeChanged) {
      message = `Page size changed to ${info.pageSize} items per page. Now on page 1 of ${Math.ceil(
        info.totalItems / info.pageSize
      )}.`;
    } else if (info.currentPage && info.totalPages) {
      message = `Page ${info.currentPage} of ${info.totalPages}`;
    } else if (info.message) {
      message = info.message;
    }

    if (message) {
      this.elements.pageStatus.textContent = message;
      this.announce(message);
    }
  }

  /**
   * Announce data changes (additions, deletions)
   * @param {string} action - Action performed ('added', 'deleted', 'loaded')
   * @param {Object} details - Additional details about the action
   */
  announceDataChange(action, details = {}) {
    let message = '';

    switch (action) {
      case 'added':
        message = details.name ? `${details.name} added to the list` : 'Name added to the list';
        break;
      case 'deleted':
        message = details.name
          ? `${details.name} deleted from the list`
          : 'Name deleted from the list';
        break;
      case 'loaded':
        const count = details.count || 0;
        message =
          count === 0 ? 'No names found' : count === 1 ? '1 name loaded' : `${count} names loaded`;
        break;
      case 'error':
        message = details.error || 'An error occurred';
        break;
      default:
        message = details.message || '';
    }

    if (message) {
      this.announce(message);
    }
  }

  /**
   * Announce loading states
   * @param {boolean} isLoading - Whether the app is currently loading
   * @param {string} action - What is being loaded (optional)
   */
  announceLoading(isLoading, action = '') {
    if (isLoading) {
      const message = action ? `Loading ${action}...` : 'Loading...';
      this.announce(message);
    } else {
      // Loading completed - will be announced by the specific action
    }
  }

  /**
   * Announce form validation errors
   * @param {string} field - Field name that has an error
   * @param {string} error - Error message
   */
  announceValidationError(field, error) {
    const message = `${field}: ${error}`;
    this.announce(message);
  }

  /**
   * Clear all announcement areas
   */
  clearAnnouncements() {
    Object.values(this.elements).forEach((element) => {
      if (element) {
        element.textContent = '';
      }
    });
  }

  /**
   * Enhance focus management for keyboard users
   */
  setupFocusManagement() {
    // Add focus indicators for custom elements
    document.addEventListener('focusin', (e) => {
      const target = e.target;

      // Add enhanced focus styles for buttons with aria-pressed
      if (target.hasAttribute('aria-pressed')) {
        target.style.outline = '2px solid #007acc';
        target.style.outlineOffset = '2px';
      }
    });

    document.addEventListener('focusout', (e) => {
      const target = e.target;

      // Remove enhanced focus styles
      if (target.hasAttribute('aria-pressed')) {
        target.style.outline = '';
        target.style.outlineOffset = '';
      }
    });
  }

  /**
   * Set up skip links for keyboard navigation
   */
  setupSkipLinks() {
    // Skip to main content
    const skipLink = document.createElement('a');
    skipLink.href = '#list';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only';
    skipLink.style.position = 'absolute';
    skipLink.style.left = '-9999px';

    skipLink.addEventListener('focus', () => {
      skipLink.style.left = '0';
      skipLink.style.top = '0';
      skipLink.style.background = '#000';
      skipLink.style.color = '#fff';
      skipLink.style.padding = '0.5rem';
      skipLink.style.zIndex = '1000';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.left = '-9999px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Announce the current application state for screen readers
   */
  announceCurrentState() {
    const pageInfo = appState.paginationInfo;
    const sortMode = appState.sortMode;
    const dataCount = appState.totalItems;

    const messages = [
      `Names application loaded`,
      `${dataCount} names total`,
      SortingService.getModeName(sortMode),
      `Showing page ${pageInfo.currentPage} of ${pageInfo.totalPages}`,
    ];

    // Announce each message with a delay
    messages.forEach((message, index) => {
      setTimeout(() => this.announce(message), index * 1500);
    });
  }
}

// Export as singleton instance
const accessibilityService = new AccessibilityService();
