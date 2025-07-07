# 🐍 React + Java Coding Standards

> **Comprehensive coding standards for React, TypeScript, and Java development**

---

## 📋 **Overview**

This document establishes coding standards for React + Java development to ensure consistent, maintainable, and high-quality code across the entire full-stack codebase.

---

## ☕ **Java Standards**

### **Code Style**
- **Google Java Style Guide**: Follow Google's Java style guidelines
- **Line Length**: Maximum 100 characters
- **Indentation**: 2 spaces (no tabs)
- **Encoding**: UTF-8 for all Java files

### **Naming Conventions**
```java
// Variables and methods: camelCase
String userName = "developer";
public void calculateSentimentScore() {}

// Classes: PascalCase
public class TradingSignalAnalyzer {}

// Constants: UPPER_SNAKE_CASE
public static final int MAX_RETRY_ATTEMPTS = 3;
public static final String DEFAULT_API_URL = "https://api.example.com";

// Packages: lowercase with dots
package com.company.project.service;

// Private methods: camelCase (no underscore prefix)
private void validateInput() {}
```

### **Annotations and Documentation**
```java
/**
 * Service for managing trading features.
 * 
 * This service handles CRUD operations for trading features
 * and integrates with external data providers.
 */
@Service
@Transactional
public class FeatureService {
    
    private final FeatureRepository featureRepository;
    
    /**
     * Creates a new feature with the given request data.
     * 
     * @param request the feature creation request
     * @return the created feature entity
     * @throws IllegalArgumentException if request is invalid
     */
    public FeatureEntity createFeature(@Valid CreateFeatureRequest request) {
        // Implementation
    }
}
```

### **Exception Handling**
```java
// ✅ RECOMMENDED: Specific exception handling
public FeatureEntity getFeatureById(Long id) {
    return featureRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Feature not found with id: " + id));
}

// ✅ RECOMMENDED: Custom exceptions
public class FeatureNotFoundException extends RuntimeException {
    public FeatureNotFoundException(String message) {
        super(message);
    }
}

// ✅ RECOMMENDED: Global exception handler
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException e) {
        ErrorResponse error = new ErrorResponse("NOT_FOUND", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}
```

---

## ⚛️ **React/TypeScript Standards**

### **Code Style**
- **Prettier Configuration**: Use Prettier for consistent formatting
- **Line Length**: Maximum 100 characters
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings, double quotes for JSX attributes

### **Naming Conventions**
```typescript
// Variables and functions: camelCase
const userName = 'developer';
const calculateScore = () => {};

// Components: PascalCase
const FeatureList: React.FC = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_ITEMS_PER_PAGE = 20;
const API_BASE_URL = 'https://api.example.com';

// Interfaces: PascalCase with 'I' prefix (optional)
interface Feature {
  id: number;
  name: string;
}

// Types: PascalCase
type FeatureStatus = 'active' | 'inactive' | 'pending';

// Files: kebab-case or PascalCase for components
feature-list.component.tsx
FeatureList.tsx
```

### **Component Structure**
```typescript
// ✅ RECOMMENDED: Functional component with TypeScript
import React, { useState, useEffect, useCallback } from 'react';

interface FeatureListProps {
  onFeatureSelect?: (feature: Feature) => void;
  className?: string;
}

export const FeatureList: React.FC<FeatureListProps> = ({ 
  onFeatureSelect, 
  className 
}) => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await FeatureService.getAllFeatures();
      setFeatures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load features');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  const handleFeatureClick = useCallback((feature: Feature) => {
    onFeatureSelect?.(feature);
  }, [onFeatureSelect]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className={`feature-list ${className || ''}`}>
      {features.map(feature => (
        <div 
          key={feature.id} 
          className="feature-item"
          onClick={() => handleFeatureClick(feature)}
        >
          <h3>{feature.name}</h3>
        </div>
      ))}
    </div>
  );
};
```

### **Type Definitions**
```typescript
// ✅ RECOMMENDED: Comprehensive type definitions
export interface Feature {
  id: number;
  name: string;
  description?: string;
  status: FeatureStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeatureRequest {
  name: string;
  description?: string;
}

export interface UpdateFeatureRequest {
  name?: string;
  description?: string;
  status?: FeatureStatus;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
```

