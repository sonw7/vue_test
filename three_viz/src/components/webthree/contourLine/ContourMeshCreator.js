// ContourMeshCreator.js
import * as THREE from 'three';
import { ContourGenerator } from './ContourGenerator';
import { MeshColorMapper } from './MeshColorMapper';
import { MeshProcessor } from './MeshProcessor';

/**
 * 等值线网格创建器
 * 整合网格处理、颜色映射和等值线生成功能
 */
export class ContourMeshCreator {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.contourGenerator = new ContourGenerator();
    this.options = Object.assign({
      scale: 1.0,
      contourCount: 10,
      contourColor: '#000000',
      contourOpacity: 0.7
    }, options);
    
    this.contourGenerator.setParams({
      contourCount: this.options.contourCount,
      contourColor: this.options.contourColor,
      contourOpacity: this.options.contourOpacity
    });
    
    this.mesh = null;
    this.contourLines = null;
  }
  
  /**
   * 从数据创建网格和等值线
   * @param {Object} data - 包含顶点、索引和深度值的对象
   * @returns {Object} 包含网格和等值线的对象
   */
  createFromData(data) {
    const { vertices, indices, depths } = data;
    
    // 创建几何体
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    // 居中几何体
    const centeredVertices = MeshProcessor.centerGeometry(geometry);
    
    // 生成颜色
    const { colors, depthRange } = MeshColorMapper.generateColors(depths);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // 创建材质
    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false
    });
    
    // 创建网格
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.scale.set(this.options.scale, this.options.scale, this.options.scale);
    
    // 生成等值线
    const contourLevels = this.contourGenerator.calculateContourLevels(
      depthRange.min, 
      depthRange.max, 
      this.options.contourCount
    );
    
    this.contourLines = this.contourGenerator.generate(
      centeredVertices, 
      indices, 
      depths, 
      contourLevels
    );
    
    this.contourLines.scale.set(this.options.scale, this.options.scale, this.options.scale);
    
    return {
      mesh: this.mesh,
      contourLines: this.contourLines,
      depthRange: depthRange
    };
  }
  
  /**
   * 创建示例网格和等值线
   * @returns {Object} 包含网格和等值线的对象
   */
  createSample() {
    const sampleData = MeshProcessor.generateSampleData();
    return this.createFromData(sampleData);
  }
  
  /**
   * 更新等值线参数
   * @param {Object} params - 等值线参数
   */
  updateContourParams(params) {
    this.contourGenerator.setParams(params);
  }
  
  /**
   * 获取网格对象
   * @returns {THREE.Mesh} 网格对象
   */
  getMesh() {
    return this.mesh;
  }
  
  /**
   * 获取等值线对象
   * @returns {THREE.Group} 等值线对象组
   */
  getContourLines() {
    return this.contourLines;
  }
}

export default ContourMeshCreator;