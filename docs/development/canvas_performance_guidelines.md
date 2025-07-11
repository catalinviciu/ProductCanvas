# 🎨 Canvas Performance Guidelines

> **Performance optimization guidelines for HTML5 Canvas in Impact Tree applications**

---

## 📋 **Overview**

This document provides comprehensive performance guidelines for the HTML5 Canvas system in the AI-Native Impact Tree application. These guidelines ensure smooth interactions with large trees (100+ nodes) while maintaining 60fps performance.

---

## 🎯 **Performance Targets**

### **Canvas Rendering Performance**
- **Frame Rate**: Maintain 60fps during interactions
- **Node Capacity**: Support 200+ nodes without performance degradation
- **Zoom Performance**: Smooth zoom operations from 0.1x to 3x
- **Pan Performance**: Responsive pan operations with large trees
- **Memory Usage**: Keep memory usage under 100MB for tree visualization

### **User Experience Metrics**
- **Initial Load**: Tree renders within 500ms
- **Interaction Response**: Node selection within 16ms
- **Drag Operations**: Smooth drag with visual feedback
- **Auto-layout**: Complete within 1000ms for 100+ nodes

---

## 🚀 **Canvas Optimization Strategies**

### **1. Viewport Culling**

Only render nodes visible in the current viewport:

```typescript
// ✅ RECOMMENDED: Viewport culling implementation
const useViewportCulling = (nodes: TreeNode[], canvasState: CanvasState) => {
  return useMemo(() => {
    const { zoom, pan } = canvasState;
    const viewportBounds = {
      left: -pan.x / zoom,
      right: (-pan.x + window.innerWidth) / zoom,
      top: -pan.y / zoom,
      bottom: (-pan.y + window.innerHeight) / zoom
    };

    return nodes.filter(node => {
      const nodeRight = node.position.x + NODE_DIMENSIONS.width;
      const nodeBottom = node.position.y + NODE_DIMENSIONS.height;
      
      return !(
        node.position.x > viewportBounds.right ||
        nodeRight < viewportBounds.left ||
        node.position.y > viewportBounds.bottom ||
        nodeBottom < viewportBounds.top
      );
    });
  }, [nodes, canvasState]);
};
```

### **2. Canvas Layer Separation**

Separate static and dynamic content:

```typescript
// ✅ RECOMMENDED: Layer separation
const CanvasLayers = () => {
  return (
    <div className="canvas-container">
      {/* Static background layer */}
      <div className="canvas-background" />
      
      {/* Connection lines layer (less frequent updates) */}
      <svg className="connections-layer">
        {connections.map(connection => (
          <ConnectionLine key={connection.id} connection={connection} />
        ))}
      </svg>
      
      {/* Interactive nodes layer (frequent updates) */}
      <div className="nodes-layer">
        {visibleNodes.map(node => (
          <TreeNode key={node.id} node={node} />
        ))}
      </div>
      
      {/* UI overlay layer */}
      <div className="ui-overlay">
        <CanvasToolbar />
      </div>
    </div>
  );
};
```

### **3. Efficient Re-rendering**

Use React.memo and useMemo for expensive operations:

```typescript
// ✅ RECOMMENDED: Memoized node component
const TreeNode = memo<TreeNodeProps>(({ node, isSelected, onSelect }) => {
  const nodeStyle = useMemo(() => ({
    transform: `translate(${node.position.x}px, ${node.position.y}px)`,
    zIndex: isSelected ? 10 : 1
  }), [node.position.x, node.position.y, isSelected]);

  return (
    <div
      className={`tree-node ${node.type}`}
      style={nodeStyle}
      onClick={onSelect}
    >
      {node.title}
    </div>
  );
});
```

### **4. Optimized State Updates**

Batch state updates and use debouncing:

```typescript
// ✅ RECOMMENDED: Debounced canvas updates
const useDebouncedCanvasUpdate = (delay = 100) => {
  const [pendingUpdates, setPendingUpdates] = useState<CanvasUpdate[]>([]);
  
  const debouncedUpdate = useMemo(
    () => debounce((updates: CanvasUpdate[]) => {
      // Apply batched updates
      applyCanvasUpdates(updates);
      setPendingUpdates([]);
    }, delay),
    [delay]
  );

  const queueUpdate = useCallback((update: CanvasUpdate) => {
    setPendingUpdates(prev => [...prev, update]);
    debouncedUpdate(pendingUpdates);
  }, [debouncedUpdate, pendingUpdates]);

  return { queueUpdate, pendingUpdates };
};
```

---

## 🔧 **Canvas Interaction Optimization**

### **1. Efficient Drag Operations**

Optimize drag performance with requestAnimationFrame:

```typescript
// ✅ RECOMMENDED: Optimized drag handling
const useDragOptimization = () => {
  const [dragState, setDragState] = useState(null);
  const animationRef = useRef<number>();

  const updateDragPosition = useCallback((x: number, y: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(() => {
      setDragState(prev => ({
        ...prev,
        position: { x, y }
      }));
    });
  }, []);

  return { dragState, updateDragPosition };
};
```

