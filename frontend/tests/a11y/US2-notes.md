# User Story 2 - Accessibility Validation Notes

**Test T032**: Verify delete buttons labeled, keyboard accessible, and focus remains sensible

## Manual Testing Checklist

### Delete Button Accessibility

- [x] **Accessible names**: Each delete button has unique `aria-label` like "Delete Alice" (implemented)
- [x] **Descriptive tooltips**: Each delete button has tooltip showing "Delete [name]" (implemented)
- [ ] **Keyboard access**: Tab key can reach delete buttons in logical order
- [ ] **Keyboard activation**: Space or Enter key activates delete buttons
- [ ] **Visual focus**: Clear focus indicator visible on delete buttons

### Focus Management After Deletion

- [ ] **Focus handling**: After deletion, focus moves to appropriate location:
  - If not last item: focus moves to next delete button or same position
  - If last item deleted: focus moves to main content or add input
  - If list becomes empty: focus moves to add input field
- [ ] **Focus not lost**: Focus never disappears or becomes trapped
- [ ] **Logical tab order**: Tab order remains sensible after DOM changes

### Screen Reader Announcements

- [ ] **Deletion announcement**: Live region announces "Name deleted." after successful removal
- [ ] **List updates**: Screen reader users understand list has changed
- [ ] **Empty state**: When list becomes empty, "No names yet" is properly announced
- [ ] **Error handling**: If deletion fails, error is announced via live region

### Button Context & Identification

- [x] **Unique labels**: Each delete button clearly identifies which name it will delete
- [ ] **Button role**: Buttons are properly identified as buttons to assistive technology
- [ ] **Icon accessibility**: Trash icon has appropriate alt text or is decorative only
- [ ] **Color not only**: Delete buttons don't rely solely on color (red) to convey meaning

### Keyboard Navigation Flow

- [ ] **Logical sequence**: Tab order flows: Name input → Add button → Name 1 → Delete 1 → Name 2 → Delete 2...
- [ ] **Skip patterns**: Consider skip links if list becomes very long
- [ ] **Return navigation**: Shift+Tab works correctly in reverse order
- [ ] **Consistent behavior**: Tab behavior consistent before/after deletions

## Automated Testing Considerations

- Axe-core could validate button labeling and ARIA attributes
- Focus management would need custom testing or browser automation
- Screen reader testing requires actual assistive technology

## Current Implementation Status

✅ **Implemented**: `aria-label` and descriptive tooltips on delete buttons  
✅ **Implemented**: Live region announcements for deletion success  
✅ **Implemented**: Empty state handling when list becomes empty  
⚠️ **Needs verification**: Actual keyboard navigation and focus testing  
⚠️ **Needs verification**: Screen reader experience testing  
⚠️ **Future enhancement**: Focus management after deletion could be more sophisticated

## Test Scenarios to Validate

### Scenario 1: Basic Delete with Keyboard

1. Navigate to list using only keyboard (Tab)
2. Find a delete button and activate with Space/Enter
3. Verify item is removed and focus is handled appropriately
4. Verify deletion is announced to screen readers

### Scenario 2: Delete Last Item

1. Add one name to empty list
2. Navigate to its delete button with keyboard
3. Delete the item
4. Verify empty state appears and focus moves logically

### Scenario 3: Delete from Multi-Item List

1. Ensure list has multiple items
2. Delete an item from the middle
3. Verify list reorders correctly
4. Verify focus moves to appropriate next item

### Scenario 4: Error Handling

1. Simulate a deletion error (disconnect network)
2. Attempt to delete an item
3. Verify error message is announced appropriately

## Notes for Future Enhancement

- Consider adding confirmation dialog for deletions (with proper ARIA)
- Consider bulk delete operations with appropriate keyboard shortcuts
- Consider visual/audio feedback for successful operations
- Consider undo functionality for accidental deletions
