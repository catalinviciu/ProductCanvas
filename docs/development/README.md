# 🛠️ Development Guidelines

> **Comprehensive development guidelines for React + Node.js projects**

---

## 📋 **Overview**

This directory contains all development guidelines, standards, and best practices for React + Node.js full-stack development. These guidelines ensure consistent, maintainable, and high-quality code across the entire project.

---

## 📚 **Documentation Structure**

### **Core Guidelines**
- **[Coding Standards](coding_standards.md)** - Comprehensive coding standards for React, TypeScript, and Node.js
- **[API Design Guidelines](api_design_guidelines.md)** - RESTful API design principles and patterns
- **[Database Design Patterns](database_design_patterns.md)** - Drizzle ORM best practices and patterns
- **[Canvas Performance Guidelines](canvas_performance_guidelines.md)** - HTML5 canvas optimization for large trees
- **[Testing Standards](testing_standards.md)** - Testing strategies for frontend and backend
- **[Security Implementation Standards](security_implementation_standards.md)** - Security best practices
- **[Performance Optimization Guidelines](performance_optimization_guidelines.md)** - Performance best practices
- **[Troubleshooting Guide](troubleshooting_guide.md)** - Common issues and solutions

---

## 🎯 **Development Principles**

### **Code Quality Principles**
1. **Consistency**: Follow established patterns and conventions
2. **Readability**: Write code that is easy to understand and maintain
3. **Testability**: Design code that is easy to test
4. **Performance**: Consider performance implications in design decisions
5. **Security**: Implement security best practices from the start
6. **Documentation**: Document complex logic and architectural decisions

### **Architecture Principles**
1. **Separation of Concerns**: Clear separation between frontend, backend, and data layers
2. **Single Responsibility**: Each class/component should have one reason to change
3. **Dependency Injection**: Use dependency injection for loose coupling
4. **API-First Design**: Design APIs before implementing frontend components
5. **Database-First**: Design database schema before implementing business logic
6. **Test-Driven Development**: Write tests before or alongside implementation

---

## 🏗️ **Project Structure**

### **Backend Structure (Node.js/Express)**
```
server/
├── routes/                          # API route handlers
├── services/                        # Business logic services
├── db.ts                           # Database connection (Drizzle)
├── storage.ts                      # Storage interface
├── enhanced-storage.ts             # Enhanced storage with AI features
├── vite.ts                         # Vite development server
└── index.ts                        # Express server entry point

shared/
└── schema.ts                       # Drizzle schema definitions

client/
├── src/
│   ├── components/                 # React components
│   ├── pages/                      # Page components
│   ├── hooks/                      # Custom React hooks
│   ├── contexts/                   # React context providers
│   ├── lib/                        # Utility functions
│   └── main.tsx                    # React entry point
└── public/                         # Static assets
```

### **Frontend Structure (React/TypeScript)**
```
src/
├── components/                      # Reusable React components
│   ├── common/                      # Common/shared components
│   ├── forms/                       # Form components
│   └── layout/                      # Layout components
├── pages/                           # Page components
├── services/                        # API service layer
├── hooks/                           # Custom React hooks
├── utils/                           # Utility functions
├── types/                           # TypeScript type definitions
├── store/                           # State management (Redux/Context)
├── styles/                          # CSS/SCSS files
├── assets/                          # Static assets
└── __tests__/                       # Test files
    ├── components/                  # Component tests
    ├── services/                    # Service tests
    └── integration/                 # Integration tests
```

---

## 🔧 **Development Workflow**

### **Feature Development Process**
1. **Planning Phase**
   - Create feature documentation using templates
   - Design API endpoints and database schema
   - Create implementation plan

2. **Backend Development**
   - Create/modify Drizzle schema definitions
   - Implement service layer with business logic
   - Create Express route handlers
   - Write unit and integration tests

3. **Frontend Development**
   - Create/modify TypeScript types
   - Implement API integration with TanStack Query
   - Create React components and hooks
   - Implement state management (React Context/Zustand)
   - Write component and integration tests

4. **Integration & Testing**
   - Test frontend-backend integration
   - Run end-to-end tests
   - Perform manual testing
   - Code review and approval

5. **Deployment**
   - Deploy to staging environment
   - Perform smoke testing
   - Deploy to production
   - Monitor and validate

### **Bug Fix Process**
1. **Issue Investigation**
   - Reproduce the issue
   - Identify root cause
   - Document findings

