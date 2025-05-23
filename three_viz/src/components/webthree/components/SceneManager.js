import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { createCompass, createAxes } from './Axes/axesManage';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { boxUvCom } from '../utils/uvMappingUtils';
import { ViewHelper } from './ViewHelper/ViewHelper';

class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationId = null;
    this.dataLayers = new Map(); // 存储不同类型和层的数据
    this.loader = new GLTFLoader(); // 用于加载模型文件
    this.orbitControls = null;
    this.firstPersonControls = null;
    this.transformControls = null;
    this.selectedObject = null; // 当前选中的对象
    this.currentControl = 'orbit'; // 当前使用的控制器类型
    this.fontLoader = new FontLoader();
    this.textureCache = new Map(); // 用于缓存已加载的纹理

    // 新增: 用于射线检测和信息显示
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    this.infoTooltip = null; // 信息提示框DOM元素

    this.controlParams = {
      orbit: {
        enableDamping: true,
        dampingFactor: 0.1,
      },
      firstPerson: {
        lookSpeed: 0.01,
        movementSpeed: 0.01,
        noFly: true,
        lookVertical: true,
      },
    };

    // 新增: ViewHelper实例
    this.viewHelper = null;
    this.viewHelperEnabled = true; // 是否启用ViewHelper
    this.viewHelperRenderer = null; // ViewHelper渲染器
    this.viewHelperContainer = null; // ViewHelper容器
  }

  // 初始化场景
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe4dfde);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // this.camera.position.set(0, 0, 5);
    this.camera.position.set(65, 30, 10);
    this.camera.lookAt(0, 0, 25);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    // 初始化控制器
    this._initOrbitControls();
    this._initFirstPersonControls();

    // 默认启用 OrbitControls
    this._useOrbitControls();
    // this._useFirstPersonControls()

    // 添加变换控制器
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.addEventListener('change', () => this.render());
    // this.scene.add(this.transformControls);

    // 使用优化后的参数结构创建坐标系和指北针
    createAxes(this.scene, this.fontLoader, {
      origin: { x: -50, y: -50, z: -8 },
      end: { x: 70, y: 30, z: 4 }
    });

    createCompass(this.scene, this.fontLoader, {
      position: { x: -80, y: 35, z: -20 },
      size: 5,
      rotation: 0
    });

    // 初始化灯光
    this.initLights();

    // 创建信息提示框
    this._createInfoTooltip();

    // 添加交互事件
    this._addInteraction();

    // 创建ViewHelper
    this._initViewHelper();

    this.animate();
  }

  // 初始化ViewHelper
  _initViewHelper() {
    // 创建单独的ViewHelper画布
    const viewHelperContainer = document.createElement('div');
    viewHelperContainer.style.position = 'absolute';
    viewHelperContainer.style.right = '10px';
    viewHelperContainer.style.bottom = '10px';
    viewHelperContainer.style.width = '128px';
    viewHelperContainer.style.height = '128px';
    viewHelperContainer.style.pointerEvents = 'none'; // 允许点击穿透到下面的元素
    viewHelperContainer.style.zIndex = '100';
    this.container.appendChild(viewHelperContainer);
    
    // 创建单独的ViewHelper渲染器
    const viewHelperRenderer = new THREE.WebGLRenderer({ alpha: true });
    viewHelperRenderer.setSize(128, 128);
    viewHelperRenderer.setClearColor(0x000000, 0); // 透明背景
    viewHelperContainer.appendChild(viewHelperRenderer.domElement);
    
    // 为ViewHelper渲染器设置鼠标事件
    viewHelperRenderer.domElement.style.pointerEvents = 'auto'; // 恢复鼠标事件
    
    // 创建ViewHelper实例
    this.viewHelper = new ViewHelper(this.camera, viewHelperRenderer.domElement);
    this.viewHelper.setLabels('X', 'Y', 'Z');
    
    // 存储渲染器引用
    this.viewHelperRenderer = viewHelperRenderer;
    this.viewHelperContainer = viewHelperContainer;
    
    // 添加ViewHelper点击事件处理
    viewHelperRenderer.domElement.addEventListener('pointerdown', (event) => {
      if (this.viewHelperEnabled) {
        // 修改事件坐标以适应ViewHelper渲染器的大小
        const rect = viewHelperRenderer.domElement.getBoundingClientRect();
        const adjustedEvent = {
          clientX: event.clientX,
          clientY: event.clientY,
          preventDefault: event.preventDefault,
          stopPropagation: event.stopPropagation
        };
        
        const handled = this.viewHelper.handleClick(adjustedEvent);
        if (handled) {
          event.stopPropagation();
          event.preventDefault();
        }
      }
    });
  }

  // 创建信息提示框
  _createInfoTooltip() {
    // 创建一个DIV元素作为提示框
    this.infoTooltip = document.createElement('div');
    this.infoTooltip.style.position = 'absolute';
    this.infoTooltip.style.padding = '8px 12px';
    this.infoTooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.infoTooltip.style.color = 'white';
    this.infoTooltip.style.borderRadius = '4px';
    this.infoTooltip.style.fontSize = '14px';
    this.infoTooltip.style.pointerEvents = 'none'; // 不阻挡鼠标事件
    this.infoTooltip.style.zIndex = '1000';
    this.infoTooltip.style.display = 'none'; // 初始隐藏
    this.infoTooltip.style.transition = 'opacity 0.2s';
    this.infoTooltip.style.whiteSpace = 'nowrap';
    this.infoTooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';

    // 添加到容器中
    this.container.appendChild(this.infoTooltip);
  }

  // 动画循环
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // 更新当前控制器
    if (this.currentControl === 'orbit' && this.orbitControls) {
      this.orbitControls.update();
    } else if (this.currentControl === 'firstPerson' && this.firstPersonControls) {
      this.firstPersonControls.update(0.1); // 参数为时间步长，可根据实际调整
    }

    // 执行射线检测
    this._checkRaycasterIntersection();

    // 渲染主场景
    this.renderer.render(this.scene, this.camera);
    
    // 单独渲染ViewHelper
    if (this.viewHelperEnabled && this.viewHelper && this.viewHelperRenderer) {
      // 让ViewHelper观察相机方向
      this.viewHelper.update(0.01);
      
      // 如果ViewHelper正在动画中，更新相机位置
      if (this.viewHelper.animating) {
        this.viewHelper.update(0.01);
      }
      
      // 渲染ViewHelper
      this.viewHelperRenderer.render(this.viewHelper, this.viewHelper.orthoCamera);
    }
  }

  // 新增: 射线检测方法
  _checkRaycasterIntersection() {
    // 只在有鼠标位置数据时执行
    if (this.mouse.x !== undefined && this.mouse.y !== undefined) {
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // 获取所有可能的对象
      const allObjects = [];
      this.dataLayers.forEach(objects => {
        allObjects.push(...objects);
      });

      const intersects = this.raycaster.intersectObjects(allObjects, true);

      if (intersects.length > 0) {
        // 找到最近的对象
        const intersectedObject = intersects[0].object;

        // 如果对象有name属性，显示提示框
        if (intersectedObject.name && intersectedObject.name !== 'default') {
          // 如果悬停对象变化，更新提示框内容
          if (this.hoveredObject !== intersectedObject) {
            this.hoveredObject = intersectedObject;

            // 更新提示框内容
            this._updateTooltip(intersectedObject.name);

            // 显示提示框
            this.infoTooltip.style.display = 'block';
            this.infoTooltip.style.opacity = '1';
          }
        } else {
          // 如果对象没有name或name为default，隐藏提示框
          this._hideTooltip();
          this.hoveredObject = null;
        }
      } else {
        // 如果没有交叉对象，隐藏提示框
        this._hideTooltip();
        this.hoveredObject = null;
      }
    }
  }

  // 新增: 更新提示框内容和位置
  _updateTooltip(name) {
    // 更新提示框内容
    this.infoTooltip.textContent = name;

    // 获取鼠标在屏幕上的位置
    const mouseX = (this.mouse.x + 1) / 2 * window.innerWidth;
    const mouseY = (1 - (this.mouse.y + 1) / 2) * window.innerHeight;

    // 设置提示框位置，稍微偏移以避免遮挡鼠标
    this.infoTooltip.style.left = (mouseX + 15) + 'px';
    this.infoTooltip.style.top = (mouseY - 15) + 'px';
  }

  // 新增: 隐藏提示框
  _hideTooltip() {
    if (this.infoTooltip) {
      this.infoTooltip.style.opacity = '0';
      // 使用setTimeout确保过渡效果完成后再隐藏元素
      setTimeout(() => {
        if (this.infoTooltip.style.opacity === '0') {
          this.infoTooltip.style.display = 'none';
        }
      }, 200);
    }
  }

  initLights() {
    // 环境光 - 显著增强环境光强度
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // 增强环境光强度和亮度
    this.scene.add(ambientLight);

    // 半球光 - 添加半球光让顶部和底部都能得到照明
    const hemisphereLight = new THREE.HemisphereLight(
      0xffffff, // 天空颜色
      0x8d8d8d, // 地面颜色
      0.7        // 强度
    );
    hemisphereLight.position.set(0, 200, 0);
    this.scene.add(hemisphereLight);

    // 方向光 1 - 从顶部照射
    const directLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    directLight1.position.set(0, 200, 100);
    directLight1.castShadow = true; // 启用阴影
    this.scene.add(directLight1);

    // 方向光 2 - 从侧面照射
    const directLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directLight2.position.set(100, 50, -100);
    this.scene.add(directLight2);

    // 方向光 3 - 从另一侧面照射
    const directLight3 = new THREE.DirectionalLight(0xffffff, 0.4);
    directLight3.position.set(-100, 50, -100);
    this.scene.add(directLight3);

    // 点光源 - 更强并靠近模型中心
    const pointLight = new THREE.PointLight(0xffffff, 1.0, 500);
    pointLight.position.set(0, 100, 0);
    this.scene.add(pointLight);

    // 可选：添加灯光辅助器用于调试
    // this.scene.add(new THREE.DirectionalLightHelper(directLight1, 10));
    // this.scene.add(new THREE.DirectionalLightHelper(directLight2, 10));
    // this.scene.add(new THREE.DirectionalLightHelper(directLight3, 10));
    // this.scene.add(new THREE.PointLightHelper(pointLight, 10));
  }

  // 初始化 OrbitControls
  _initOrbitControls() {
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = this.controlParams.orbit.enableDamping;
    this.orbitControls.dampingFactor = this.controlParams.orbit.dampingFactor;
  }

  // 初始化 FirstPersonControls
  _initFirstPersonControls() {
    this.firstPersonControls = new FirstPersonControls(this.camera, this.renderer.domElement);
    this.firstPersonControls.lookSpeed = this.controlParams.firstPerson.lookSpeed;
    this.firstPersonControls.movementSpeed = this.controlParams.firstPerson.movementSpeed;
    this.firstPersonControls.noFly = this.controlParams.firstPerson.noFly;
    this.firstPersonControls.lookVertical = this.controlParams.firstPerson.lookVertical;
  }

  // 切换控制器
  switchControl(controlType) {
    if (controlType === 'orbit') {
      this._useOrbitControls();
    } else if (controlType === 'firstPerson') {
      this._useFirstPersonControls();
    } else {
      console.warn('Unsupported control type:', controlType);
    }
  }

  // 启用 OrbitControls
  _useOrbitControls() {
    this.currentControl = 'orbit';
    this.firstPersonControls.enabled = false;

    // 如果有保存的相机状态，恢复它
    if (this._savedCameraState) {
      this.camera.position.copy(this._savedCameraState.position);
      this.orbitControls.target.copy(this._savedCameraState.target);

      // 恢复相机的近裁面和远裁面
      this.camera.near = this._savedCameraState.near;
      this.camera.far = this._savedCameraState.far;
      this.camera.updateProjectionMatrix(); // 重要：更新投影矩阵
    }

    this.orbitControls.enabled = true;
    this.orbitControls.update();

    console.log('轨道控制器已启用，相机近裁面距离恢复为:', this.camera.near);
  }

  // 启用 FirstPersonControls
  _useFirstPersonControls() {
    this.currentControl = 'firstPerson';
    this.orbitControls.enabled = false;

    // 保存当前相机位置和投影参数，以便切换回轨道控制器时可以恢复
    if (!this._savedCameraState) {
      this._savedCameraState = {
        position: this.camera.position.clone(),
        target: this.orbitControls.target.clone(),
        near: this.camera.near,
        far: this.camera.far
      };
    }

    // 将相机重置到原点或指定的起始位置
    const startPosition = { x: 0.6, y: -1.25, z: 0 }; // y=2 让相机略高于地面，像人眼高度
    this.camera.position.set(startPosition.x, startPosition.y, startPosition.z);

    // 设置相机朝向 (例如，朝向z轴正方向)
    const lookDirection = { x: 0, y: 2, z: 10 };
    this.camera.lookAt(lookDirection.x, lookDirection.y, lookDirection.z);

    // 调整相机的近裁面和远裁面
    this.camera.near = 0.01; // 设置非常近的近裁面，可以看到很近的物体
    this.camera.far = 1000;  // 根据场景大小调整远裁面
    this.camera.updateProjectionMatrix(); // 重要：更新投影矩阵

    // 确保应用当前的参数设置
    this.firstPersonControls.lookSpeed = this.controlParams.firstPerson.lookSpeed;
    this.firstPersonControls.movementSpeed = this.controlParams.firstPerson.movementSpeed;

    // 重新设置第一人称控制器的目标点
    this.firstPersonControls.lookAt(lookDirection.x, lookDirection.y, lookDirection.z);

    // 启用控制器
    this.firstPersonControls.enabled = true;

    console.log('第一人称控制器已启用，相机位置重置为:', startPosition,
                '近裁面距离:', this.camera.near,
                '旋转速度:', this.firstPersonControls.lookSpeed, 
                '移动速度:', this.firstPersonControls.movementSpeed);
  }

  // 更新控制器参数
  updateControlParams(controlType, params) {
    if (controlType === 'orbit' && this.orbitControls) {
      Object.assign(this.controlParams.orbit, params);
      this.orbitControls.enableDamping = this.controlParams.orbit.enableDamping;
      this.orbitControls.dampingFactor = this.controlParams.orbit.dampingFactor;
    } else if (controlType === 'firstPerson' && this.firstPersonControls) {
      // 更新参数对象
      Object.assign(this.controlParams.firstPerson, params);

      // 应用参数到控制器
      this.firstPersonControls.lookSpeed = this.controlParams.firstPerson.lookSpeed;
      this.firstPersonControls.movementSpeed = this.controlParams.firstPerson.movementSpeed;
      this.firstPersonControls.noFly = this.controlParams.firstPerson.noFly;
      this.firstPersonControls.lookVertical = this.controlParams.firstPerson.lookVertical;

      console.log('第一人称控制器参数已更新:', 
                  '旋转速度:', this.firstPersonControls.lookSpeed, 
                  '移动速度:', this.firstPersonControls.movementSpeed);
    } else {
      console.warn('Unsupported control type or invalid parameters:', controlType, params);
    }
  }

  // 添加交互事件
  _addInteraction() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // 点击事件 - 选择对象
    this.container.addEventListener('click', (event) => {
      const rect = this.container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(
        Array.from(this.dataLayers.values()).flat()
      );

      if (intersects.length > 0) {
        this.selectedObject = intersects[0].object;
        console.log("选中对象", this.selectedObject);
        // 将选中对象附加到变换控制器
        this.transformControls.attach(this.selectedObject);
      } else {
        // 如果没有选中，清除变换控制器
        this.transformControls.detach();
        this.selectedObject = null;
      }

      this.render();
    });

    // 鼠标移动事件 - 用于显示提示框
    this.container.addEventListener('mousemove', (event) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    });

    // 鼠标离开容器时隐藏提示框
    this.container.addEventListener('mouseleave', () => {
      this._hideTooltip();
      this.hoveredObject = null;
    });
  }

  // 添加数据
  addModel({ type, data, layer = 'default', options = {} }) {
    let object;

    // 确保 options 中有 position 属性
    options.position = options.position || { x: 0, y: 0, z: 0 };

    switch (type) {
      case 'points': // 点数据
        object = this._createPointCloud(data, options);
        break;

      case 'indices': // 索引数据
        object = this._createIndexedMesh(data, options);
        break;

      case 'model': // 模型文件
        this._loadModel(data, layer, options);
        return;

      case 'custom': // 自定义渲染
        object = options.renderFunction?.(data, THREE);
        break;

      case 'triangleMesh': // 三角面数据
        object = this._createTriangleMesh(data, options, layer);
        break;

      default:
        console.warn('Unsupported data type:', type);
        return;
    }

    if (object) {
      // 添加对象到场景并分层管理
      this._addToLayer(layer, object);
      return { layer, object }; // 返回图层名和对象
    }
    return null;
  }

  // 在 SceneManager.js 中添加此方法
  // 在 SceneManager.js 中修改 getMeshByUuid 方法
  /**
   * 根据UUID获取网格对象
   * @param {string} uuid - 网格的唯一标识符
   * @returns {THREE.Mesh|null} 找到的网格对象或null
   */
  getMeshByUuid(uuid) {
    // 检查参数
    if (!uuid) {
      console.warn('getMeshByUuid: uuid parameter is required');
      return null;
    }

    // 正确遍历 Map 对象
    for (const [layerName, meshes] of this.layers.entries()) {
      // 确保 meshes 是一个数组
      if (Array.isArray(meshes)) {
        for (const mesh of meshes) {
          if (mesh && mesh.uuid === uuid) {
            return mesh;
          }
        }
      }
    }

    // 如果没有找到匹配的网格
    return null;
  }

  // 移除数据
  removeData(layer) {
    if (this.dataLayers.has(layer)) {
      const objects = this.dataLayers.get(layer);
      objects.forEach((obj) => {
        this.scene.remove(obj);

        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this.dataLayers.delete(layer);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  // 获取所有 key 的数组
  getKeysArray() {
    // 使用扩展运算符将 Map 的 key 迭代器转换为数组
    return [...this.dataLayers.keys()];
    // 或者使用 Array.from：
    // return Array.from(this.dataLayers.keys());
  }

  /**
   * 根据图层名称获取所有 Mesh 对象
   * @param {string} layer 图层名称
   * @returns {Array<THREE.Object3D>} 图层中的所有对象
   */
  getMeshesByLayer(layer) {
    if (this.dataLayers.has(layer)) {
      return this.dataLayers.get(layer);
    } else {
      console.warn(`Layer "${layer}" does not exist.`);
      return [];
    }
  }

  //更新贴图
  replaceTexture(mesh, textureUrl) {
    const textureLoader = new THREE.TextureLoader();

    // 加载新贴图
    textureLoader.load(textureUrl, (texture) => {
      if (mesh.material.map) {
        mesh.material.map.dispose(); // 释放旧贴图
      }
      mesh.material.map = texture; // 应用新贴图
      mesh.material.needsUpdate = true; // 确保更新材质
    });
  }

  // 更新数据
  updateData(layer, newData, options = {}) {
    this.removeData(layer);
    this.addModel({ type: options.type, data: newData, layer, options });
  }

  // 创建点云
  _createPointCloud(points, { color = 0x00ff00, size = 0.1, position = { x: 0, y: 0, z: 0 } }) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

    const material = new THREE.PointsMaterial({ color, size });
    const pointCloud = new THREE.Points(geometry, material);

    // 应用位移
    pointCloud.position.set(position.x || 0, position.y || 0, position.z || 0);

    return pointCloud;
  }

  // 创建索引数据
  _createIndexedMesh({ vertices, indices, index = 0 }, { 
    color = 0xffffff, 
    position = { x: 0, y: 0, z: 0 },
    scaleFactor = 0.005,
    rotation = { x: Math.PI / 2, y: 0, z: 0 }
  }) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setIndex(indices);

    const material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // 应用缩放
    mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // 应用旋转
    mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);

    // 应用位移
    mesh.position.set(position.x || 0, position.y || 0, position.z || 0);

    mesh.renderOrder = 100 - index;

    return mesh;
  }

  // 创建三角面网格
  _createTriangleMesh({ vertices, indices, index = 1 }, options = {}, layer) {
    // 创建几何体
    const geometry = new THREE.BufferGeometry();

    // 设置顶点位置
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    // 设置索引
    geometry.setIndex(indices);

    // 计算法向量（生成 `normal` 属性）
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    // 提取选项参数，设置默认值
    const {
      color = 0xffffff,
      textureUrl = null,
      textureRepeat = 1,
      scaleFactor = 1,
      rotationAngle = { x: 0, y: 0, z: 0 },
      position = { x: 0, y: 0, z: 0 },
      edgeColor = 0x333333,
      edgeOpacity = 0.4,
      edgeThreshold = 15,
      flatShading = true,
      roughness = 0.6,
      metalness = 0.1,
      clearcoat = 0.3,
      clearcoatRoughness = 0.25
    } = options;

    // 创建材质 - 使用PhysicalMaterial代替BasicMaterial获得更好的光照效果
    let material;

    // 岩石材质参数
    const rockRoughness = 0.9;        // 增加粗糙度，减少反光
    const rockMetalness = 0.05;       // 降低金属感，岩石几乎没有金属特性
    const rockClearcoat = 0.1;        // 减少清漆效果，岩石不应太有光泽
    const rockClearcoatRoughness = 0.8; // 增加清漆层粗糙度

    if (textureUrl) {
      // 如果有纹理，创建带纹理的物理材质
      material = new THREE.MeshPhysicalMaterial({
        side: THREE.DoubleSide,     // 双面渲染
        flatShading: flatShading,   // 平面着色，保持棱角分明
        roughness: rockRoughness,   // 增加表面粗糙度
        metalness: rockMetalness,   // 降低金属感
        clearcoat: rockClearcoat,   // 减少清漆效果
        clearcoatRoughness: rockClearcoatRoughness, // 增加清漆层粗糙度
        map: null                   // 纹理将在后面加载
      });
    } else {
      // 如果没有纹理，使用指定颜色的物理材质
      material = new THREE.MeshPhysicalMaterial({
        color: color,
        side: THREE.DoubleSide,     // 双面渲染
        flatShading: flatShading,   // 平面着色，保持棱角分明
        roughness: rockRoughness,   // 增加表面粗糙度
        metalness: rockMetalness,   // 降低金属感
        clearcoat: rockClearcoat,   // 减少清漆效果
        clearcoatRoughness: rockClearcoatRoughness // 增加清漆层粗糙度
      });
    }

    // 创建主网格
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = layer || 'default';

    // 创建边缘线几何体和材质，增强三角形边缘
    const edgesGeometry = new THREE.EdgesGeometry(geometry, edgeThreshold);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: edgeColor,
      opacity: edgeOpacity,
      transparent: true,
      linewidth: 1  // 注意：大多数WebGL实现只支持linewidth=1
    });

    // 创建边缘线
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

    // 将边缘线添加为主网格的子对象
    // mesh.add(edges);

    // 存储边缘线的引用，以便后续可以控制其可见性
    // mesh.userData.edges = edges;

    // 应用缩放
    if (typeof scaleFactor === 'object') {
      mesh.scale.set(scaleFactor.scaleX || 1, scaleFactor.scaleY || 1, scaleFactor.scaleZ || 1);
    } else {
      mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    // 应用旋转
    mesh.rotation.set(rotationAngle.x || 0, rotationAngle.y || 0, rotationAngle.z || 0);

    // 应用位移
    mesh.position.set(position.x || 0, position.y || 0, position.z || 0);

    // 设置渲染顺序
    mesh.renderOrder = 100 - index;

    // 如果有纹理URL，添加纹理
    if (textureUrl) {
      this.addTexture(mesh, textureUrl, textureRepeat);
    }

    return mesh;
  }

  // 加载模型
  // 加载模型（异步支持贴图）
  _loadModel(url, layer, { scale = 1, position = { x: 0, y: 0, z: 0 } }) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;

          // 设置模型的缩放比例
          model.scale.set(scale, scale, scale);

          // 设置模型的位置
          model.position.set(position.x, position.y, position.z);

          // 如果模型包含贴图，自动更新贴图
          model.traverse((child) => {
            if (child.isMesh && child.material.map) {
              child.material.map.needsUpdate = true;
            }
          });

          this._addToLayer(layer, model);
          resolve({ layer, object: model }); // 返回图层名和模型对象
        },
        undefined,
        (error) => {
          console.error('Error loading model with texture:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * 添加已创建的 mesh 到场景并应用变换
   * @param {THREE.Object3D} mesh - 要添加的 Three.js 对象
   * @param {Object} options - 变换选项
   * @param {string} options.layer - 图层名称
   * @param {Object} [options.position] - 位置 {x, y, z}
   * @param {Object} [options.rotation] - 旋转（弧度） {x, y, z}
   * @param {Object|number} [options.scale] - 缩放 {x, y, z} 或单一数值
   * @param {Array} [options.layerCategory] - 图层分类 [分类名, 图层名]，用于图层控制面板
   * @returns {Object} 包含图层名和对象的引用
   */
  addMeshToScene(mesh, options = {}) {
    if (!mesh) {
      console.error('无效的 mesh 对象');
      return null;
    }

    const layer = options.layer || 'default';
    mesh.name = layer || 'default';

    // 应用位置（如果尚未应用）
    if (options.position && (!mesh.userData.positionApplied)) {
      mesh.position.set(
        options.position.x || 0,
        options.position.y || 0,
        options.position.z || 0
      );
      mesh.userData.positionApplied = true;
    }

    // 应用旋转（如果尚未应用）
    if (options.rotation && (!mesh.userData.rotationApplied)) {
      mesh.rotation.set(
        options.rotation.x || 0,
        options.rotation.y || 0,
        options.rotation.z || 0
      );
      mesh.userData.rotationApplied = true;
    }

    // 应用缩放（如果尚未应用）
    if (options.scale !== undefined && (!mesh.userData.scaleApplied)) {
      if (typeof options.scale === 'number') {
        // 如果是单一数值，应用到所有轴
        mesh.scale.set(options.scale, options.scale, options.scale);
      } else {
        // 如果是对象，分别应用到各轴
        mesh.scale.set(
          options.scale.x || 1,
          options.scale.y || 1,
          options.scale.z || 1
        );
      }
      mesh.userData.scaleApplied = true;
    }

    // 如果有材质和贴图URL，应用贴图
    if (options.textureUrl && mesh.material) {
      this.addTexture(mesh, options.textureUrl);
    }
    // 添加到指定图层
    this._addToLayer(layer, mesh);

    // 返回图层名和对象引用
    return { layer, object: mesh };
  }

  // 添加对象到指定层
  _addToLayer(layer, object) {
    if (!this.dataLayers.has(layer)) {
      this.dataLayers.set(layer, []);
    }
    this.dataLayers.get(layer).push(object);
    this.scene.add(object);
  }

  //渲染钻孔
  renderDrill(drill, colorFunction, options) {
    console.log("渲染的钻孔数据", drill);
    const { name = "unkown", zkx, zky, xyz } = drill; // 解构钻孔数据
    const drillMeshes = new THREE.Group();; // 存储每段钻孔的几何体 
    const scaleFactor = options.scaleFactor || {}; // 默认不缩放
    // 遍历深度数组，渲染每一段钻孔
    for (let i = 0; i < xyz.length - 1; i++) {
      const depth1 = xyz[i] * 0.01;
      const depth2 = xyz[i + 1] * 0.01;

      // 跳过无效或零深度差的段
      if (depth1 === 99.99 || depth2 === 99.99 || depth1 === depth2) {
        continue;
      }

      // 计算段的长度和中点位置
      const segmentLength = Math.abs(depth2 - depth1);
      const segmentCenter = (depth1 + depth2) / 2;

      // 创建圆柱体几何体
      const geometry = new THREE.CylinderGeometry(1, 1, segmentLength, 32);

      // 设置材质颜色
      const material = new THREE.MeshBasicMaterial({
        color: colorFunction(i), // 动态颜色（基于层级）
      });

      // 创建网格
      const cylinder = new THREE.Mesh(geometry, material);
      // cylinder.scale.set(scaleFactor.scaleX||1, scaleFactor.scaleY||1, scaleFactor.scaleZ||1);

      // 设置圆柱体的位置
      // cylinder.position.set(zkx, segmentCenter, zky);
      cylinder.position.set(10, segmentCenter, 10);

      // 设置初始可见性（如果需要）
      // cylinder.visible = false;

      // 添加到场景
      // this.scene.add(cylinder);

      // 存储到数组中
      drillMeshes.add(cylinder);
    }
    if (drillMeshes) {
      // 添加对象到场景并分层管理
      this._addToLayer(name, drillMeshes);
      return { name, drillMeshes }; // 返回图层名和对象
    }
    // 返回所有生成的网格（便于后续控制）
    return drillMeshes;
  }

  addTexture(mesh, textureUrl, textureRepeat) {
    // 在 SceneManager 类中添加纹理缓存

    // 检查缓存中是否已有该纹理
    if (this.textureCache.has(textureUrl)) {
      const texture = this.textureCache.get(textureUrl);
      if (mesh.material.map) {
        mesh.material.map.dispose();
      }
      mesh.material.map = texture;
      mesh.material.needsUpdate = true;
      return;
    }

    const textureLoader = new THREE.TextureLoader();

    // 加载新贴图
    textureLoader.load(textureUrl, (texture) => {
      this.textureCache.set(textureUrl, texture);

      // 如果需要计算 UV
      if (boxUvCom && typeof boxUvCom === "function") {
        // 获取顶点位置和法向量
        const positionAttribute = mesh.geometry.getAttribute('position');
        const normalAttribute = mesh.geometry.getAttribute('normal');

        if (!positionAttribute || !normalAttribute) {
          console.error("无法计算 UV：缺少 position 或 normal 属性");
          return;
        }

        // 计算 UV
        const boundingBox = mesh.geometry.boundingBox || mesh.geometry.computeBoundingBox();
        const uvArray = boxUvCom(
          positionAttribute,
          normalAttribute,
          boundingBox.max,
          boundingBox.min
        );

        // 添加 UV 属性
        if (uvArray) {
          // console.log('添加uv信息')
          // console.log(uvArray)

          mesh.geometry.setAttribute(
            'uv',
            new THREE.BufferAttribute(uvArray, 2)
          );
        }
      }

      // 替换纹理
      if (mesh.material.map) {
        mesh.material.map.dispose(); // 释放旧贴图
      }
      mesh.material.map = texture; // 应用新贴图
      mesh.material.needsUpdate = true; // 确保更新材质

      // 可选：设置纹理属性
      texture.repeat.set(textureRepeat, textureRepeat);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      // texture.anisotropy = mesh.material.map.anisotropy || 16; // 启用各向异性过滤
    });
  }

  // 处理窗口大小变化
  onWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  // 清理资源
  dispose() {
    cancelAnimationFrame(this.animationId);

    this.renderer.dispose();
    this.dataLayers.forEach((objects) => {
      objects.forEach((obj) => {
        this.scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    });
    this.dataLayers.clear();

    if (this.orbitControls) this.orbitControls.dispose();
    if (this.firstPersonControls) this.firstPersonControls.dispose();
    if (this.transformControls) this.transformControls.dispose();

    // 处理ViewHelper资源
    if (this.viewHelper) {
      this.viewHelper.dispose();
      this.viewHelper = null;
    }
    
    // 清理ViewHelper渲染器
    if (this.viewHelperRenderer) {
      this.viewHelperRenderer.dispose();
      this.viewHelperRenderer = null;
    }
    
    // 移除ViewHelper容器
    if (this.viewHelperContainer && this.viewHelperContainer.parentNode) {
      this.viewHelperContainer.parentNode.removeChild(this.viewHelperContainer);
    }

    // 移除信息提示框
    if (this.infoTooltip && this.infoTooltip.parentNode) {
      this.infoTooltip.parentNode.removeChild(this.infoTooltip);
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }

  /**
   * 重置相机位置和控制器
   * @param {Object} options - 重置选项
   * @param {Object} [options.position] - 相机位置 {x, y, z}
   * @param {Object} [options.lookAt] - 相机朝向 {x, y, z}
   * @param {boolean} [options.resetControls] - 是否重置控制器状态
   */
  resetCamera(options = {}) {
    // 默认相机位置和朝向
    const defaultPosition = { x: 65, y: 30, z: 10 };
    const defaultLookAt = { x: 0, y: 0, z: 0 };

    // 使用提供的选项或默认值
    const position = options.position || defaultPosition;
    const lookAt = options.lookAt || defaultLookAt;
    const resetControls = options.resetControls !== undefined ? options.resetControls : true;

    // 重置相机位置
    this.camera.position.set(position.x, position.y, position.z);

    // 重置相机朝向
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

    // 如果需要，重置控制器
    if (resetControls) {
      if (this.currentControl === 'orbit' && this.orbitControls) {
        // 重置 OrbitControls
        this.orbitControls.target.set(lookAt.x, lookAt.y, lookAt.z);
        this.orbitControls.update();
      } else if (this.currentControl === 'firstPerson' && this.firstPersonControls) {
        // 重置 FirstPersonControls
        this.firstPersonControls.lookAt(lookAt.x, lookAt.y, lookAt.z);
      }
    }

    // 更新变换控制器（如果有选中对象）
    if (this.transformControls && this.selectedObject) {
      this.transformControls.update();
    }

    // 立即渲染一次，以显示新的视图
    this.render();

    console.log('Camera reset to position:', position, 'looking at:', lookAt);
  }

  /**
   * 设置ViewHelper可见性
   * @param {boolean} visible - 是否可见
   */
  setViewHelperVisible(visible) {
    this.viewHelperEnabled = visible;
    if (this.viewHelperContainer) {
      this.viewHelperContainer.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * 通过ViewHelper切换到指定视角
   * @param {string} view - 视角名称 ('top', 'bottom', 'front', 'back', 'left', 'right')
   */
  switchToView(view) {
    if (!this.viewHelper) return;
    
    // 创建一个模拟点击事件
    const event = {
      clientX: 0,
      clientY: 0
    };
    
    // 根据视角名称选择对应的辅助对象
    const viewMap = {
      'right': 'posX',
      'left': 'negX',
      'top': 'posY',
      'bottom': 'negY',
      'front': 'posZ',
      'back': 'negZ'
    };
    
    // 找到对应的ViewHelper子对象
    const children = this.viewHelper.children;
    let targetObject = null;
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.userData && child.userData.type === viewMap[view]) {
        targetObject = child;
        break;
      }
    }
    
    if (targetObject) {
      // 模拟点击对应的辅助对象
      const prepareAnimationData = this.viewHelper.prepareAnimationData || 
                                 function(obj, center) {
                                   // 简易版本，如果无法访问原始方法
                                   this.animating = true;
                                 }.bind(this.viewHelper);
                                 
      prepareAnimationData(targetObject, this.viewHelper.center);
      this.viewHelper.animating = true;
    }
  }
}

export default SceneManager;