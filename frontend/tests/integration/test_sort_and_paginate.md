# T041: Integration Tests for Sort and Paginate

**Purpose**: Verify UI toggles switch order and pagination applies correctly across viewports

## Test Scenarios

### Sorting Integration Tests

#### Test 1: A→Z Name Sorting Toggle
**Steps:**
1. Load page with multiple names in different orders
2. Click "Sort A→Z" button/toggle
3. Verify list visually reorders alphabetically
4. Check that URL/state reflects A→Z sorting mode
5. Reload page and verify A→Z order persists (if state saved)

**Expected Results:**
- Names appear in alphabetical order (case-insensitive)
- Sorting control shows "A→Z" as active state
- Unicode characters sort appropriately for locale
- Page numbers reset to 1 when sorting changes

#### Test 2: Z→A Name Sorting Toggle  
**Steps:**
1. Start with A→Z sorted list
2. Click "Sort Z→A" button/toggle
3. Verify list reverses to reverse alphabetical order
4. Toggle back to A→Z and verify order switches again

**Expected Results:**
- Names appear in reverse alphabetical order
- Toggle state updates correctly
- Smooth transition without flicker
- Pagination resets appropriately

#### Test 3: Newest First Date Sorting
**Steps:**
1. Load page with names added at different times
2. Click "Newest First" sorting option
3. Verify most recently added names appear first
4. Check timestamps/creation dates are in descending order

**Expected Results:**
- Most recent entries at top of list
- Date sorting overrides name sorting
- Clear visual indication of active sort mode

#### Test 4: Oldest First Date Sorting
**Steps:**
1. Start with newest-first sorting
2. Switch to "Oldest First" sorting
3. Verify oldest entries appear first
4. Check timestamps are in ascending order

**Expected Results:**
- Oldest entries at top of list
- Reverse of newest-first order
- Consistent with insertion order by default

### Pagination Integration Tests

#### Test 5: Default Pagination (20 items per page)
**Precondition:** List has more than 20 items
**Steps:**
1. Load page with 25+ names
2. Verify only 20 items shown on first page
3. Click "Next" or page 2
4. Verify remaining items shown on page 2
5. Navigate back to page 1

**Expected Results:**
- Exactly 20 items per page (or less on last page)
- Pagination controls visible when needed
- Page navigation works smoothly
- Current page clearly indicated

#### Test 6: Adaptive Page Size for Small Viewport
**Steps:**
1. Resize browser window to mobile size (e.g., 375px wide)
2. Load page with many names
3. Verify page size adapts to prevent vertical overflow
4. Check that viewport height is considered
5. Resize back to desktop and verify page size increases

**Expected Results:**
- Fewer items per page on small screens
- No vertical scrolling within list area
- Page size recalculates on window resize
- Pagination controls remain accessible

#### Test 7: Pagination with Sorting
**Steps:**
1. Load page with 30+ items across multiple pages
2. Apply A→Z sorting
3. Verify pagination resets to page 1
4. Navigate to page 2 and verify sorting maintained
5. Change to Z→A sorting and verify reset to page 1

**Expected Results:**
- Sorting change resets to page 1
- Sort order maintained across pages
- Total page count updates correctly
- URL/state reflects both sort and page

#### Test 8: Empty and Single Page States
**Steps:**
1. Test with empty list (0 items)
2. Test with single page (1-20 items)
3. Verify pagination controls behavior

**Expected Results:**
- No pagination controls shown for single page
- Empty state message displayed appropriately
- No JavaScript errors with edge cases

### Cross-Browser and Responsive Tests

#### Test 9: Responsive Behavior
**Viewports to test:**
- Desktop: 1920x1080, 1366x768
- Tablet: 768x1024, 1024x768
- Mobile: 375x667, 414x896

**Steps:**
1. Test sorting and pagination at each viewport
2. Verify touch interactions work on mobile
3. Check that controls remain accessible
4. Verify adaptive page sizing works correctly

#### Test 10: Sorting Persistence
**Steps:**
1. Apply specific sort order (e.g., Z→A)
2. Navigate to different page
3. Refresh browser
4. Verify sort order and page maintained (if applicable)

## Performance Considerations

### Test 11: Large Dataset Performance
**Steps:**
1. Load page with 500+ items
2. Test sorting performance (should be < 100ms)
3. Test pagination performance
4. Monitor memory usage during sort operations

**Expected Results:**
- Sorting completes quickly without UI freeze
- Pagination remains responsive
- No memory leaks during repeated operations

## Manual Testing Checklist

- [ ] **Visual Verification**: All sorting modes produce expected visual order
- [ ] **Interaction**: All buttons/controls respond to clicks/taps
- [ ] **Accessibility**: Keyboard navigation works for all controls
- [ ] **Responsive**: Adaptive pagination works across viewport sizes
- [ ] **Performance**: No lag during sorting or pagination
- [ ] **Error Handling**: Graceful handling of edge cases (empty list, etc.)

## Browser Testing Matrix

| Feature | Chrome | Firefox | Safari | Edge | Mobile Chrome | Mobile Safari |
|---------|--------|---------|--------|------|---------------|---------------|
| A→Z Sort | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Z→A Sort | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Date Sort | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Pagination | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Adaptive Size | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## Automated Testing Notes

While this document describes manual integration tests, key functionality should also be covered by:

1. **Unit tests** for sorting functions (test_sorting.js)
2. **API contract tests** for server-side sorting (if implemented)
3. **Accessibility tests** using axe-core or similar tools
4. **Performance tests** using browser performance APIs

## Success Criteria

✅ **All sorting modes work correctly**  
✅ **Pagination adapts to viewport size**  
✅ **Sorting + pagination interaction works**  
✅ **No accessibility or usability regressions**  
✅ **Performance remains acceptable with large datasets**  
✅ **Cross-browser compatibility verified**