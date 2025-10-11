#!/usr/bin/env node

/**
 * Node.js test runner for frontend sorting utilities
 * This script runs the same tests as the browser version but in Node.js environment
 */

// Import the sorting functions from the modular architecture
const fs = require('fs');
const path = require('path');

// Load the sorting module
const sortingModulePath = path.join(__dirname, '../../html/js/sorting.js');
const sortingCode = fs.readFileSync(sortingModulePath, 'utf8');

// Execute the sorting module in this context to make functions available
eval(sortingCode);

// Test framework
let testCount = 0;
let passCount = 0;
let failCount = 0;
let currentSuite = '';

function log(message, type = 'info') {
  const colors = {
    success: '\x1b[32m', // Green
    error: '\x1b[31m', // Red
    warning: '\x1b[33m', // Yellow
    info: '\x1b[36m', // Cyan
    reset: '\x1b[0m', // Reset
  };

  console.log(`${colors[type] || colors.info}${message}${colors.reset}`);
}

function assert(condition, message) {
  testCount++;
  if (condition) {
    passCount++;
    log(`  ✓ ${message}`, 'success');
  } else {
    failCount++;
    log(`  ✗ ${message}`, 'error');
    throw new Error(`Assertion failed: ${message}`);
  }
}

assert.equal = function (actual, expected, message) {
  testCount++;
  if (actual === expected) {
    passCount++;
    log(`  ✓ ${message}`, 'success');
  } else {
    failCount++;
    log(`  ✗ ${message}. Expected: ${expected}, Actual: ${actual}`, 'error');
    throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
};

assert.notEqual = function (actual, expected, message) {
  testCount++;
  if (actual !== expected) {
    passCount++;
    log(`  ✓ ${message}`, 'success');
  } else {
    failCount++;
    log(`  ✗ ${message}. Expected not equal to: ${expected}`, 'error');
    throw new Error(`Assertion failed: ${message}. Expected not equal to: ${expected}`);
  }
};

function describe(name, testFn) {
  currentSuite = name;
  log(`\n${name}`, 'info');
  log('='.repeat(name.length), 'info');
  try {
    testFn();
  } catch (error) {
    log(`ERROR in ${name}: ${error.message}`, 'error');
  }
}

function it(name, testFn) {
  try {
    testFn();
  } catch (error) {
    log(`  ✗ ${name}: ${error.message}`, 'error');
  }
}

// Test data
const testData = [
  { id: 1, name: 'Alice', created_at: '2025-10-10T10:00:00.000Z' },
  { id: 2, name: 'Bob', created_at: '2025-10-10T09:00:00.000Z' },
  { id: 3, name: 'charlie', created_at: '2025-10-10T11:00:00.000Z' },
  { id: 4, name: 'Éléonore', created_at: '2025-10-10T08:00:00.000Z' },
  { id: 5, name: 'zebra', created_at: '2025-10-10T12:00:00.000Z' },
  { id: 6, name: 'ñandu', created_at: '2025-10-10T07:00:00.000Z' },
  { id: 7, name: '测试', created_at: '2025-10-10T13:00:00.000Z' },
  { id: 8, name: 'αβγ', created_at: '2025-10-10T06:00:00.000Z' },
];

// Test suites
function runAllTests() {
  log('🚀 Frontend Unit Tests - Sorting Utilities', 'info');
  log('=' * 50, 'info');

  // Test alphabetical sorting A→Z
  describe('sortByNameAZ', function () {
    it('should sort names alphabetically A→Z (case-insensitive)', function () {
      const sorted = sortByNameAZ([...testData]);
      const names = sorted.map((item) => item.name);

      // Basic ordering checks
      assert(names.indexOf('Alice') < names.indexOf('zebra'), 'Alice should come before zebra');
      assert(
        names.indexOf('Bob') < names.indexOf('charlie'),
        'Bob should come before charlie (case-insensitive)'
      );
      assert(names.indexOf('charlie') < names.indexOf('zebra'), 'charlie should come before zebra');
    });

    it('should handle empty array', function () {
      const sorted = sortByNameAZ([]);
      assert.equal(sorted.length, 0, 'Empty array should remain empty');
    });

    it('should not mutate original array', function () {
      const original = [...testData];
      const sorted = sortByNameAZ(original);
      assert.notEqual(sorted, original, 'Should return new array');
      assert.equal(original.length, testData.length, 'Original array should be unchanged');
    });
  });

  // Test alphabetical sorting Z→A
  describe('sortByNameZA', function () {
    it('should sort names alphabetically Z→A (reverse)', function () {
      const sorted = sortByNameZA([...testData]);
      const names = sorted.map((item) => item.name);

      // Should be reverse of A→Z
      assert(
        names.indexOf('zebra') < names.indexOf('Alice'),
        'zebra should come before Alice in Z→A'
      );
    });

    it('should handle single item', function () {
      const singleItem = [{ id: 1, name: 'Solo', created_at: '2025-10-10T10:00:00.000Z' }];
      const sorted = sortByNameZA(singleItem);
      assert.equal(sorted.length, 1, 'Single item should remain single');
      assert.equal(sorted[0].name, 'Solo', 'Single item should be unchanged');
    });
  });

  // Test date sorting newest first
  describe('sortByDateNewest', function () {
    it('should sort by created_at date newest first', function () {
      const sorted = sortByDateNewest([...testData]);
      const dates = sorted.map((item) => new Date(item.created_at).getTime());

      // Check that each date is >= the next (newest to oldest)
      for (let i = 0; i < dates.length - 1; i++) {
        assert(dates[i] >= dates[i + 1], `Date at index ${i} should be >= date at index ${i + 1}`);
      }
    });

    it('should handle same timestamps correctly', function () {
      const sameTimeData = [
        { id: 1, name: 'First', created_at: '2025-10-10T10:00:00.000Z' },
        { id: 2, name: 'Second', created_at: '2025-10-10T10:00:00.000Z' },
        { id: 3, name: 'Third', created_at: '2025-10-10T10:00:00.000Z' },
      ];

      const sorted = sortByDateNewest(sameTimeData);
      assert.equal(sorted.length, 3, 'Should preserve all items with same timestamp');
    });
  });

  // Test date sorting oldest first
  describe('sortByDateOldest', function () {
    it('should sort by created_at date oldest first', function () {
      const sorted = sortByDateOldest([...testData]);
      const dates = sorted.map((item) => new Date(item.created_at).getTime());

      // Check that each date is <= the next (oldest to newest)
      for (let i = 0; i < dates.length - 1; i++) {
        assert(dates[i] <= dates[i + 1], `Date at index ${i} should be <= date at index ${i + 1}`);
      }
    });

    it('should be reverse of newest first', function () {
      const newest = sortByDateNewest([...testData]);
      const oldest = sortByDateOldest([...testData]);

      // Should be exact reverse
      assert.equal(newest.length, oldest.length, 'Both sorts should have same length');
      for (let i = 0; i < newest.length; i++) {
        const newestIndex = i;
        const oldestIndex = oldest.length - 1 - i;
        assert.equal(
          newest[newestIndex].id,
          oldest[oldestIndex].id,
          `Item at position ${newestIndex} in newest should match position ${oldestIndex} in oldest`
        );
      }
    });
  });

  // Test Unicode and locale handling
  describe('Unicode and Locale Support', function () {
    it('should handle Unicode characters properly', function () {
      const unicodeData = [
        { id: 1, name: 'café', created_at: '2025-10-10T10:00:00.000Z' },
        { id: 2, name: 'naïve', created_at: '2025-10-10T09:00:00.000Z' },
        { id: 3, name: 'résumé', created_at: '2025-10-10T11:00:00.000Z' },
      ];

      const sorted = sortByNameAZ(unicodeData);
      assert.equal(sorted.length, 3, 'Should handle all Unicode entries');

      // Basic check that sorting doesn't break with accented characters
      const names = sorted.map((item) => item.name);
      assert(names.includes('café'), 'Should include café');
      assert(names.includes('naïve'), 'Should include naïve');
      assert(names.includes('résumé'), 'Should include résumé');
    });

    it('should handle mixed case consistently', function () {
      const mixedCaseData = [
        { id: 1, name: 'Apple', created_at: '2025-10-10T10:00:00.000Z' },
        { id: 2, name: 'apple', created_at: '2025-10-10T09:00:00.000Z' },
        { id: 3, name: 'APPLE', created_at: '2025-10-10T11:00:00.000Z' },
      ];

      const sorted = sortByNameAZ(mixedCaseData);
      assert.equal(sorted.length, 3, 'Should handle all case variations');
    });
  });

  // Test error handling
  describe('Error Handling', function () {
    it('should handle items with missing names gracefully', function () {
      const incompleteData = [
        { id: 1, name: 'Valid', created_at: '2025-10-10T10:00:00.000Z' },
        { id: 2, created_at: '2025-10-10T09:00:00.000Z' }, // Missing name
        { id: 3, name: '', created_at: '2025-10-10T11:00:00.000Z' }, // Empty name
        { id: 4, name: null, created_at: '2025-10-10T08:00:00.000Z' }, // Null name
      ];

      const sorted = sortByNameAZ(incompleteData);
      assert.equal(sorted.length, 4, 'Should handle all items including incomplete ones');
    });

    it('should handle items with invalid dates gracefully', function () {
      const invalidDateData = [
        { id: 1, name: 'Valid', created_at: '2025-10-10T10:00:00.000Z' },
        { id: 2, name: 'Invalid', created_at: 'invalid-date' },
        { id: 3, name: 'Missing' }, // No created_at
        { id: 4, name: 'Null', created_at: null },
      ];

      const sorted = sortByDateNewest(invalidDateData);
      assert.equal(sorted.length, 4, 'Should handle all items including those with invalid dates');
    });

    it('should handle non-array input gracefully', function () {
      const result1 = sortNames(null, 'name-asc');
      const result2 = sortNames(undefined, 'name-asc');
      const result3 = sortNames('not-an-array', 'name-asc');

      assert.equal(result1.length, 0, 'Should return empty array for null input');
      assert.equal(result2.length, 0, 'Should return empty array for undefined input');
      assert.equal(result3.length, 0, 'Should return empty array for non-array input');
    });
  });

  // Print summary
  log('\n' + '='.repeat(60), 'info');
  log(
    `📊 Test Summary: ${passCount}/${testCount} tests passed`,
    passCount === testCount ? 'success' : 'error'
  );

  if (failCount > 0) {
    log(`❌ ${failCount} tests failed`, 'error');
    process.exit(1);
  } else {
    log('✅ All tests passed!', 'success');
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  sortNames,
  sortByNameAZ,
  sortByNameZA,
  sortByDateNewest,
  sortByDateOldest,
  runAllTests,
};
