# User Story 3 - Accessibility Validation Notes

**Test T042**: Verify sorting controls and pagination are keyboard operable with clear focus and labels

## Manual Testing Checklist

### Sorting Controls Accessibility
- [ ] **Keyboard Access**: All sorting controls reachable via Tab key
- [ ] **Keyboard Activation**: Space/Enter activates sorting buttons/toggles
- [ ] **Focus Indicators**: Clear visual focus outline on all sorting controls
- [ ] **Screen Reader Labels**: Each sorting control has descriptive `aria-label` or label text
- [ ] **State Communication**: Current sort mode announced to screen readers

#### Required ARIA Attributes for Sorting
```html
<!-- Example sorting button group -->
<div role="group" aria-label="Sort options">
  <button type="button" 
          aria-pressed="false" 
          aria-label="Sort names A to Z">
    A→Z
  </button>
  <button type="button" 
          aria-pressed="true" 
          aria-label="Sort names Z to A, currently active">
    Z→A
  </button>
</div>
```

### Pagination Controls Accessibility
- [ ] **Keyboard Navigation**: All pagination controls accessible via Tab
- [ ] **Arrow Key Support**: Left/Right arrows navigate between pages (optional enhancement)
- [ ] **Page Input**: Direct page number input is keyboard accessible
- [ ] **Current Page**: Current page clearly announced to screen readers
- [ ] **Page Count**: Total page count communicated ("Page 2 of 5")

#### Required ARIA Attributes for Pagination
```html
<!-- Example pagination nav -->
<nav aria-label="Pagination Navigation">
  <ul role="list">
    <li>
      <button type="button" 
              aria-label="Go to previous page" 
              disabled>
        Previous
      </button>
    </li>
    <li>
      <button type="button" 
              aria-current="page"
              aria-label="Page 1, current page">
        1
      </button>
    </li>
    <li>
      <button type="button" 
              aria-label="Go to page 2">
        2
      </button>
    </li>
  </ul>
</nav>
```

### Screen Reader Announcements
- [ ] **Sort Change**: When sort changes, announce new order via live region
- [ ] **Page Change**: When page changes, announce new page and item count
- [ ] **Loading States**: If sorting/pagination has loading, announce to screen readers
- [ ] **Error States**: Any errors in sorting/pagination announced appropriately

#### Live Region Updates
```html
<!-- Status updates for sorting/pagination -->
<div id="sort-status" 
     aria-live="polite" 
     aria-atomic="true" 
     class="sr-only">
  <!-- Announces: "Names sorted alphabetically A to Z" -->
</div>

<div id="page-status" 
     aria-live="polite" 
     aria-atomic="true" 
     class="sr-only">
  <!-- Announces: "Page 2 of 3, showing items 21 to 30" -->
</div>
```

### Focus Management
- [ ] **Focus Preservation**: Focus stays on activated sorting control after sort
- [ ] **Page Navigation**: Focus moves logically after page change
- [ ] **Viewport Changes**: Focus handling works correctly when page size adapts
- [ ] **Tab Order**: Logical tab order: Sort controls → List → Pagination
- [ ] **Focus Trapping**: No focus traps or lost focus scenarios

### Visual Design Requirements
- [ ] **Focus Indicators**: Minimum 2px outline with 3:1 contrast ratio
- [ ] **Active States**: Clear visual indication of current sort mode
- [ ] **Button States**: Disabled buttons clearly indicated (not just color)
- [ ] **Text Contrast**: All control text meets WCAG AA contrast (4.5:1)
- [ ] **Touch Targets**: Minimum 44px touch targets for mobile

### Responsive Accessibility
- [ ] **Mobile Navigation**: Sorting/pagination work with touch and assistive tech
- [ ] **Viewport Adaptation**: Controls remain accessible when page size adapts
- [ ] **Orientation**: Works in both portrait and landscape orientations
- [ ] **Zoom Support**: Usable at 200% zoom without horizontal scrolling

## Advanced Accessibility Features

### Enhanced Keyboard Support (Optional)
- [ ] **Arrow Key Navigation**: Left/Right arrows for pagination
- [ ] **Home/End Keys**: Jump to first/last page
- [ ] **Number Keys**: Quick page jumping (1-9 for pages 1-9)
- [ ] **Sort Shortcuts**: Keyboard shortcuts for common sort operations

### Screen Reader Optimization
- [ ] **Table Semantics**: If using table layout, proper headers and scope
- [ ] **Live Regions**: Meaningful updates without overwhelming users
- [ ] **Landmarks**: Proper `nav` landmark for pagination
- [ ] **Headings**: Logical heading structure for long lists

## Testing Methodology

### Screen Reader Testing
**Test with actual screen readers:**
- **macOS**: VoiceOver (Command + F5)
- **Windows**: NVDA (free) or JAWS
- **Mobile**: TalkBack (Android) or VoiceOver (iOS)

### Keyboard-Only Testing
1. Disconnect mouse/trackpad
2. Navigate entire sorting and pagination flow using only keyboard
3. Verify all functionality accessible
4. Check for keyboard traps or lost focus

### Automated Testing
```javascript
// Example axe-core test for sorting controls
describe('Sorting Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const results = await axe.run();
    expect(results.violations).toHaveLength(0);
  });
  
  it('should have proper ARIA labels', () => {
    const sortButtons = document.querySelectorAll('[aria-label*="Sort"]');
    expect(sortButtons.length).toBeGreaterThan(0);
  });
});
```

## Common Accessibility Issues to Avoid

### Sorting Controls
❌ **Avoid**: Using `<div>` with click handlers instead of `<button>`  
✅ **Use**: Semantic `<button>` elements with proper labels

❌ **Avoid**: Color-only indication of active sort  
✅ **Use**: Color + text + ARIA state changes

❌ **Avoid**: Generic labels like "Sort" or "Click here"  
✅ **Use**: Specific labels like "Sort names alphabetically A to Z"

### Pagination Controls
❌ **Avoid**: Links that don't change URL (if using client-side routing)  
✅ **Use**: Buttons for client-side pagination, links for server-side

❌ **Avoid**: Small touch targets (< 44px)  
✅ **Use**: Adequately sized touch targets

❌ **Avoid**: Pagination without context ("1", "2", "3")  
✅ **Use**: Descriptive labels ("Page 1", "Go to page 2")

## Success Criteria

✅ **All controls keyboard accessible**  
✅ **Clear focus indicators on all interactive elements**  
✅ **Meaningful labels and state communication**  
✅ **Proper live region announcements**  
✅ **No accessibility violations in axe-core**  
✅ **Usable with actual screen readers**  
✅ **Works at 200% zoom**  
✅ **Touch-friendly on mobile devices**

## Current Implementation Status

Based on existing codebase:
✅ **Live regions**: Already implemented for success/error announcements  
✅ **Basic accessibility**: Input labels and ARIA attributes present  
⚠️ **Needs implementation**: Sorting control accessibility  
⚠️ **Needs implementation**: Pagination accessibility  
⚠️ **Needs testing**: Actual keyboard and screen reader testing