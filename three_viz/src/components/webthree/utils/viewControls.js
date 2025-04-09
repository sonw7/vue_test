/**
 * 视图控制工具函数
 * 提供了一些便捷方法来控制3D场景的视角
 */

/**
 * 在指定位置创建一个按钮组，用于切换不同的视角
 * @param {SceneManager} sceneManager - 场景管理器实例
 * @param {HTMLElement} container - 放置按钮的容器元素
 * @returns {HTMLElement} 创建的按钮组容器
 */
export function createViewButtons(sceneManager, container) {
  // 创建按钮组容器
  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.bottom = '10px';
  buttonContainer.style.right = '10px';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '5px';
  buttonContainer.style.zIndex = '1000';

  // 定义视图按钮配置
  const viewButtons = [
    { name: 'top', label: '顶视图', icon: '⬆️' },
    { name: 'front', label: '前视图', icon: '⬇️' },
    { name: 'right', label: '右视图', icon: '➡️' },
    { name: 'left', label: '左视图', icon: '⬅️' },
    { name: 'reset', label: '重置视图', icon: '🔄' }
  ];

  // 创建按钮
  viewButtons.forEach(view => {
    const button = document.createElement('button');
    button.innerHTML = `${view.icon} ${view.label}`;
    button.style.padding = '8px 12px';
    button.style.margin = '2px';
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    button.style.border = '1px solid #ccc';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'rgba(220, 220, 220, 0.9)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    });
    
    button.addEventListener('click', () => {
      if (view.name === 'reset') {
        // 重置视图
        sceneManager.resetCamera();
      } else {
        // 切换到指定视图
        sceneManager.switchToView(view.name);
      }
    });
    
    buttonContainer.appendChild(button);
  });
  
  // 添加到容器
  container.appendChild(buttonContainer);
  
  return buttonContainer;
}

/**
 * 创建视图控制下拉菜单
 * @param {SceneManager} sceneManager - 场景管理器实例
 * @param {HTMLElement} container - 放置下拉菜单的容器元素
 * @returns {HTMLElement} 创建的下拉菜单
 */
export function createViewDropdown(sceneManager, container) {
  // 创建下拉菜单容器
  const dropdown = document.createElement('div');
  dropdown.style.position = 'absolute';
  dropdown.style.top = '10px';
  dropdown.style.right = '10px';
  dropdown.style.zIndex = '1000';
  
  // 创建选择器
  const select = document.createElement('select');
  select.style.padding = '8px';
  select.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
  select.style.border = '1px solid #ccc';
  select.style.borderRadius = '4px';
  
  // 添加选项
  const viewOptions = [
    { value: '', label: '选择视图' },
    { value: 'top', label: '顶视图' },
    { value: 'bottom', label: '底视图' },
    { value: 'front', label: '前视图' },
    { value: 'back', label: '后视图' },
    { value: 'left', label: '左视图' },
    { value: 'right', label: '右视图' }
  ];
  
  viewOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    select.appendChild(opt);
  });
  
  // 监听选择事件
  select.addEventListener('change', () => {
    const view = select.value;
    if (view) {
      sceneManager.switchToView(view);
      // 重置选择器
      setTimeout(() => {
        select.value = '';
      }, 100);
    }
  });
  
  dropdown.appendChild(select);
  container.appendChild(dropdown);
  
  return dropdown;
}
