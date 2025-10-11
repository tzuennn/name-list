/**
 * UI Components and DOM Manipulation
 * Handles rendering, pagination controls, and DOM updates
 */

class UIService {
  constructor() {
    // Cache DOM elements
    this.elements = {
      // Main elements
      list: document.getElementById('list'),
      nameInput: document.getElementById('nameInput'),
      addBtn: document.getElementById('addBtn'),
      errorEl: document.getElementById('error'),

      // Sort buttons
      sortButtons: {
        'name-asc': document.getElementById('sort-name-asc'),
        'name-desc': document.getElementById('sort-name-desc'),
        'date-newest': document.getElementById('sort-date-newest'),
        'date-oldest': document.getElementById('sort-date-oldest'),
      },

      // Pagination elements
      paginationInfo: document.getElementById('pagination-info'),
      pageNumbers: document.getElementById('page-numbers'),
      pagePrev: document.getElementById('page-prev'),
      pageNext: document.getElementById('page-next'),

      // Page size buttons
      pageSizeButtons: document.querySelectorAll('.page-size-btn'),
    };

    // Verify critical elements exist
    this._validateElements();
  }

  /**
   * Validate that critical DOM elements exist
   */
  _validateElements() {
    const critical = ['list', 'nameInput', 'addBtn', 'errorEl'];
    const missing = critical.filter((key) => !this.elements[key]);

    if (missing.length > 0) {
      console.error('UIService: Missing critical DOM elements:', missing);
      throw new Error(`Missing DOM elements: ${missing.join(', ')}`);
    }
  }

  /**
   * Render the names list
   * @param {Array} items - Array of name objects to render
   */
  renderList(items) {
    if (!this.elements.list) return;

    this.elements.list.innerHTML = '';

    if (!Array.isArray(items) || items.length === 0) {
      this.elements.list.innerHTML =
        '<li style="color: #666; font-style: italic;">No names yet</li>';
      return;
    }

    items.forEach((item, index) => {
      const li = this._createListItem(item, index + 1);
      this.elements.list.appendChild(li);
    });
  }

