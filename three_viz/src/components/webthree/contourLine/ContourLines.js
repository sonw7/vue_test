// ContourLines.js

// 为三维网格创建三角形数据结构
function createTriangleData(vertices, indices) {
    const triangles = [];
    for (let i = 0; i < indices.length; i += 3) {
      const idx1 = indices[i];
      const idx2 = indices[i + 1];
      const idx3 = indices[i + 2];
      
      const v1 = new THREE.Vector3(
        vertices[idx1 * 3], 
        vertices[idx1 * 3 + 1], 
        vertices[idx1 * 3 + 2]
      );
      
      const v2 = new THREE.Vector3(
        vertices[idx2 * 3], 
        vertices[idx2 * 3 + 1], 
        vertices[idx2 * 3 + 2]
      );
      
      const v3 = new THREE.Vector3(
        vertices[idx3 * 3], 
        vertices[idx3 * 3 + 1], 
        vertices[idx3 * 3 + 2]
      );
      
      triangles.push({
        vertices: [v1, v2, v3],
        indices: [idx1, idx2, idx3]
      });
    }
    return triangles;
  }
  
  // 三维等值线生成 - 行进三角形算法 (Marching Triangles)
  function generate3DContourLines(vertices, indices, depths, contourLevels) {
    const contourLines = new THREE.Group();
    
    // 创建三角形数据结构
    const triangles = createTriangleData(vertices, indices);
    
    // 处理每个等值线级别
    for (let level of contourLevels) {
      const lineSegments = [];
      
      // 对每个三角形进行处理
      for (const triangle of triangles) {
        const v1 = triangle.vertices[0];
        const v2 = triangle.vertices[1];
        const v3 = triangle.vertices[2];
        
        const idx1 = triangle.indices[0];
        const idx2 = triangle.indices[1];
        const idx3 = triangle.indices[2];
        
        const d1 = depths[idx1];
        const d2 = depths[idx2];
        const d3 = depths[idx3];
        
        // 确定哪些顶点在等值面的哪一侧
        const above1 = d1 > level;
        const above2 = d2 > level;
        const above3 = d3 > level;
        
        // 计算等值线在三角形边上的交点
        // 如果一个顶点在等值面上方，另一个在下方，则边与等值面相交
        const intersections = [];
        
        if (above1!== above2) {
          const t = (level - d1) / (d2 - d1);
          const point = new THREE.Vector3().lerpVectors(v1, v2, t);
          intersections.push(point);
        }
        
        if (above2!== above3) {
          const t = (level - d2) / (d3 - d2);
          const point = new THREE.Vector3().lerpVectors(v2, v3, t);
          intersections.push(point);
        }
        
        if (above3!== above1) {
          const t = (level - d3) / (d1 - d3);
          const point = new THREE.Vector3().lerpVectors(v3, v1, t);
          intersections.push(point);
        }
        
        // 如果有两个交点，则添加一个线段
        if (intersections.length === 2) {
          lineSegments.push(intersections[0], intersections[1]);
        }
      }
      
      // 创建线段几何体
      if (lineSegments.length > 0) {
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints(lineSegments);
        
        const material = new THREE.LineBasicMaterial({ 
          color: 0x000000, 
          linewidth: 1,
          opacity: 0.7,
          transparent: true
        });
        
        const line = new THREE.LineSegments(geometry, material);
        contourLines.add(line);
      }
    }
    
    return contourLines;
  }
  
  // 计算等值线级别
  function calculateContourLevels(minDepth, maxDepth, count) {
    const levels = [];
    const step = (maxDepth - minDepth) / (count + 1);
    
    for (let i = 1; i <= count; i++) {
      levels.push(minDepth + step * i);
    }
    
    return levels;
  }
  
  // 更新等值线
  function updateContourLines(contourParams, minDepth, maxDepth, scene, sampleData) {
    if (contourParams.showContours) {
      const levels = calculateContourLevels(minDepth, maxDepth, contourParams.contourCount);
      const newContourLines = generate3DContourLines(sampleData.vertices, sampleData.indices, sampleData.depths, levels);
      
      // 重新应用缩放
      newContourLines.scale.set(0.1, 0.1, 0.1);
      
      // 更新等值线颜色和透明度
      newContourLines.children.forEach(line => {
        line.material.color.set(contourParams.contourColor);
        line.material.opacity = contourParams.contourOpacity;
      });
      
      scene.remove(scene.getObjectByName('contourLines'));
      scene.add(newContourLines);
      newContourLines.name = 'contourLines';
    } else {
      const oldContourLines = scene.getObjectByName('contourLines');
      if (oldContourLines) {
        scene.remove(oldContourLines);
      }
    }
  }
  
  export {
    createTriangleData,
    generate3DContourLines,
    calculateContourLevels,
    updateContourLines
  };