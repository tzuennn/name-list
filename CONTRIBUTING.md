# Contributing to Names List

Thank you for your interest in contributing to the Names List project! This document provides guidelines and information for contributors.

## 🎯 Project Vision

Names List is designed to be a reference implementation of a modern, accessible 3-tier web application. We prioritize:

- **Code Quality**: Clean, maintainable, well-tested code
- **Performance**: Fast, responsive user experiences
- **Modularity**: Component-based architecture for maintainability
- **Documentation**: Comprehensive specs and clear code comments

## 🚀 Getting Started

### Prerequisites

- **Required**: Docker, Docker Compose, Git
- **Development**: Python 3.12+, basic knowledge of Flask and vanilla JavaScript
- **Testing**: Familiarity with pytest (Python) and manual testing (JavaScript)

### Setting Up Your Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/name-list.git
   cd name-list
   git remote add upstream https://github.com/tzuennn/name-list.git
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

3. **Start Development Environment**
   ```bash
   docker-compose up -d
   ```

4. **Verify Setup**
   - Visit http://localhost:8080
   - Check http://localhost:8080/api/health
   - Ensure all features work correctly

## 🏗️ Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **feature/***: New features (`feature/add-search`)
- **fix/***: Bug fixes (`fix/pagination-overflow`)
- **docs/***: Documentation updates (`docs/api-examples`)
- **refactor/***: Code improvements (`refactor/component-structure`)

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow Coding Standards**
   - See [Code Style Guidelines](#code-style-guidelines) below
   - Write tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Backend tests
   pytest backend/tests/
   
   # Frontend tests (manual)
   # Open frontend/tests/unit/test_runner.js in browser
   
   # Integration testing
   # Test the full application flow
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add search functionality"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request via GitHub interface
   ```

## 📋 Types of Contributions

### 🐛 Bug Reports

**Before submitting a bug report:**
- Check existing issues to avoid duplicates
- Test with the latest version
- Gather relevant information (browser, OS, steps to reproduce)

**Bug Report Template:**
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Go to...
2. Click on...
3. Scroll down to...
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- Browser: [e.g., Chrome 118.0]
- OS: [e.g., macOS 14.0]
- Application Version: [e.g., commit hash]

## Screenshots
If applicable, add screenshots
```

### ✨ Feature Requests

**Before submitting a feature request:**
- Check if it aligns with project goals
- Consider if it can be implemented as a plugin/extension
- Think about accessibility implications

**Feature Request Template:**
```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?

## Accessibility Considerations
How will this work for users with disabilities?

## Alternative Solutions
Other ways to solve this problem

## Additional Context
Any other relevant information
```

### 🔧 Code Contributions

#### Backend (Python/Flask)

**Areas for contribution:**
- API endpoint improvements
- Database optimization
- Error handling enhancements
- Performance optimizations
- Security improvements

**Key files:**
- `backend/app.py`: Main Flask application
- `backend/tests/`: Test suite
- `db/init.sql`: Database schema

#### Frontend (JavaScript/HTML/CSS)

**Areas for contribution:**
- UI component improvements
- Accessibility enhancements
- Performance optimizations
- New features (search, export, etc.)
- Mobile experience improvements

**Key files:**
- `frontend/html/js/`: JavaScript modules
- `frontend/html/components/`: HTML components
- `frontend/html/css/`: Modular stylesheets
- `frontend/tests/`: Test suite

#### Documentation

**Areas for contribution:**
- API documentation improvements
- Code comments and examples
- Architecture documentation
- User guides and tutorials
- Accessibility documentation

## 📐 Code Style Guidelines

### Python (Backend)

We use automated tools for Python code quality:

```bash
# Format code (must pass)
black backend/ --line-length 100

# Lint code (must pass)
ruff check backend/

# Type checking (recommended)
mypy backend/ --ignore-missing-imports
```

**Conventions:**
- Line length: 100 characters
- Use type hints where possible
- Write docstrings for public functions
- Follow PEP 8 with Black's modifications

**Example:**
```python
def validate_name(name: str) -> tuple[bool, str]:
    """
    Validate a name input.
    
    Args:
        name: The name string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name or not name.strip():
        return False, "Name cannot be empty"
    if len(name.strip()) > 50:
        return False, "Name cannot exceed 50 characters"
    return True, ""
```

### JavaScript (Frontend)

**Conventions:**
- Use ES6+ features consistently
- Prefer `const` and `let` over `var`
- Use descriptive variable and function names
- Write JSDoc comments for public APIs
- Follow modular architecture patterns

**Example:**
```javascript
/**
 * Sort an array of names alphabetically
 * @param {Array<Object>} names - Array of name objects
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array<Object>} Sorted array
 */