  /**
   * Create a single list item element
   * @param {Object} item - Name object with id, name, created_at
   * @param {number} displayIndex - 1-based display index
   * @returns {HTMLElement} - List item element
   */
  _createListItem(item, displayIndex) {
    const li = document.createElement('li');

    // Name span
    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${displayIndex}. ${item.name}`;

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.setAttribute('aria-label', `Delete ${item.name}`);
    deleteBtn.title = `Delete ${item.name}`;

    // Store item ID for delete callback
    deleteBtn.dataset.itemId = item.id;

    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);

    return li;
  }

  /**
   * Update sort button states
   * @param {string} activeSortMode - Currently active sort mode
   */
  updateSortButtons(activeSortMode) {
    Object.keys(this.elements.sortButtons).forEach((mode) => {
      const button = this.elements.sortButtons[mode];
      if (!button) return;

      const isActive = mode === activeSortMode;
      button.setAttribute('aria-pressed', isActive.toString());

      // Update aria-label to include current state
      const baseLabel = button.getAttribute('aria-label').replace(/, currently active/g, '');
      const newLabel = isActive ? `${baseLabel}, currently active` : baseLabel;
      button.setAttribute('aria-label', newLabel);
    });
  }

  /**
   * Update pagination controls
   * @param {Object} pageInfo - Pagination information object
   */
  updatePaginationControls(pageInfo) {
    this._updatePrevNextButtons(pageInfo);
    this._generatePageNumbers(pageInfo);
    this._updatePaginationInfo(pageInfo);
  }

  /**
   * Update previous/next pagination buttons
   * @param {Object} pageInfo - Pagination information
   */
  _updatePrevNextButtons(pageInfo) {
    if (this.elements.pagePrev) {
      this.elements.pagePrev.disabled = !pageInfo.hasPrev;
      this.elements.pagePrev.setAttribute(
        'aria-label',
        pageInfo.hasPrev ? 'Go to previous page' : 'No previous page available'
      );
    }

    if (this.elements.pageNext) {
      this.elements.pageNext.disabled = !pageInfo.hasNext;
      this.elements.pageNext.setAttribute(
        'aria-label',
        pageInfo.hasNext ? 'Go to next page' : 'No next page available'
      );
    }
  }

  /**
   * Generate page number buttons
   * @param {Object} pageInfo - Pagination information
   */
  _generatePageNumbers(pageInfo) {
    if (!this.elements.pageNumbers) return;

    this.elements.pageNumbers.innerHTML = '';

    const { currentPage, totalPages } = pageInfo;

    // Calculate which page numbers to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // Adjust range to always show 5 pages when possible
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - 4);
      }
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      this._addPageButton(1, 1 === currentPage);
      if (startPage > 2) {
        this._addEllipsis();
      }
    }

    // Add page number buttons
    for (let i = startPage; i <= endPage; i++) {
      this._addPageButton(i, i === currentPage);
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        this._addEllipsis();
      }
      this._addPageButton(totalPages, totalPages === currentPage);
    }
  }

  /**
   * Add a page number button
   * @param {number} pageNum - Page number
   * @param {boolean} isCurrent - Whether this is the current page
   */
  _addPageButton(pageNum, isCurrent) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pagination-btn';
    button.textContent = pageNum;
    button.dataset.page = pageNum;

    if (isCurrent) {
      button.setAttribute('aria-current', 'page');
      button.setAttribute('aria-label', `Page ${pageNum}, current page`);
    } else {
      button.setAttribute('aria-label', `Go to page ${pageNum}`);
    }

    this.elements.pageNumbers.appendChild(button);
  }

  /**
   * Add ellipsis to page numbers
   */
  _addEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.textContent = '...';
    ellipsis.className = 'pagination-ellipsis';
    ellipsis.style.padding = '0.5rem';
    ellipsis.style.color = '#666';
    this.elements.pageNumbers.appendChild(ellipsis);
  }

  /**
   * Update pagination information text
   * @param {Object} pageInfo - Pagination information
   */
  _updatePaginationInfo(pageInfo) {
    if (!this.elements.paginationInfo) return;

    if (pageInfo.totalItems === 0) {
      this.elements.paginationInfo.textContent = 'No items to display';
      return;
    }

    const start = pageInfo.startIndex + 1;
    const end = pageInfo.endIndex;
    this.elements.paginationInfo.textContent = `Showing ${start}-${end} of ${pageInfo.totalItems} items`;
  }

  /**
   * Update page size button states
   * @param {number} activePageSize - Currently active page size
   */
  updatePageSizeButtons(activePageSize) {
    this.elements.pageSizeButtons.forEach((btn) => {
      const size = parseInt(btn.getAttribute('data-size'));
      if (size === activePageSize) {
        btn.classList.add('active');
        btn.setAttribute('aria-label', `Show ${size} items per page, currently active`);
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-label', `Show ${size} items per page`);
      }
    });
  }

  /**
   * Display error message
   * @param {string|null} message - Error message to display
   */
  showError(message) {
    if (!this.elements.errorEl) return;
    this.elements.errorEl.textContent = message || '';
  }

  /**
   * Clear error message
   */
  clearError() {
    this.showError('');
  }

  /**
   * Get the current input value
   * @returns {string} - Trimmed input value
   */
  getInputValue() {
    return this.elements.nameInput ? this.elements.nameInput.value.trim() : '';
  }

  /**
   * Clear the input field
   */
  clearInput() {
    if (this.elements.nameInput) {
      this.elements.nameInput.value = '';
    }
  }

  /**
   * Focus the input field
   */
  focusInput() {
    if (this.elements.nameInput) {
      this.elements.nameInput.focus();
    }
  }

  /**
   * Set up event listeners for UI interactions
   * @param {Object} callbacks - Object containing callback functions
   */
  setupEventListeners(callbacks) {
    // Add button click
    if (this.elements.addBtn && callbacks.onAdd) {
      this.elements.addBtn.addEventListener('click', callbacks.onAdd);
    }

    // Input enter key
    if (this.elements.nameInput && callbacks.onAdd) {
      this.elements.nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          callbacks.onAdd();
        }
      });
    }

    // Sort button clicks
    Object.keys(this.elements.sortButtons).forEach((mode) => {
      const button = this.elements.sortButtons[mode];
      if (button && callbacks.onSort) {
        button.addEventListener('click', () => callbacks.onSort(mode));

        // Keyboard support for Enter and Space
        button.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            callbacks.onSort(mode);
          }
        });
      }
    });

    // Pagination button clicks
    if (this.elements.pagePrev && callbacks.onPageChange) {
      this.elements.pagePrev.addEventListener('click', () => callbacks.onPageChange('prev'));
    }

    if (this.elements.pageNext && callbacks.onPageChange) {
      this.elements.pageNext.addEventListener('click', () => callbacks.onPageChange('next'));
    }

    // Page number clicks (delegated)
    if (this.elements.pageNumbers && callbacks.onPageChange) {
      this.elements.pageNumbers.addEventListener('click', (e) => {
        if (e.target.dataset.page) {
          const pageNum = parseInt(e.target.dataset.page);
          callbacks.onPageChange(pageNum);
        }
      });
    }

    // Page size button clicks
    this.elements.pageSizeButtons.forEach((btn) => {
      if (callbacks.onPageSizeChange) {
        btn.addEventListener('click', () => {
          const newSize = parseInt(btn.getAttribute('data-size'));
          if (newSize) {
            callbacks.onPageSizeChange(newSize);
          }
        });
      }
    });

    // Delete button clicks (delegated)
    if (this.elements.list && callbacks.onDelete) {
      this.elements.list.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) {
          const deleteBtn = e.target.closest('.delete-btn');
          const itemId = deleteBtn.dataset.itemId;
          if (itemId) {
            callbacks.onDelete(itemId);
          }
        }
      });
    }

    // Keyboard navigation for pagination
    if (callbacks.onPageChange) {
      document.addEventListener('keydown', (e) => {
        // Only handle if focus is not in an input field
        if (document.activeElement.tagName === 'INPUT') return;

        if (e.key === 'ArrowLeft' && e.ctrlKey) {
          e.preventDefault();
          callbacks.onPageChange('prev');
        } else if (e.key === 'ArrowRight' && e.ctrlKey) {
          e.preventDefault();
          callbacks.onPageChange('next');
        }
      });
    }
  }
}

// Export as singleton instance
const uiService = new UIService();