---

## 🗄️ **Database Standards**

### **JPA Entity Design**
```java
// ✅ RECOMMENDED: Proper entity design
@Entity
@Table(name = "features", indexes = {
    @Index(name = "idx_feature_name", columnList = "name"),
    @Index(name = "idx_feature_status", columnList = "status"),
    @Index(name = "idx_feature_created_at", columnList = "createdAt")
})
public class FeatureEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 255)
    private String name;
    
    @Column(length = 1000)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FeatureStatus status = FeatureStatus.ACTIVE;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    // Constructors
    protected FeatureEntity() {} // JPA requirement
    
    public FeatureEntity(String name) {
        this.name = name;
    }
    
    public FeatureEntity(String name, String description) {
        this.name = name;
        this.description = description;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    // ... other getters and setters
    
    // equals, hashCode, toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FeatureEntity)) return false;
        FeatureEntity that = (FeatureEntity) o;
        return Objects.equals(id, that.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "FeatureEntity{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", status=" + status +
                '}';
    }
}
```

### **Repository Design**
```java
// ✅ RECOMMENDED: Repository with custom queries
@Repository
public interface FeatureRepository extends JpaRepository<FeatureEntity, Long> {
    
    // Query methods
    List<FeatureEntity> findByStatus(FeatureStatus status);
    
    List<FeatureEntity> findByNameContainingIgnoreCase(String name);
    
    Optional<FeatureEntity> findByNameIgnoreCase(String name);
    
    // Custom queries
    @Query("SELECT f FROM FeatureEntity f WHERE f.status = :status AND f.createdAt >= :startDate")
    List<FeatureEntity> findActiveFeaturesSince(
        @Param("status") FeatureStatus status, 
        @Param("startDate") LocalDateTime startDate
    );
    
    // Pagination
    Page<FeatureEntity> findByStatusOrderByCreatedAtDesc(FeatureStatus status, Pageable pageable);
    
    // Count queries
    long countByStatus(FeatureStatus status);
    
    // Exists queries
    boolean existsByNameIgnoreCase(String name);
}
```

---

## 🌐 **API Design Standards**

### **REST Endpoint Design**
```java
// ✅ RECOMMENDED: RESTful API design
@RestController
@RequestMapping("/api/v1/features")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
@Validated
public class FeatureController {
    
    // GET /api/v1/features - Get all features
    @GetMapping
    public ResponseEntity<List<FeatureResponse>> getAllFeatures(
            @RequestParam(defaultValue = "ACTIVE") FeatureStatus status) {
        // Implementation
    }
    
    // GET /api/v1/features/{id} - Get feature by ID
    @GetMapping("/{id}")
    public ResponseEntity<FeatureResponse> getFeatureById(@PathVariable Long id) {
        // Implementation
    }
    
    // POST /api/v1/features - Create new feature
    @PostMapping
    public ResponseEntity<FeatureResponse> createFeature(
            @Valid @RequestBody CreateFeatureRequest request) {
        // Implementation
    }
    
    // PUT /api/v1/features/{id} - Update feature
    @PutMapping("/{id}")
    public ResponseEntity<FeatureResponse> updateFeature(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFeatureRequest request) {
        // Implementation
    }
    
    // DELETE /api/v1/features/{id} - Delete feature
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeature(@PathVariable Long id) {
        // Implementation
    }
    
    // GET /api/v1/features/search - Search features
    @GetMapping("/search")
    public ResponseEntity<List<FeatureResponse>> searchFeatures(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Implementation
    }
}
```

### **Request/Response DTOs**
```java
// ✅ RECOMMENDED: Validation and documentation
public class CreateFeatureRequest {
    
    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 255, message = "Name must be between 1 and 255 characters")
    private String name;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
    
    // Constructors, getters, setters
}

public class FeatureResponse {
    private Long id;
    private String name;
    private String description;
    private FeatureStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors, getters, setters
}
```

---

## 🧪 **Testing Standards**

