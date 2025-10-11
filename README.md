# Names List - 3-Tier Web Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, accessible 3-tier web application for managing a persistent list of names. Built with Flask (Python), PostgreSQL, and vanilla JavaScript with a focus on accessibility, performance, and maintainability.

## ✨ Features

- **📝 Name Management**: Add and remove names with real-time updates
- **💾 Persistence**: All data persists across browser sessions
- **🔄 Flexible Sorting**: Sort by name (A→Z, Z→A) or by date added (newest/oldest first)
- **📱 Responsive Design**: Adaptive pagination that adjusts to viewport size
- **🎨 Modular Architecture**: Clean separation of concerns with modular JavaScript
- **🧪 Comprehensive Testing**: Unit and integration tests.
- **🐳 Containerized**: Easy deployment with Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tzuennn/name-list.git
   cd name-list
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8080/api
   - Health check: http://localhost:8080/api/health

### Stopping the Application

```bash
docker-compose down
```

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Nginx +      │◄──►│   (Flask +      │◄──►│  (PostgreSQL)   │
│   JavaScript)   │    │   Gunicorn)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

#### Frontend (Modular JavaScript)
- **State Management**: Centralized application state with event-driven updates
- **API Layer**: HTTP client with error handling and retry logic
- **UI Service**: DOM manipulation and rendering
- **Accessibility Service**: Screen reader announcements and keyboard navigation
- **Sorting Service**: Pure functions for data sorting

#### Backend (Flask)
- **RESTful API**: Clean HTTP endpoints for name operations
- **Database Layer**: PostgreSQL with connection pooling
- **Error Handling**: Comprehensive validation and error responses
- **Health Monitoring**: Built-in health check endpoints

#### Database (PostgreSQL)
- **Simple Schema**: Optimized for fast reads and writes
- **ACID Compliance**: Reliable data persistence
- **Connection Pooling**: Efficient resource management

## 📁 Project Structure

```
├── frontend/                  # Frontend application
│   ├── html/
│   │   ├── js/              # JavaScript modules
│   │   ├── app.js           # Main application entry
│   │   └── index.html       # HTML structure
│   ├── tests/               # Frontend tests
│   └── Dockerfile
├── backend/                   # Backend API
│   ├── app.py              # Flask application
│   ├── tests/              # Backend tests
│   ├── requirements.txt
│   └── Dockerfile
├── db/
│   └── init.sql            # Database schema
├── specs/                    # Project specifications
├── docker-compose.yml       # Container orchestration
└── pyproject.toml           # Development tools config
```

## 🛠️ Development

### Prerequisites for Development

- Python 3.12+
- Node.js 18+ (for frontend tooling)
- PostgreSQL 16+ (for local development)

### Local Development Setup

1. **Backend Development**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Set up local PostgreSQL and environment variables
   export FLASK_ENV=development
   python app.py
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   # Serve HTML files with a local server
   python -m http.server 8080
   ```

3. **Running Tests**
   ```bash
   # Backend tests
   cd backend
   python -m pytest
   
   # Frontend tests
   cd frontend/tests
   # Open test_runner.js in browser or use Node.js
   ```

### Code Quality

This project uses several tools to maintain code quality:

- **Python**: Black (formatting), Ruff (linting), pytest (testing)
- **JavaScript**: ESLint-compatible patterns, manual testing
- **Git**: Pre-commit hooks and conventional commits

```bash
# Format Python code
black backend/

# Lint Python code
ruff check backend/

# Run all tests
pytest backend/tests/
```

## 📖 API Documentation

### Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/health` | Health check | - | `{"status": "ok", "db": true}` |
| GET | `/api/names` | List all names | - | `[{"id": 1, "name": "Alice", "created_at": "2025-01-01T12:00:00Z"}]` |
| POST | `/api/names` | Add a new name | `{"name": "Alice"}` | `{"id": 1, "name": "Alice", "created_at": "2025-01-01T12:00:00Z"}` |
| DELETE | `/api/names/<id>` | Delete a name | - | `{"message": "Name deleted successfully"}` |

### Error Responses

```json
{
  "error": "Name cannot be empty",
  "code": "VALIDATION_ERROR"
}
```


## 🧪 Testing

### Test Types

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: End-to-end workflow testing
- **Contract Tests**: API interface validation

### Running Tests

```bash
# All backend tests
pytest backend/tests/

# Specific test categories
pytest backend/tests/unit/
pytest backend/tests/integration/
pytest backend/tests/contract/

# Frontend tests (manual)
# Open frontend/tests/unit/test_runner.js in browser
```

## 🚀 Deployment

### Production Deployment

1. **Environment Configuration**
   ```bash
   # Set production environment variables
   export POSTGRES_DB=namelist_prod
   export POSTGRES_USER=namelist_user
   export POSTGRES_PASSWORD=secure_password
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### Performance Considerations

- **Database Connection Pooling**: Configured for optimal concurrent connections
- **Nginx Caching**: Static assets cached for improved performance
- **Gzip Compression**: Enabled for all text-based content
- **Pagination**: Adaptive page sizes prevent large data transfer

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built following spec-driven development methodology using [GitHub Spec Kit](https://github.com/github/spec-kit)
- Accessibility guidelines from WCAG 2.1
- Modular architecture inspired by modern frontend frameworks
- Testing patterns from industry best practices

## 📞 Support

- **Documentation**: Check the [specs/](specs/) directory for detailed specifications
- **Issues**: Report bugs and request features via GitHub Issues
- **Development**: See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup

---

**Made with ❤️ for accessible, maintainable web applications**