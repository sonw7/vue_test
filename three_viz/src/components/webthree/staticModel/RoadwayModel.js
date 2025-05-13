import * as THREE from 'three';

// 保持原有导入方式和函数结构
export default function roadmodeltest(SceneManager, layerNames) {
  let roadways = new THREE.Object3D();
  
  // 使用 fetch 加载 JSON 文件
  fetch('/jsonData/roadway.json')
    .then(response => response.json())
    .then(road_data => {
      const roads = road_data;    
      let vertices = [];

      for(let m = 0; m < roads.vertices.length/3; m++) {
        cotpoints(roads.vertices[m*3]*1, roads.vertices[m*3+2]*1, roads.vertices[m*3+1]*1, "roads", vertices);
      }

      // 保持原有的索引分割方式
      const indices1 = roads.indices.slice(0, 30000);
      const indices2 = roads.indices.slice(129000);
      
      // 保持原有的顶点数组创建方式
      const Vertices = new Float32Array(vertices.length);
      for(let i = 0; i < vertices.length; i++) {
        Vertices[i] = vertices[i];
      }
      
      let V2 = new Float32Array(vertices.length);
      for(let i = 0; i < vertices.length; i++) {
        V2[i] = vertices[i];
      }

      // 保持原有的配置结构
      const rockConfigs = [
        {
          rockType: "1",
          roadway: {
            vertices: Vertices,
            indices: indices1,
          }
        },
        {
          rockType: "2",
          roadway: {
            vertices: Vertices,
            indices: indices2,
          }
        }
      ];
      
      // 分部分渲染
      rockConfigs.forEach((config) => {
        loadTextureAndCreateMesh(config, roadways);
      });
      SceneManager._addToLayer("巷道", roadways);
      layerNames.push(["巷道"]);
    })
    .catch(error => console.error('Error loading roadway data:', error));
}

// 优化后的loadTextureAndCreateMesh函数
function loadTextureAndCreateMesh(config, roadways) {
  const textureLoader = new THREE.TextureLoader();
  let texturePath;

  switch (config.rockType) {
    case '1':
      texturePath = '/textures/door/含水层.bmp';
      break;
    case '2':
      texturePath = '/textures/door/隔水层.bmp';
      break;
    case '3':
      texturePath = '/textures/door/03.bmp';
      break;
    case '4':
      texturePath = '/textures/door/04.bmp';
      break;
    default:
      texturePath = '/textures/door/05.bmp';
      break;
  }

  textureLoader.load(
    texturePath,
    (texture) => {
      // 优化纹理设置
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(200, 200);
      texture.anisotropy = 16; // 增加纹理锐度

      // 创建几何体
      const Geometry = new THREE.BufferGeometry();
      Geometry.setAttribute('position', new THREE.BufferAttribute(config.roadway.vertices, 3));
      Geometry.setIndex(config.roadway.indices);
      
      // 居中几何体（保持原有逻辑）
      Geometry.center();
      
      // 计算包围盒和法线（保持原有逻辑）
      Geometry.computeBoundingBox();
      Geometry.computeVertexNormals();
      Geometry.normalizeNormals();
      
      // 使用优化后的UV映射函数
      Geometry.setAttribute('uv', new THREE.BufferAttribute(
        improvedUVMapping(
          Geometry.getAttribute('position'),
          Geometry.getAttribute('normal'),
          Geometry.boundingBox.max, 
          Geometry.boundingBox.min,
          10
        ), 2));
      
      // 创建材质和网格
      var material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.5,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      
      let mesh = new THREE.Mesh(Geometry, material);
      mesh.name = '巷道';
      roadways.add(mesh);
    },
    undefined,
    (error) => {
      console.error('An error occurred loading the texture:', error);
    }
  );
}

// 保持原有的坐标转换函数
function cotpoints(tx, ty, tz, name, vertices) {
  vertices.push(-ty);
  vertices.push(tz);
  vertices.push(tx);
}

// 优化后的UV映射函数，替代原有的boxUvCom函数
function improvedUVMapping(positions, normals, max, min, scale) {
  const count = positions.count;
  const uvs = new Float32Array(count * 2);
  
  // 计算模型尺寸
  const sizeX = max.x - min.x || 1;
  const sizeY = max.y - min.y || 1;
  const sizeZ = max.z - min.z || 1;
  
  // 计算模型中心
  const centerX = (max.x + min.x) / 2;
  const centerY = (max.y + min.y) / 2;
  const centerZ = (max.z + min.z) / 2;
  
  // 确定模型的主轴方向
  // 对于隧道/巷道模型，通常沿某个轴向延伸
  // 这里我们通过计算尺寸来推断主轴
  let mainAxis = 'x';
  if (sizeY > sizeX && sizeY > sizeZ) mainAxis = 'y';
  if (sizeZ > sizeX && sizeZ > sizeY) mainAxis = 'z';
  
  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    // 获取法线
    const nx = normals.getX(i);
    const ny = normals.getY(i);
    const nz = normals.getZ(i);
    
    // 法线绝对值（用于确定面的朝向）
    const absNx = Math.abs(nx);
    const absNy = Math.abs(ny);
    const absNz = Math.abs(nz);
    
    let u, v;
    
    // 根据面的朝向选择最合适的UV映射方法
    if (absNx > absNy && absNx > absNz) {
      // X轴朝向面 - 使用YZ平面的坐标
      u = (z - min.z) / sizeZ;
      v = (y - min.y) / sizeY;
    } else if (absNy > absNx && absNy > absNz) {
      // Y轴朝向面 - 使用XZ平面的坐标
      u = (x - min.x) / sizeX;
      v = (z - min.z) / sizeZ;
    } else {
      // Z轴朝向面 - 使用XY平面的坐标
      u = (x - min.x) / sizeX;
      v = (y - min.y) / sizeY;
    }
    
    // 根据模型的主轴应用特殊处理
    // 对于隧道类结构，我们可能需要特殊的UV映射
    if (mainAxis === 'x') {
      // 如果模型主要沿X轴延伸
      // 对于侧面（Y/Z朝向），使用圆柱映射
      if (absNy > 0.7 || absNz > 0.7) {
        // 计算到中心轴的距离和角度
        const dy = y - centerY;
        const dz = z - centerZ;
        const angle = Math.atan2(dz, dy);
        const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
        
        // 沿X轴的归一化位置
        const xPos = (x - min.x) / sizeX;
        
        // 使用圆柱映射
        u = xPos;
        v = normalizedAngle;
      }
    } else if (mainAxis === 'y') {
      // 如果模型主要沿Y轴延伸
      if (absNx > 0.7 || absNz > 0.7) {
        const dx = x - centerX;
        const dz = z - centerZ;
        const angle = Math.atan2(dz, dx);
        const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
        
        const yPos = (y - min.y) / sizeY;
        
        u = yPos;
        v = normalizedAngle;
      }
    } else {
      // 如果模型主要沿Z轴延伸
      if (absNx > 0.7 || absNy > 0.7) {
        const dx = x - centerX;
        const dy = y - centerY;
        const angle = Math.atan2(dy, dx);
        const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
        
        const zPos = (z - min.z) / sizeZ;
        
        u = zPos;
        v = normalizedAngle;
      }
    }
    
    // 应用缩放并存储UV坐标
    uvs[i * 2] = u * scale;
    uvs[i * 2 + 1] = v * scale;
  }
  
  return uvs;
}