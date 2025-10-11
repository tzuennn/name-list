/**
 * Application State Management
 * Centralized state with change notifications
 */

class AppState {
  constructor() {
    // Core data
    this._data = [];
    this._sortMode = SortingService.getDefaultMode();

    // Pagination state
    this._currentPage = 1;
    this._pageSize = 10;
    this._totalItems = 0;

    // Error state
    this._error = null;

    // Loading state
    this._isLoading = false;

    // Event listeners for state changes
    this._listeners = {
      dataChange: [],
      sortChange: [],
      pageChange: [],
      errorChange: [],
      loadingChange: [],
    };
  }

  /**
   * Register a listener for state changes
   * @param {string} event - Event type (dataChange, sortChange, pageChange, errorChange, loadingChange)
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this._listeners[event]) {
      this._listeners[event].push(callback);
    }
  }

  /**
   * Remove a listener
   * @param {string} event - Event type
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter((cb) => cb !== callback);
    }
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event type
   * @param {*} data - Data to pass to listeners
   */
  _emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Data getters and setters
  get data() {
    return [...this._data]; // Return a copy to prevent mutation
  }

  setData(newData) {
    if (!Array.isArray(newData)) {
      console.warn('AppState.setData: expected array, got:', typeof newData);
      return;
    }

    this._data = [...newData];
    this._totalItems = newData.length;

    // Reset to first page when data changes
    const oldPage = this._currentPage;
    this._currentPage = 1;

    this._emit('dataChange', {
      data: this.data,
      totalItems: this._totalItems,
      pageChanged: oldPage !== 1,
    });
  }

  get totalItems() {
    return this._totalItems;
  }

  // Sort mode getters and setters
  get sortMode() {
    return this._sortMode;
  }

  setSortMode(newMode) {
    if (!SortingService.isValidMode(newMode)) {
      console.warn('AppState.setSortMode: invalid sort mode:', newMode);
      return;
    }

    if (this._sortMode === newMode) {
      return; // No change
    }

    const oldMode = this._sortMode;
    this._sortMode = newMode;

    // Reset to first page when sort changes
    const oldPage = this._currentPage;
    this._currentPage = 1;

    this._emit('sortChange', {
      sortMode: newMode,
      oldSortMode: oldMode,
      pageChanged: oldPage !== 1,
    });
  }

  // Pagination getters and setters
  get currentPage() {
    return this._currentPage;
  }

  get pageSize() {
    return this._pageSize;
  }

  setCurrentPage(newPage) {
    const maxPage = Math.max(1, Math.ceil(this._totalItems / this._pageSize));
    const safePage = Math.max(1, Math.min(newPage, maxPage));

    if (this._currentPage === safePage) {
      return; // No change
    }

    const oldPage = this._currentPage;
    this._currentPage = safePage;

    this._emit('pageChange', {
      currentPage: safePage,
      oldPage: oldPage,
      pageSize: this._pageSize,
      totalItems: this._totalItems,
    });
  }

  setPageSize(newSize) {
    const validSizes = [10, 25, 50, 100];
    if (!validSizes.includes(newSize)) {
      console.warn('AppState.setPageSize: invalid page size:', newSize);
      return;
    }

    if (this._pageSize === newSize) {
      return; // No change
    }

    const oldSize = this._pageSize;
    const oldPage = this._currentPage;

    this._pageSize = newSize;
    this._currentPage = 1; // Reset to first page

    this._emit('pageChange', {
      currentPage: 1,
      oldPage: oldPage,
      pageSize: newSize,
      oldPageSize: oldSize,
      totalItems: this._totalItems,
      pageSizeChanged: true,
    });
  }

  // Error state
  get error() {
    return this._error;
  }

  setError(errorMessage) {
    const oldError = this._error;
    this._error = errorMessage || null;

    if (oldError !== this._error) {
      this._emit('errorChange', {
        error: this._error,
        oldError: oldError,
      });
    }
  }

  clearError() {
    this.setError(null);
  }

  // Loading state
  get isLoading() {
    return this._isLoading;
  }

  setLoading(loading) {
    const oldLoading = this._isLoading;
    this._isLoading = !!loading;

    if (oldLoading !== this._isLoading) {
      this._emit('loadingChange', {
        isLoading: this._isLoading,
        wasLoading: oldLoading,
      });
    }
  }

  // Computed properties
  get sortedData() {
    return SortingService.sortNames(this._data, this._sortMode);
  }

  get paginationInfo() {
    const totalPages = Math.max(1, Math.ceil(this._totalItems / this._pageSize));
    const safePage = Math.max(1, Math.min(this._currentPage, totalPages));
    const startIndex = (safePage - 1) * this._pageSize;
    const endIndex = Math.min(startIndex + this._pageSize, this._totalItems);

    return {
      totalPages,
      currentPage: safePage,
      pageSize: this._pageSize,
      startIndex,
      endIndex,
      totalItems: this._totalItems,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    };
  }

  get currentPageData() {
    const sortedData = this.sortedData;
    const pageInfo = this.paginationInfo;

    if (!Array.isArray(sortedData)) return [];
    return sortedData.slice(pageInfo.startIndex, pageInfo.endIndex);
  }

  // Utility methods
  reset() {
    this._data = [];
    this._sortMode = SortingService.getDefaultMode();
    this._currentPage = 1;
    this._pageSize = 10;
    this._totalItems = 0;
    this._error = null;
    this._isLoading = false;

    // Emit reset notifications
    this._emit('dataChange', { data: [], totalItems: 0 });
    this._emit('errorChange', { error: null });
    this._emit('loadingChange', { isLoading: false });
  }

  // Debug helper
  getState() {
    return {
      data: this._data.length + ' items',
      sortMode: this._sortMode,
      currentPage: this._currentPage,
      pageSize: this._pageSize,
      totalItems: this._totalItems,
      error: this._error,
      isLoading: this._isLoading,
    };
  }
}

// Export as singleton instance
const appState = new AppState();
