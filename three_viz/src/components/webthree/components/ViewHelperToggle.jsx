import React, { useState } from 'react';

/**
 * ViewHelper切换组件
 * @param {Object} props
 * @param {Function} props.onToggle - 切换回调，接收boolean参数表示是否启用
 * @param {boolean} [props.initialState=true] - 初始状态
 * @param {string} [props.position="topRight"] - 按钮位置 ("topRight", "topLeft", "bottomRight", "bottomLeft")
 */
const ViewHelperToggle = ({ onToggle, initialState = true, position = "topRight" }) => {
  const [enabled, setEnabled] = useState(initialState);
  
  // 根据位置确定样式
  let positionStyle = {};
  switch (position) {
    case "topLeft":
      positionStyle = { top: '10px', left: '10px' };
      break;
    case "bottomRight":
      positionStyle = { bottom: '10px', right: '10px' };
      break;
    case "bottomLeft":
      positionStyle = { bottom: '10px', left: '10px' };
      break;
    case "topRight":
    default:
      positionStyle = { top: '10px', right: '10px' };
      break;
  }

  const handleToggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <button
      onClick={handleToggle}
      style={{
        position: 'absolute',
        zIndex: 1000,
        padding: '8px 12px',
        backgroundColor: enabled ? 'rgba(75, 181, 67, 0.7)' : 'rgba(181, 67, 67, 0.7)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        ...positionStyle
      }}
    >
      {enabled ? '隐藏导航器' : '显示导航器'}
    </button>
  );
};

export default ViewHelperToggle;
