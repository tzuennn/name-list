# User Story 1 - Accessibility Validation Notes

**Test T023**: Verify keyboard submit, focus visible, live region announces success/error

## Manual Testing Checklist

### Keyboard Navigation & Submit
- [ ] **Enter key submits**: Press Enter in name input field → form submits
- [ ] **Tab navigation**: Tab key moves between input and Add button properly  
- [ ] **Focus visible**: Clear visual focus indicator on all interactive elements
- [ ] **Focus management**: After successful add, focus returns to input (cleared)

### ARIA Live Regions
- [ ] **Success announcement**: After adding name, live region announces "Name added."
- [ ] **Error announcement**: For validation errors (empty/too long), live region announces error message
- [ ] **Live region exists**: `<div id="live" aria-live="polite">` present in DOM
- [ ] **Screen reader only**: Live region has `.sr-only` class (visually hidden)

### Form Validation UX
- [ ] **Inline error display**: Error message appears in `#error` div with red text
- [ ] **Error clearing**: Error message clears when typing valid input
- [ ] **Input labeling**: Input has proper `aria-label="Name"` or associated label

### List Accessibility  
- [ ] **List semantics**: Names list uses proper `<ul>` with `aria-label="Names list"`
- [ ] **Empty state**: When list is empty, shows accessible "No names yet" message
- [ ] **Loading states**: If implemented, loading states are announced to screen readers

## Automated Testing (Future)
- Consider axe-core testing for automated a11y validation
- Test with actual screen readers (VoiceOver on macOS, NVDA on Windows)

## Current Implementation Status
✅ Live region container exists in HTML  
✅ Error display implemented  
✅ Basic ARIA labels on input and list  
✅ Success/error announcements via live region  
⚠️ Need to verify focus management after form submission  
⚠️ Need to test actual keyboard navigation flow  

## Notes
- Forms should be keyboard accessible without mouse
- Live regions should not be overly verbose or frequent
- Focus should never be trapped or lost unexpectedly
- Error messages should be clear and actionable