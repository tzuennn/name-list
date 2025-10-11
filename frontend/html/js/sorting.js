/**
 * Sorting Utilities
 * Pure functions for sorting name data
 */

class SortingService {
  /**
   * Available sort modes
   */
  static MODES = {
    NAME_ASC: 'name-asc',
    NAME_DESC: 'name-desc',
    DATE_NEWEST: 'date-newest',
    DATE_OLDEST: 'date-oldest',
  };

  /**
   * Sort names according to the specified mode
   * @param {Array} items - Array of name objects to sort
   * @param {string} mode - Sort mode (see MODES constant)
   * @returns {Array} - New sorted array (original is not mutated)
   */
  static sortNames(items, mode) {
    // Input validation
    if (!Array.isArray(items)) {
      console.warn('sortNames: expected array, got:', typeof items);
      return [];
    }

    if (items.length === 0) {
      return [];
    }

    // Create a copy to avoid mutating the original array
    const sorted = [...items];

    switch (mode) {
      case SortingService.MODES.NAME_ASC:
        return sorted.sort((a, b) => {
          if (!a.name || !b.name) return 0;
          return a.name.localeCompare(b.name, undefined, {
            sensitivity: 'base', // Case-insensitive
            numeric: true, // Natural numeric sorting (e.g., "item2" before "item10")
            caseFirst: 'lower', // Lowercase letters come first
          });
        });

      case SortingService.MODES.NAME_DESC:
        return sorted.sort((a, b) => {
          if (!a.name || !b.name) return 0;
          return b.name.localeCompare(a.name, undefined, {
            sensitivity: 'base',
            numeric: true,
            caseFirst: 'lower',
          });
        });

      case SortingService.MODES.DATE_NEWEST:
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime(); // Newest first (descending)
        });

      case SortingService.MODES.DATE_OLDEST:
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateA.getTime() - dateB.getTime(); // Oldest first (ascending)
        });

      default:
        console.warn(`sortNames: unknown sort mode "${mode}", returning original order`);
        return sorted;
    }
  }

  /**
   * Get human-readable description for a sort mode
   * @param {string} mode - Sort mode
   * @returns {string} - Human-readable description
   */
  static getModeName(mode) {
    const descriptions = {
      [SortingService.MODES.NAME_ASC]: 'Names sorted alphabetically A to Z',
      [SortingService.MODES.NAME_DESC]: 'Names sorted alphabetically Z to A',
      [SortingService.MODES.DATE_NEWEST]: 'Names sorted by newest entries first',
      [SortingService.MODES.DATE_OLDEST]: 'Names sorted by oldest entries first',
    };

    return descriptions[mode] || 'Sort order changed';
  }

  /**
   * Validate if a sort mode is valid
   * @param {string} mode - Sort mode to validate
   * @returns {boolean} - True if valid
   */
  static isValidMode(mode) {
    return Object.values(SortingService.MODES).includes(mode);
  }

  /**
   * Get the default sort mode
   * @returns {string} - Default sort mode
   */
  static getDefaultMode() {
    return SortingService.MODES.NAME_ASC;
  }

  /**
   * Helper functions for backward compatibility and convenience
   */
  static sortByNameAZ(items) {
    return SortingService.sortNames(items, SortingService.MODES.NAME_ASC);
  }

  static sortByNameZA(items) {
    return SortingService.sortNames(items, SortingService.MODES.NAME_DESC);
  }

  static sortByDateNewest(items) {
    return SortingService.sortNames(items, SortingService.MODES.DATE_NEWEST);
  }

  static sortByDateOldest(items) {
    return SortingService.sortNames(items, SortingService.MODES.DATE_OLDEST);
  }
}

// Export for both ES6 modules and global access
const sortingService = SortingService;

// Backward compatibility - expose functions globally
if (typeof window !== 'undefined') {
  // Main sorting function
  window.sortNames = SortingService.sortNames;

  // Helper functions for backward compatibility
  window.sortByNameAZ = SortingService.sortByNameAZ;
  window.sortByNameZA = SortingService.sortByNameZA;
  window.sortByDateNewest = SortingService.sortByDateNewest;
  window.sortByDateOldest = SortingService.sortByDateOldest;

  // Export the service class as well
  window.SortingService = SortingService;
}

// For Node.js environments (tests)
if (typeof global !== 'undefined') {
  global.sortNames = SortingService.sortNames;
  global.sortByNameAZ = SortingService.sortByNameAZ;
  global.sortByNameZA = SortingService.sortByNameZA;
  global.sortByDateNewest = SortingService.sortByDateNewest;
  global.sortByDateOldest = SortingService.sortByDateOldest;
  global.SortingService = SortingService;
}
