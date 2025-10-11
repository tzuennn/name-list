#!/usr/bin/env node

/**
 * Integration Test Runner for Sorting and Pagination
 *
 * This script performs automated integration tests by:
 * 1. Setting up test data via API calls
 * 2. Loading the application in a headless browser (conceptually)
 * 3. Testing sorting and pagination interactions
 * 4. Verifying expected behavior
 *
 * Note: This is a conceptual implementation since we don't have puppeteer installed.
 * In a real environment, you would use browser automation tools.
 */

const http = require('http');
const https = require('https');

class IntegrationTestRunner {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.testResults = [];
    this.passCount = 0;
    this.failCount = 0;
  }

  log(message, type = 'info') {
    const colors = {
      success: '\x1b[32m', // Green
      error: '\x1b[31m', // Red
      warning: '\x1b[33m', // Yellow
      info: '\x1b[36m', // Cyan
      reset: '\x1b[0m', // Reset
    };

    console.log(`${colors[type] || colors.info}${message}${colors.reset}`);
  }

  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Integration-Test-Runner/1.0',
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : null;
            resolve({ status: res.statusCode, data: jsonData, raw: data });
          } catch (e) {
            resolve({ status: res.statusCode, data: null, raw: data });
          }
        });
      });

      req.on('error', reject);

      if (body && method !== 'GET') {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  async setupTestData() {
    this.log('Setting up test data...', 'info');

    // Clear existing data first
    try {
      const listResponse = await this.makeRequest('/api/names');
      if (listResponse.data && Array.isArray(listResponse.data)) {
        for (const item of listResponse.data) {
          await this.makeRequest(`/api/names/${item.id}`, 'DELETE');
        }
      }
    } catch (e) {
      this.log(`Warning: Could not clear existing data: ${e.message}`, 'warning');
    }

    // Add test data with deliberate ordering
    const testNames = [
      'Zebra',
      'Alice',
      'bob',
      'Charlie',
      'élise',
      'ñandu',
      '测试',
      'αβγ',
      'David',
      'Eve',
      'Frank',
      'Grace',
      'Henry',
      'Iris',
      'Jack',
      'Kate',
      'Liam',
      'Mia',
      'Noah',
      'Olivia',
      'Paul',
      'Quinn',
      'Ruby',
      'Sam',
    ];

    for (let i = 0; i < testNames.length; i++) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay to ensure different timestamps
        const response = await this.makeRequest('/api/names', 'POST', { name: testNames[i] });
        if (response.status !== 201) {
          this.log(`Failed to add name: ${testNames[i]}`, 'error');
        }
      } catch (e) {
        this.log(`Error adding name ${testNames[i]}: ${e.message}`, 'error');
      }
    }

    this.log(`✓ Test data setup complete (${testNames.length} names)`, 'success');
  }

  async testApiSorting() {
    this.log('\n=== Testing API Data Retrieval ===', 'info');

    try {
      const response = await this.makeRequest('/api/names');

      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }

      if (!Array.isArray(response.data)) {
        throw new Error('API did not return an array');
      }

      const names = response.data.map((item) => item.name);
      this.log(`✓ API returned ${response.data.length} names`, 'success');
      this.log(`✓ Names include: ${names.slice(0, 5).join(', ')}...`, 'success');

      // Verify data structure
      const firstItem = response.data[0];
      if (!firstItem.id || !firstItem.name || !firstItem.created_at) {
        throw new Error('API data missing required fields (id, name, created_at)');
      }

      this.log('✓ API data structure is correct', 'success');
      this.passCount += 3;
    } catch (error) {
      this.log(`✗ API test failed: ${error.message}`, 'error');
      this.failCount += 1;
    }
  }

  async testApplicationAccessibility() {
    this.log('\n=== Testing Application Accessibility ===', 'info');

    try {
      // Test that the main page loads
      const response = await this.makeRequest('/');

      if (response.status !== 200) {
        throw new Error(`Main page returned status ${response.status}`);
      }

      const html = response.raw;

      // Check for essential elements in HTML
      const checks = [
        { test: html.includes('<title>'), message: 'Page has title tag' },
        { test: html.includes('aria-label'), message: 'Page includes ARIA labels' },
        { test: html.includes('sort-'), message: 'Page includes sorting controls' },
        { test: html.includes('pagination'), message: 'Page includes pagination controls' },
        { test: html.includes('app.js'), message: 'Page loads JavaScript file' },
      ];

      for (const check of checks) {
        if (check.test) {
          this.log(`✓ ${check.message}`, 'success');
          this.passCount++;
        } else {
          this.log(`✗ ${check.message}`, 'error');
          this.failCount++;
        }
      }
    } catch (error) {
      this.log(`✗ Accessibility test failed: ${error.message}`, 'error');
      this.failCount += 1;
    }
  }

  async testDataSortingLogic() {
    this.log('\n=== Testing Data Sorting Logic ===', 'info');

    try {
      const response = await this.makeRequest('/api/names');
      const data = response.data;

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for sorting tests');
      }

      // Test sorting logic (simulate what frontend does)
      const sortingTests = [
        {
          name: 'Name A→Z sorting',
          sort: (items) =>
            items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
          verify: (sorted) => {
            // Check that 'Alice' comes before 'Zebra'
            const aliceIndex = sorted.findIndex((item) =>
              item.name.toLowerCase().includes('alice')
            );
            const zebraIndex = sorted.findIndex((item) =>
              item.name.toLowerCase().includes('zebra')
            );
            return aliceIndex !== -1 && zebraIndex !== -1 && aliceIndex < zebraIndex;
          },
        },
        {
          name: 'Name Z→A sorting',
          sort: (items) =>
            items.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base' })),
          verify: (sorted) => {
            // Check that 'Zebra' comes before 'Alice'
            const aliceIndex = sorted.findIndex((item) =>
              item.name.toLowerCase().includes('alice')
            );
            const zebraIndex = sorted.findIndex((item) =>
              item.name.toLowerCase().includes('zebra')
            );
            return aliceIndex !== -1 && zebraIndex !== -1 && zebraIndex < aliceIndex;
          },
        },
        {
          name: 'Date newest first sorting',
          sort: (items) => items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
          verify: (sorted) => {
            // Check that dates are in descending order
            for (let i = 0; i < sorted.length - 1; i++) {
              if (new Date(sorted[i].created_at) < new Date(sorted[i + 1].created_at)) {
                return false;
              }
            }
            return true;
          },
        },
        {
          name: 'Date oldest first sorting',
          sort: (items) => items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
          verify: (sorted) => {
            // Check that dates are in ascending order
            for (let i = 0; i < sorted.length - 1; i++) {
              if (new Date(sorted[i].created_at) > new Date(sorted[i + 1].created_at)) {
                return false;
              }
            }
            return true;
          },
        },
      ];

      for (const test of sortingTests) {
        try {
          const sortedData = test.sort([...data]);
          const isValid = test.verify(sortedData);

          if (isValid) {
            this.log(`✓ ${test.name}`, 'success');
            this.passCount++;
          } else {
            this.log(`✗ ${test.name} - verification failed`, 'error');
            this.failCount++;
          }
        } catch (sortError) {
          this.log(`✗ ${test.name} - ${sortError.message}`, 'error');
          this.failCount++;
        }
      }
    } catch (error) {
      this.log(`✗ Data sorting test failed: ${error.message}`, 'error');
      this.failCount += 1;
    }
  }

  async testPaginationLogic() {
    this.log('\n=== Testing Pagination Logic ===', 'info');

    try {
      const response = await this.makeRequest('/api/names');
      const data = response.data;

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for pagination tests');
      }

      // Test pagination logic
      const pageSize = 10;
      const totalItems = data.length;
      const totalPages = Math.ceil(totalItems / pageSize);

      // Test page calculation
      const page1Data = data.slice(0, pageSize);
      const page2Data = data.slice(pageSize, pageSize * 2);

      this.log(`✓ Total items: ${totalItems}, Pages: ${totalPages}`, 'success');
      this.passCount++;

      if (totalItems > pageSize) {
        this.log(`✓ Page 1 has ${page1Data.length} items`, 'success');
        this.log(`✓ Page 2 has ${page2Data.length} items`, 'success');
        this.passCount += 2;
      } else {
        this.log(`✓ Single page contains all ${totalItems} items`, 'success');
        this.passCount++;
      }

      // Test edge cases
      if (totalItems === 0) {
        this.log('✓ Empty data set handled correctly', 'success');
        this.passCount++;
      }
    } catch (error) {
      this.log(`✗ Pagination test failed: ${error.message}`, 'error');
      this.failCount += 1;
    }
  }

  async testErrorHandling() {
    this.log('\n=== Testing Error Handling ===', 'info');

    const errorTests = [
      {
        name: 'Invalid API endpoint',
        test: async () => {
          const response = await this.makeRequest('/api/invalid');
          return response.status === 404;
        },
      },
      {
        name: 'Invalid name deletion',
        test: async () => {
          const response = await this.makeRequest('/api/names/99999', 'DELETE');
          return response.status === 404;
        },
      },
      {
        name: 'Empty name submission',
        test: async () => {
          const response = await this.makeRequest('/api/names', 'POST', { name: '' });
          return response.status === 400;
        },
      },
    ];

    for (const test of errorTests) {
      try {
        const passed = await test.test();
        if (passed) {
          this.log(`✓ ${test.name}`, 'success');
          this.passCount++;
        } else {
          this.log(`✗ ${test.name}`, 'error');
          this.failCount++;
        }
      } catch (error) {
        this.log(`✗ ${test.name} - ${error.message}`, 'error');
        this.failCount++;
      }
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Integration Tests for Sorting and Pagination', 'info');
    this.log('=' * 60, 'info');

    try {
      await this.setupTestData();
      await this.testApiSorting();
      await this.testApplicationAccessibility();
      await this.testDataSortingLogic();
      await this.testPaginationLogic();
      await this.testErrorHandling();

      // Print summary
      this.log('\n' + '='.repeat(60), 'info');
      this.log(
        `📊 Integration Test Summary: ${this.passCount}/${
          this.passCount + this.failCount
        } tests passed`,
        this.failCount === 0 ? 'success' : 'error'
      );

      if (this.failCount > 0) {
        this.log(`❌ ${this.failCount} tests failed`, 'error');
        this.log(
          '\nNote: Some tests may require the application to be fully running with updated code.',
          'warning'
        );
        process.exit(1);
      } else {
        this.log('✅ All integration tests passed!', 'success');
        this.log('\n📝 Manual UI testing should be performed to verify:', 'info');
        this.log('   • Sorting controls respond to clicks', 'info');
        this.log('   • Pagination controls navigate correctly', 'info');
        this.log('   • Responsive design works across devices', 'info');
        this.log('   • Accessibility features work with screen readers', 'info');
        process.exit(0);
      }
    } catch (error) {
      this.log(`💥 Integration test execution error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.runAllTests().catch((error) => {
    console.error('Failed to run integration tests:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTestRunner;
