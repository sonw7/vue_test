export const menuItems = [
    {
      key: "controlType",
      type: "select",
      label: "控制器类型",
      options: [
        { label: "轨道控制", value: "orbit" },
        { label: "第一人称控制", value: "firstPerson" },
      ],
    },
    {
      key: "resetView",
      type: "button",
      label: "重置视角",
    },
    {
      key: "moveSpeed",
      type: "slider",
      label: "移动速度 (第一人称)",
      min: 1,
      max: 20,
      step: 1,
    },
    {
      key: "lookSpeed",
      type: "slider",
      label: "旋转速度 (第一人称)",
      min: 0.01,
      max: 1,
      step: 0.01,
      decimal: 2,
    },
    {
      key: "layerSelect",
      type: "select",
      label: "地层选择",
      options: [], // 初始为空，动态生成
    },
    // {
    //   key: "resetCamera",
    //   type: "button",
    //   label: "重置相机",
    // },
    {
      key: "layerDistanceCalculation",
      type: "group",
      label: "地层间距计算",
      children: [
        {
          key: "sourceLayer",
          type: "select",
          label: "源地层",
          options: [],
          value: ""
        },
        {
          key: "targetLayer",
          type: "select",
          label: "目标地层",
          options: [],
          value: ""
        },
        {
          key: "calculateDistance",
          type: "button",
          label: "计算间距",
        },
        {
          key: "resetLayers",
          type: "button",
          label: "重置地层",
        }
      ]
    }
  ];
  
  export const menuDefaultValues = {
    controlType: "orbit",
    moveSpeed: 5,
    lookSpeed: 0.1,
    sourceLayer: "",
    targetLayer: "",
  };
  