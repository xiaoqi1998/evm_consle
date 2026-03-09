---
name: "web-api-generator"
description: "Generates clean, secure, and modular Flask web API code following best practices. Invoke when user requests new API endpoints, database models, or Flask application components."
---

# Web API Generator

This skill generates high-quality Flask web API code with emphasis on security, modularity, maintainability, and code reusability.

## When to Invoke

Invoke this skill when:
- User requests to create new Flask API endpoints or routes
- User needs database models for SQLAlchemy
- User wants to implement authentication/authorization features
- User requests code with security best practices (input validation, SQL injection prevention, etc.)
- User needs modular, reusable code components
- User asks for code generation with comments or documentation

## Code Generation Guidelines

### 1. Security Best Practices
- Always validate and sanitize user inputs
- Use parameterized queries to prevent SQL injection
- Hash passwords using `werkzeug.security` (generate_password_hash/check_password_hash)
- Implement proper authentication and authorization checks
- Use `secure_filename()` for file uploads
- Sanitize all external inputs before processing
- Implement rate limiting for sensitive endpoints
- Use environment variables for sensitive configurations

### 2. Modular Design
- Follow Flask blueprint pattern for organization
- Separate concerns: models, routes, utilities
- Create reusable utility functions
- Use dependency injection where appropriate
- Keep functions focused on single responsibility
- Group related functionality into blueprints

### 3. Code Structure
```
project/
├── app.py                 # Main application
├── extensions.py          # Database and extensions
├── models.py              # Database models
├── blueprints/            # Feature modules
│   ├── auth_bp.py
│   ├── api_bp.py
│   └── ...
├── utils.py               # Utility functions
└── config.py              # Configuration
```

### 4. Documentation
- Include docstrings for all functions and classes
- Use Flask-Swagger/Flasgger annotations for API endpoints
- Add inline comments for complex logic
- Document parameters, return values, and exceptions
- Provide clear error messages

### 5. Database Models
- Use SQLAlchemy ORM for database operations
- Define relationships properly
- Add appropriate indexes for frequently queried fields
- Use datetime for timestamps
- Implement soft delete patterns when needed

### 6. API Response Format
- Use consistent response structure
- Include status codes appropriately
- Provide meaningful error messages
- Support both success and error responses

## Example Output

### Database Model
```python
from extensions import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)
```

### API Blueprint
```python
from flask import Blueprint, request, jsonify
from extensions import db
from models import User
from utils import validate_json_input, create_response
from werkzeug.security import generate_password_hash

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@validate_json_input(['username', 'password', 'email'])
def register():
    """User registration endpoint"""
    data = request.json
    
    if User.query.filter_by(username=data['username']).first():
        return create_response(
            message="Username already exists",
            status_code=400,
            error="UserExists"
        )
    
    user = User(
        username=data['username'],
        email=data['email'],
        is_active=True
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return create_response(
        message="Registration successful",
        status_code=201,
        data={'user_id': user.id}
    )
```

### Utility Functions
```python
from functools import wraps
from flask import jsonify, request

def validate_json_input(required_fields):
    """Decorator to validate JSON input contains required fields"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.json
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    'error': 'Missing required fields',
                    'missing': missing_fields
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def create_response(message="", status_code=200, error=None, data=None):
    """Create standardized API response"""
    response = {
        'message': message,
        'status_code': status_code
    }
    
    if error:
        response['error'] = error
    if data:
        response['data'] = data
    
    return jsonify(response), status_code
```

## Internationalization Support

For multilingual applications (Chinese/English):
- Support both language versions in comments and documentation
- Use clear, consistent terminology
- Provide language-specific examples when needed
- Consider i18n best practices for user-facing messages
