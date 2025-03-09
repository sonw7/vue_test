import * as THREE from 'three';

// 修改导入方式，使用 fetch 加载 JSON 文件
export default function roadmodeltest(scene) { // 添加 scene 参数
  let roadways = new THREE.Object3D();
  
  // 使用 fetch 加载 JSON 文件
  fetch('/roadway.json')
    .then(response => response.json())
    .then(road_data => {
      const roads = road_data;    
      let vertices = [];

      for(let m = 0; m < roads.vertices.length/3; m++) {
        cotpoints(roads.vertices[m*3]*1, roads.vertices[m*3+2]*1, roads.vertices[m*3+1]*1, "roads", vertices);
      }

      //分成两组顶点
      const indices1 = roads.indices.slice(0, 30000);
      const indices2 = roads.indices.slice(129000);
      
      //1
      const Vertices = new Float32Array(vertices.length);
      for(let i = 0; i < vertices.length; i++) {
        Vertices[i] = vertices[i];
      }
      
      //2
      let V2 = new Float32Array(vertices.length);
      for(let i = 0; i < vertices.length; i++) {
        V2[i] = vertices[i];
      }

      //自定义数据
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
      
      //分部分渲染
      rockConfigs.forEach((config) => {
        // console.log(config);
        loadTextureAndCreateMesh(config, roadways);
      });
      
      scene.add(roadways);
    })
    .catch(error => console.error('Error loading roadway data:', error));
}

function loadTextureAndCreateMesh(config, roadways) {
  const textureLoader = new THREE.TextureLoader();
  let texturePath;

  switch (config.rockType) {
    case '1':
      texturePath = '/textures/door/444.bmp';
      break;
    case '2':
      texturePath = '/textures/door/01.bmp';
      break;
    case '3':
      texturePath = '/textures/door/02.bmp';
      break;
    case '4':
      texturePath = '/textures/door/01.bmp';
      break;
    default:
      texturePath = '/textures/door/01.bmp';
      break;
  }

  textureLoader.load(
    texturePath,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(200, 200);

      //绘制mesh
      const Geometry = new THREE.BufferGeometry();
      Geometry.setAttribute('position', new THREE.BufferAttribute(config.roadway.vertices, 3));
      Geometry.setIndex(config.roadway.indices);
      Geometry.center();
      Geometry.computeBoundingBox();
      Geometry.computeVertexNormals();
      Geometry.normalizeNormals();
      Geometry.setAttribute('uv', new THREE.BufferAttribute(
        boxUvCom(
          Geometry.getAttribute('position'),
          Geometry.getAttribute('normal'),
          Geometry.boundingBox.max, 
          Geometry.boundingBox.min,
          10
        ), 2));
      
      var material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.5,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      
      let mesh = new THREE.Mesh(Geometry, material);
      roadways.add(mesh);
    },
    undefined,
    (error) => {
      console.error('An error occurred loading the texture:', error);
    }
  );
}

function cotpoints(tx, ty, tz, name, vertices) {
  vertices.push(-ty);
  vertices.push(tz);
  vertices.push(tx);
}

// 假设 boxUvCom 函数已在其他地方定义
// 如果没有，您需要添加这个函数的定义
function boxUvCom(positions, normals, max, min, scale) {
  // 这里需要实现 boxUvCom 函数
  // 如果您能提供此函数的定义，我可以将其添加到代码中
  
  // 临时实现，返回一个空数组
  const count = positions.count;
  const uvs = new Float32Array(count * 2);
  
  for (let i = 0; i < count; i++) {
    // 简单的平面UV映射示例
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    // 根据法线方向决定使用哪个平面的UV
    const nx = Math.abs(normals.getX(i));
    const ny = Math.abs(normals.getY(i));
    const nz = Math.abs(normals.getZ(i));
    
    // 选择主要法线方向
    if (nx >= ny && nx >= nz) {
      // 使用YZ平面
      uvs[i * 2] = (y - min.y) / (max.y - min.y) * scale;
      uvs[i * 2 + 1] = (z - min.z) / (max.z - min.z) * scale;
    } else if (ny >= nx && ny >= nz) {
      // 使用XZ平面
      uvs[i * 2] = (x - min.x) / (max.x - min.x) * scale;
      uvs[i * 2 + 1] = (z - min.z) / (max.z - min.z) * scale;
    } else {
      // 使用XY平面
      uvs[i * 2] = (x - min.x) / (max.x - min.x) * scale;
      uvs[i * 2 + 1] = (y - min.y) / (max.y - min.y) * scale;
    }
  }
  
  return uvs;
}