2. **Fix Implementation**
   - Implement fix following coding standards
   - Write tests to prevent regression
   - Test fix thoroughly

3. **Review & Deployment**
   - Code review and approval
   - Deploy to staging for validation
   - Deploy to production
   - Monitor for any issues

---

## 🧪 **Testing Strategy**

### **Backend Testing**
- **Unit Tests**: Test individual methods and classes
- **Integration Tests**: Test API endpoints and database operations
- **Repository Tests**: Test data access layer
- **Service Tests**: Test business logic

### **Frontend Testing**
- **Component Tests**: Test individual React components
- **Integration Tests**: Test component interactions and API calls
- **E2E Tests**: Test complete user workflows
- **Visual Tests**: Test UI appearance and responsiveness

### **Test Coverage Goals**
- **Backend**: Minimum 80% code coverage
- **Frontend**: Minimum 75% code coverage
- **Critical Paths**: 100% coverage for critical business logic

---

## 🔒 **Security Guidelines**

### **Backend Security**
- **Authentication**: Implement Replit Auth integration
- **Authorization**: Use session-based access control
- **Input Validation**: Validate all input data with Zod
- **SQL Injection Prevention**: Use Drizzle ORM with parameterized queries
- **CORS Configuration**: Configure CORS properly for Replit deployment

### **Frontend Security**
- **XSS Prevention**: Sanitize user input
- **CSRF Protection**: Implement CSRF tokens
- **Secure Storage**: Use secure storage for sensitive data
- **HTTPS**: Always use HTTPS in production
- **Content Security Policy**: Implement CSP headers

---

## ⚡ **Performance Guidelines**

### **Backend Performance**
- **Database Optimization**: Use proper indexing and query optimization with Drizzle
- **Caching**: Implement caching for frequently accessed data
- **Connection Pooling**: Configure PostgreSQL connection pooling
- **Optimistic Updates**: Use optimistic updates for canvas interactions
- **Pagination**: Implement pagination for large datasets

### **Frontend Performance**
- **Code Splitting**: Split code into smaller bundles
- **Lazy Loading**: Lazy load components and routes
- **Memoization**: Use React.memo and useMemo for optimization
- **Image Optimization**: Optimize images and use appropriate formats
- **Bundle Analysis**: Regularly analyze bundle size

---

## 📊 **Code Quality Standards**

### **Code Review Checklist**
- [ ] **Functionality**: Code works as intended
- [ ] **Standards Compliance**: Follows coding standards
- [ ] **Test Coverage**: Adequate test coverage
- [ ] **Performance**: No performance regressions
- [ ] **Security**: No security vulnerabilities
- [ ] **Documentation**: Code is properly documented

### **Quality Metrics**
- **Code Coverage**: Minimum thresholds met
- **Linting**: No linting errors
- **Type Safety**: No TypeScript errors
- **Security Scan**: No critical vulnerabilities
- **Performance**: Response times within acceptable limits

---

## 🔧 **Tools and Configuration**

### **Development Tools**
- **IDE**: VS Code (React + Node.js)
- **Version Control**: Git with conventional commits
- **Build Tools**: Vite (React), npm (Node.js)
- **Testing**: Jest/React Testing Library (React), Node.js testing (Backend)
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

### **CI/CD Pipeline**
- **Build**: Automated build on every commit
- **Test**: Run all tests automatically
- **Quality Gates**: Code quality checks
- **Security Scan**: Automated security scanning
- **Deployment**: Automated deployment to staging/production

---

## 📚 **Learning Resources**

### **Node.js/Express**
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

### **React/TypeScript**
- [React Documentation](https://reactjs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### **Best Practices**
- [Clean Code Principles](https://clean-code-developer.com/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [REST API Design](https://restfulapi.net/)

---

## 🆘 **Getting Help**

### **Common Issues**
- Check the [Troubleshooting Guide](troubleshooting_guide.md) for common problems
- Review existing documentation and code examples
- Search project issues and discussions

### **Escalation Process**
1. **Self-Service**: Check documentation and troubleshooting guide
2. **Team Discussion**: Discuss with team members
3. **Technical Lead**: Escalate to technical lead for complex issues
4. **Architecture Review**: Schedule architecture review for major decisions

---

**📝 Guidelines Version**: 2.0  
**🎯 Project Type**: React + Node.js  
**📅 Last Updated**: July 2025  
**🚀 Status**: Production Ready
