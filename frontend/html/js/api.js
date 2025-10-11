/**
 * API Service Layer
 * Handles all HTTP requests to the backend API
 */

class ApiService {
  constructor() {
    this.baseUrl = '/api';
  }

  /**
   * Performance timing utility
   * @param {string} label - Label for the operation
   * @param {Function} fn - Function to time
   * @returns {Promise} - Promise that resolves with the function result
   */
  async timeit(label, fn) {
    const t0 = performance.now();
    return Promise.resolve(fn()).finally(() => {
      const t1 = performance.now();
      // Optional: console.debug timings
      // console.debug(`${label}: ${(t1 - t0).toFixed(1)}ms`);
    });
  }

  /**
   * Fetch all names from the API
   * @returns {Promise<Array>} - Array of name objects
   * @throws {Error} - If the request fails
   */
  async fetchNames() {
    return this.timeit('fetchNames', async () => {
      try {
        const response = await fetch(`${this.baseUrl}/names`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate that we received an array
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected array');
        }
        
        return data;
      } catch (error) {
        console.error('Failed to fetch names:', error);
        throw new Error('Failed to load names from server');
      }
    });
  }

  /**
   * Add a new name via the API
   * @param {string} name - The name to add
   * @returns {Promise<Object>} - The created name object
   * @throws {Error} - If the request fails or validation fails
   */
  async addName(name) {
    return this.timeit('addName', async () => {
      // Client-side validation
      const trimmedName = (name || '').trim();
      if (!trimmedName) {
        throw new Error('Name cannot be empty');
      }
      
      if (trimmedName.length > 50) {
        throw new Error('Name cannot exceed 50 characters');
      }

      try {
        const response = await fetch(`${this.baseUrl}/names`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: trimmedName }),
        });

        if (!response.ok) {
          // Try to get error message from response
          let errorMessage = 'Failed to add name';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            // If we can't parse the error response, use default message
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to add name:', error);
        
        // Re-throw API errors as-is, network errors with generic message
        if (error.message.includes('Failed to add name') || 
            error.message.includes('Name cannot')) {
          throw error;
        }
        
        throw new Error('Unable to add name. Please check your connection and try again.');
      }
    });
  }

  /**
   * Delete a name by ID via the API
   * @param {number|string} id - The ID of the name to delete
   * @returns {Promise<void>}
   * @throws {Error} - If the request fails
   */
  async deleteName(id) {
    return this.timeit('deleteName', async () => {
      if (!id) {
        throw new Error('Name ID is required for deletion');
      }

      try {
        const response = await fetch(`${this.baseUrl}/names/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Name not found or already deleted');
          }
          
          let errorMessage = 'Failed to delete name';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            // If we can't parse the error response, use default message
          }
          throw new Error(errorMessage);
        }

        // Successful deletion - no content expected
        return;
      } catch (error) {
        console.error('Failed to delete name:', error);
        
        // Re-throw known errors as-is, network errors with generic message
        if (error.message.includes('Failed to delete') || 
            error.message.includes('Name not found')) {
          throw error;
        }
        
        throw new Error('Unable to delete name. Please check your connection and try again.');
      }
    });
  }

  /**
   * Check if the API is available
   * @returns {Promise<boolean>} - True if API is responsive
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/names`, {
        method: 'HEAD', // Just check if endpoint exists
      });
      return response.ok;
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }
}

// Export as singleton instance
const apiService = new ApiService();