### **2. Connection Line Performance**

Optimize SVG connection rendering:

```typescript
// ✅ RECOMMENDED: Efficient connection rendering
const ConnectionLine = memo<ConnectionProps>(({ connection, nodes }) => {
  const pathData = useMemo(() => {
    const fromNode = nodes.find(n => n.id === connection.fromNodeId);
    const toNode = nodes.find(n => n.id === connection.toNodeId);
    
    if (!fromNode || !toNode) return '';
    
    // Calculate optimized path
    return calculateConnectionPath(fromNode, toNode);
  }, [connection, nodes]);

  return (
    <path
      d={pathData}
      className="connection-line"
      vectorEffect="non-scaling-stroke"
    />
  );
});
```

---

## 📊 **Performance Monitoring**

### **1. Canvas Performance Metrics**

Track key performance indicators:

```typescript
// ✅ RECOMMENDED: Performance monitoring
const useCanvasPerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({
    frameRate: 60,
    renderTime: 0,
    nodeCount: 0,
    memoryUsage: 0
  });

  const measureRenderTime = useCallback(() => {
    const start = performance.now();
    
    // Measure render operations
    requestAnimationFrame(() => {
      const end = performance.now();
      setMetrics(prev => ({
        ...prev,
        renderTime: end - start
      }));
    });
  }, []);

  const measureFrameRate = useCallback(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const tick = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          frameRate: frameCount
        }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(tick);
    };
    
    requestAnimationFrame(tick);
  }, []);

  return { metrics, measureRenderTime, measureFrameRate };
};
```

### **2. Memory Management**

Monitor and optimize memory usage:

```typescript
// ✅ RECOMMENDED: Memory optimization
const useMemoryOptimization = () => {
  const cleanupCanvasMemory = useCallback(() => {
    // Clear unused node references
    // Remove event listeners
    // Clean up canvas contexts
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
        if (memoryUsage > 100) {
          cleanupCanvasMemory();
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [cleanupCanvasMemory]);
};
```

---

## ⚠️ **Common Performance Pitfalls**

### **1. Excessive Re-renders**

**❌ AVOID**: Direct object creation in render
```typescript
// Bad: Creates new object on every render
<TreeNode style={{ transform: `translate(${x}px, ${y}px)` }} />
```

**✅ RECOMMENDED**: Memoized styles
```typescript
// Good: Memoized style object
const nodeStyle = useMemo(() => ({
  transform: `translate(${x}px, ${y}px)`
}), [x, y]);
```

### **2. Inefficient Event Handlers**

**❌ AVOID**: Creating new functions in render
```typescript
// Bad: New function on every render
<div onClick={() => handleClick(node.id)} />
```

**✅ RECOMMENDED**: Stable event handlers
```typescript
// Good: Stable callback reference
const handleClick = useCallback(() => {
  onNodeClick(node.id);
}, [node.id, onNodeClick]);
```

### **3. Unoptimized Canvas Operations**

**❌ AVOID**: Synchronous heavy operations
```typescript
// Bad: Blocking operation
const calculateLayout = () => {
  // Heavy synchronous calculation
  return complexLayoutCalculation(nodes);
};
```

**✅ RECOMMENDED**: Async/deferred operations
```typescript
// Good: Deferred calculation
const calculateLayout = useCallback(async () => {
  const result = await Promise.resolve().then(() => 
    complexLayoutCalculation(nodes)
  );
  return result;
}, [nodes]);
```

---

## 🧪 **Performance Testing**

### **1. Load Testing**

Test with various tree sizes:

```typescript
// Performance test scenarios
const performanceTests = [
  { nodes: 50, description: 'Small tree' },
  { nodes: 100, description: 'Medium tree' },
  { nodes: 200, description: 'Large tree' },
  { nodes: 500, description: 'Very large tree' }
];

const runPerformanceTests = async () => {
  for (const test of performanceTests) {
    const startTime = performance.now();
    await renderTree(generateTestNodes(test.nodes));
    const endTime = performance.now();
    
    console.log(`${test.description}: ${endTime - startTime}ms`);
  }
};
```

### **2. Frame Rate Monitoring**

Monitor performance in production:

```typescript
// Real-time performance monitoring
const useProductionPerformanceMonitoring = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.duration > 16.67) { // Slower than 60fps
          console.warn('Slow frame detected:', entry.duration);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);
};
```

---

## 🎯 **Best Practices Summary**

1. **Viewport Culling**: Only render visible nodes
2. **Layer Separation**: Separate static and dynamic content
3. **Memoization**: Use React.memo and useMemo extensively
4. **Debouncing**: Batch state updates and API calls
5. **Animation**: Use requestAnimationFrame for smooth animations
6. **Memory Management**: Clean up unused resources regularly
7. **Performance Monitoring**: Track metrics in production
8. **Testing**: Regular performance testing with large datasets

---

**📝 Guidelines Version**: 1.0  
**🎯 Project Type**: React + Node.js Canvas  
**📅 Last Updated**: July 2025  
**🚀 Status**: Production Ready