### **Java Testing**
```java
// ✅ RECOMMENDED: Service layer test
@ExtendWith(MockitoExtension.class)
class FeatureServiceTest {
    
    @Mock
    private FeatureRepository featureRepository;
    
    @InjectMocks
    private FeatureService featureService;
    
    @Test
    @DisplayName("Should create feature successfully")
    void shouldCreateFeature() {
        // Given
        CreateFeatureRequest request = new CreateFeatureRequest();
        request.setName("Test Feature");
        
        FeatureEntity savedEntity = new FeatureEntity("Test Feature");
        savedEntity.setId(1L);
        
        when(featureRepository.save(any(FeatureEntity.class))).thenReturn(savedEntity);
        
        // When
        FeatureEntity result = featureService.createFeature(request);
        
        // Then
        assertThat(result.getName()).isEqualTo("Test Feature");
        assertThat(result.getId()).isEqualTo(1L);
        verify(featureRepository).save(any(FeatureEntity.class));
    }
    
    @Test
    @DisplayName("Should throw exception for empty name")
    void shouldThrowExceptionForEmptyName() {
        // Given
        CreateFeatureRequest request = new CreateFeatureRequest();
        request.setName("");
        
        // When & Then
        assertThatThrownBy(() -> featureService.createFeature(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Feature name cannot be empty");
    }
}
```

### **React Testing**
```typescript
// ✅ RECOMMENDED: Component test with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeatureList } from '../FeatureList';
import { FeatureService } from '../../services/FeatureService';

jest.mock('../../services/FeatureService');

describe('FeatureList', () => {
  const mockFeatures = [
    { id: 1, name: 'Feature 1', status: 'active', createdAt: '2023-01-01T00:00:00Z' },
    { id: 2, name: 'Feature 2', status: 'active', createdAt: '2023-01-02T00:00:00Z' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays features when loaded successfully', async () => {
    // Given
    (FeatureService.getAllFeatures as jest.Mock).mockResolvedValue(mockFeatures);

    // When
    render(<FeatureList />);

    // Then
    await waitFor(() => {
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
    });
  });

  test('displays loading state initially', () => {
    // Given
    (FeatureService.getAllFeatures as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockFeatures), 100))
    );

    // When
    render(<FeatureList />);

    // Then
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays error message when loading fails', async () => {
    // Given
    (FeatureService.getAllFeatures as jest.Mock).mockRejectedValue(new Error('API Error'));

    // When
    render(<FeatureList />);

    // Then
    await waitFor(() => {
      expect(screen.getByText('Error: API Error')).toBeInTheDocument();
    });
  });

  test('calls onFeatureSelect when feature is clicked', async () => {
    // Given
    const mockOnFeatureSelect = jest.fn();
    (FeatureService.getAllFeatures as jest.Mock).mockResolvedValue(mockFeatures);

    // When
    render(<FeatureList onFeatureSelect={mockOnFeatureSelect} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Feature 1'));
    });

    // Then
    expect(mockOnFeatureSelect).toHaveBeenCalledWith(mockFeatures[0]);
  });
});
```

---

## 📋 **Code Quality Checklist**

### **Java Code Quality**
- [ ] **Proper naming conventions** followed
- [ ] **JavaDoc comments** for public methods
- [ ] **Exception handling** implemented
- [ ] **Input validation** performed
- [ ] **Unit tests** written and passing
- [ ] **No code duplication**
- [ ] **SOLID principles** followed

### **React Code Quality**
- [ ] **TypeScript types** defined and used
- [ ] **Component props** properly typed
- [ ] **Error boundaries** implemented where needed
- [ ] **Loading states** handled
- [ ] **Accessibility** considerations included
- [ ] **Component tests** written and passing
- [ ] **No unused imports or variables**

### **General Quality**
- [ ] **Code formatted** with Prettier/IDE formatter
- [ ] **Linting rules** followed
- [ ] **No console.log** statements in production code
- [ ] **Environment variables** used for configuration
- [ ] **Security best practices** followed
- [ ] **Performance considerations** addressed

---

**📝 Standards Version**: 1.0  
**🎯 Project Type**: React + Java  
**📅 Last Updated**: June 2025  
**🚀 Status**: Production Ready