function sortNamesByAlphabet(names, direction = 'asc') {
  return [...names].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name);
    return direction === 'desc' ? -comparison : comparison;
  });
}
```

### HTML/CSS

**Conventions:**
- Use semantic HTML5 elements
- Include ARIA attributes for accessibility
- Follow BEM methodology for CSS classes
- Use CSS custom properties for theming
- Mobile-first responsive design

**Example:**
```html
<section class="names-list" role="region" aria-label="Names list">
  <h2 class="names-list__title">Your Names</h2>
  <ul class="names-list__items" aria-live="polite">
    <li class="names-list__item">
      <span class="names-list__name">Alice</span>
      <button class="names-list__delete-btn" aria-label="Delete Alice">
        <i class="fas fa-trash" aria-hidden="true"></i>
      </button>
    </li>
  </ul>
</section>
```

## 🧪 Testing Guidelines

### Backend Testing

**Required for new features:**
- Unit tests for individual functions
- Integration tests for API endpoints
- Contract tests for API interfaces

**Test structure:**
```python
def test_add_name_success():
    """Test successful name addition"""
    # Arrange
    client = app.test_client()
    
    # Act
    response = client.post('/api/names', json={'name': 'Alice'})
    
    # Assert
    assert response.status_code == 201
    assert response.json['name'] == 'Alice'
```

### Frontend Testing

**Required for new features:**
- Unit tests for pure functions
- Integration tests for user workflows
- Accessibility tests for new UI elements

**Manual testing checklist:**
- [ ] Keyboard navigation works
- [ ] Screen reader announcements are appropriate
- [ ] Visual design is consistent
- [ ] Responsive behavior is correct
- [ ] Error states are handled gracefully

## ♿ Accessibility Requirements

**All contributions must maintain WCAG 2.1 AA compliance:**

### Required Checks
- [ ] **Keyboard Navigation**: All interactive elements accessible via keyboard
- [ ] **Screen Reader**: Proper ARIA labels and live regions
- [ ] **Color Contrast**: Minimum 4.5:1 ratio for text
- [ ] **Focus Indicators**: Visible focus states
- [ ] **Semantic HTML**: Proper heading hierarchy and landmarks

### Testing Tools
- **Automated**: axe-core browser extension
- **Manual**: Tab through entire interface
- **Screen Reader**: Test with VoiceOver (Mac) or NVDA (Windows)

### Common Accessibility Patterns
```html
<!-- Form with proper labeling -->
<label for="name-input">Name</label>
<input id="name-input" type="text" aria-describedby="name-help">
<div id="name-help" class="help-text">Enter a name (max 50 characters)</div>

<!-- Button with screen reader context -->
<button aria-label="Delete Alice" onclick="deleteName('alice')">
  <i class="fas fa-trash" aria-hidden="true"></i>
</button>

<!-- Live region for announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- Dynamic content announced to screen readers -->
</div>
```

## 📋 Pull Request Guidelines

### PR Checklist

- [ ] **Branch**: Created from latest main
- [ ] **Tests**: All existing tests pass
- [ ] **New Tests**: Added for new functionality
- [ ] **Documentation**: Updated relevant docs
- [ ] **Accessibility**: Maintained WCAG 2.1 AA compliance
- [ ] **Code Quality**: Follows style guidelines
- [ ] **Breaking Changes**: Documented if any

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that breaks existing functionality)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Accessibility testing completed

## Screenshots
If applicable, add screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] Accessibility maintained
```

## 🎖️ Recognition

### Contributors
Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project documentation

### Types of Recognition
- **Code Contributors**: Direct code contributions
- **Documentation Contributors**: Docs, specs, and guides
- **Testing Contributors**: Bug reports and testing help
- **Accessibility Contributors**: A11y improvements and testing
- **Community Contributors**: Help with issues and discussions

## 🤝 Code of Conduct

### Our Standards

- **Inclusive**: Welcoming to contributors of all backgrounds
- **Professional**: Constructive, respectful communication
- **Collaborative**: Working together toward shared goals
- **Learning-Oriented**: Supporting growth and knowledge sharing

### Enforcement

Instances of unacceptable behavior may be reported to the project maintainers. All complaints will be reviewed and investigated promptly and fairly.

## 📞 Getting Help

### Questions and Support

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and ideas
- **Documentation**: Check specs/ directory first
- **Code**: Read inline comments and examples

### Maintainer Contact

For sensitive issues or direct maintainer contact:
- Create a private issue
- Email project maintainers
- Use GitHub's private vulnerability reporting

---

## 📚 Resources

### Learning Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Tools and Extensions
- [axe DevTools](https://www.deque.com/axe/devtools/) - Accessibility testing
- [Wave](https://wave.webaim.org/) - Web accessibility evaluation
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance and accessibility audits

---

**Thank you for contributing to Names List! Together, we're building better, more accessible web applications.** 🙏