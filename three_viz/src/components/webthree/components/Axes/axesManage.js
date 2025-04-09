import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

import * as THREE from 'three'

let cachedFont = null;

/**
 * 创建坐标轴系统
 * @param {THREE.Scene} scene - 场景对象
 * @param {THREE.FontLoader} loader - 字体加载器
 * @param {Object} options - 坐标系选项
 * @param {Object} options.origin - 起点坐标 {x, y, z}
 * @param {Object} options.end - 终点坐标 {x, y, z}
 * @param {number} options.axisLength - 坐标轴长度，仅在未指定end时使用
 * @param {boolean} options.showGrid - 是否显示网格线
 * @param {Object} options.axisColors - 轴线颜色 {x, y, z}
 */
function createAxes(scene, loader, options = {}) {
    // 提取配置或使用默认值
    const origin = options.origin || { x: -50, y: -50, z: -8 };
    const end = options.end || { x: 70, y: 30, z: 4 };
    const axisLength = options.axisLength || 120;
    const showGrid = options.showGrid !== undefined ? options.showGrid : true;
    const axisColors = options.axisColors || { x: 0xff0000, y: 0x00ff00, z: 0x0000ff };

    // xyz坐标轴
    const axesHelper = new THREE.AxesHelper(axisLength);
    axesHelper.position.set(origin.y, origin.z, origin.x); // 设置坐标轴位置
    axesHelper.updateMatrix(); // 更新位置
    axesHelper.matrixAutoUpdate = false; // 禁止矩阵变动
    scene.add(axesHelper);
    
    loader.load('/fonts/helvetiker_regular.typeface.json', function (font) {
        cachedFont = font;
        const texts = [
            { text: "X(m)", position: {x: -5 + origin.x, y: 2 + origin.z, z: 60 + end.y  }, rotation: { x: 0, y: Math.PI / 2, z: 0 } },
            { text: "Z(m) [-300,400]", position: { x: -10 + origin.x, y: 8 + end.z, z: 2 + origin.y }, rotation: { x: 0, y: Math.PI / 4, z: 0 } },
            { text: "Y(m)", position: {  x: -30 + end.x, y: 2 + origin.z, z: -5 + origin.y}, rotation: { x: 0, y: 0, z: 0 } },
        ];
    
        texts.forEach(({ text, position, rotation }) => {
            const textMesh = createTextMesh(text, position, rotation, font);
            scene.add(textMesh);
        });
    });

    if (showGrid) {
        chidu(origin.x, origin.y, origin.z, end.x, end.y, end.z, scene, loader);
    }
    
    return axesHelper; // 返回坐标轴对象，便于后续控制
}

/**
 * 创建指北针
 * @param {THREE.Scene} scene - 场景对象
 * @param {THREE.FontLoader} loader - 字体加载器
 * @param {Object} options - 指北针选项
 * @param {Object} options.position - 指北针位置 {x, y, z}
 * @param {number} options.size - 指北针大小
 * @param {number} options.rotation - 指北针旋转角度（弧度）
 * @param {string} options.text - 指北针文本，默认为"N"
 * @param {number} options.textColor - 文本颜色
 * @param {number} options.coneColor - 锥体颜色
 */
function createCompass(scene, loader, options = {}) {
    // 提取配置或使用默认值
    const position = options.position || { x: -80, y: 35, z: -20 };
    const size = options.size !== undefined ? options.size : 5;
    const rotation = options.rotation !== undefined ? options.rotation : 0;
    const text = options.text || "N";
    const textColor = options.textColor || 0x0000ff;
    const coneColor = options.coneColor || 0xffff00;
    const textOffset = options.textOffset || { x: 0, y: 15, z: 0 };

    loader.load('/fonts/helvetiker_regular.typeface.json', function (font) {
        const geometrytext = new TextGeometry(text, {
            font: font,
            size: size,
            height: size/2,
            depth: 1,
        });
        let materialstext1 = [
            new THREE.MeshPhongMaterial({ color: textColor, flatShading: true }), // front
            new THREE.MeshPhongMaterial({ color: 0xff0000 }) // side
        ];
        let textMesh = new THREE.Mesh(geometrytext, materialstext1);

        textMesh.position.set(position.y, position.z + textOffset.y, position.x);
        textMesh.updateMatrix(); //更新位置
        textMesh.matrixAutoUpdate = false; //禁止矩阵变动
        scene.add(textMesh);
    });

    const geometry = new THREE.ConeGeometry(size, size * 4, 3);
    const material = new THREE.MeshBasicMaterial({ color: coneColor });
    const cone = new THREE.Mesh(geometry, material);
    cone.position.x = position.y;
    cone.position.y = position.z;
    cone.position.z = position.x;
    cone.rotation.x = -Math.PI/2;
    cone.rotation.z = rotation;
    cone.updateMatrix();
    cone.matrixAutoUpdate = false;
    scene.add(cone);
    
    return { textMesh: null, cone }; // 返回指北针对象，便于后续控制
}

function zuobiaozhou(scene, loader, options = {}) {
    return createAxes(scene, loader, options);
}

function chidu(xmin, ymin, zmin, xmax, ymax, zmax ,scene,loader) {
    const createLine = (start, end, color = 0x808080) => {
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            start.x, start.y, start.z,
            end.x, end.y, end.z,
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const material = new THREE.LineBasicMaterial({ color });
        const line = new THREE.Line(geometry, material);
        line.matrixAutoUpdate = false;
        return line;
    };

    for (let i = 0, len = zmax - zmin; i <= len; i++) {
        if (i % 2 === 0) {
            const line = createLine(
                new THREE.Vector3(ymin, zmin, xmin),
                new THREE.Vector3(ymin, zmin, xmax)
            );
            line.position.y = i;
            line.updateMatrix();
            line.matrixAutoUpdate=false;
            scene.add(line);

            const number = i + zmin;
            const label = (number * 100).toString();
            textChinese(label, xmax + 4, ymin, number, 1, 0, 0, Math.PI / 2,loader,scene);
        }
    }

    // 绘制 XY 平面的线
    for (let iy = 0, len = (ymax - ymin) / 10; iy <= len; iy++) {
        const line = createLine(
            new THREE.Vector3(ymin, zmin, xmin),
            new THREE.Vector3(ymin, zmin, xmax)
        );
        line.position.x = iy * 10;
        line.updateMatrix();
        line.matrixAutoUpdate=false;

       scene.add(line);

        const number = iy * 10 + ymin;
        const label = ((number + Math.abs(ymin)) * 100).toString();
        if (iy !== 0) {
            textChinese(label, xmin, number, zmax + 3, 2, 0, 0, 0,loader,scene);
        }
    }

    // 绘制 XZ 面线
    for (let m = 0, len = (xmax - xmin) / 10; m <= len; m++) {
        const line = createLine(
            new THREE.Vector3(ymin, zmin, xmin),
            new THREE.Vector3(ymin, zmax, xmin)
        );
        line.position.z = m * 10;
        line.updateMatrix();
        scene.add(line);
    }

    // 绘制 YZ 平面线
    for (let m0 = 0, len = (ymax - ymin) / 10; m0 <= len; m0++) {
        const line = createLine(
            new THREE.Vector3(ymin, zmin, xmin),
            new THREE.Vector3(ymin, zmax, xmin)
        );
        line.position.x = m0 * 10;
        line.updateMatrix();
        scene.add(line);
    }

    // 绘制 YZ 平面标注
    for (let n = 0, len = zmax - zmin; n <= len; n++) {
        if (n % 2 === 0) {
            const line = createLine(
                new THREE.Vector3(ymin, zmin, xmin),
                new THREE.Vector3(ymax, zmin, xmin)
            );
            line.position.y = n;
            line.updateMatrix();
            scene.add(line);

            const number = n + zmin;
            const label = (number * 100).toString();
            textChinese(label, xmin, ymax + 2, number, 1, 0, 0, 0,loader,scene);
        }
    }

    // 绘制 XY 平面标注
    for (let n0 = 0, len = (xmax - xmin) / 10; n0 <= len; n0++) {
        const line = createLine(
            new THREE.Vector3(ymin, zmin, xmin),
            new THREE.Vector3(ymax, zmin, xmin)
        );
        line.position.z = n0 * 10;
        line.updateMatrix();
        scene.add(line);

        const number = n0 * 10 + xmin;
        const label = ((number + Math.abs(xmin)) * 100).toString();
        if (n0 !== 0) {
            textChinese(label, number, ymin, zmax + 3, 2, 0, 0, Math.PI / 2,loader,scene);
        }
    }
}

function textChinese(text,x,y,z,size,rotationx,rotationy,rotationz,loader,scene){
    loader.load("/fonts/helvetiker_regular.typeface.json", function ( font ) {

        const geometrytext = new TextGeometry( text, {
            font: font,
            size: size,
            height: size/2,
            depth: 1,
        } );
        let materialstext1 = [
            new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } ), // front
            new THREE.MeshPhongMaterial( { color: 0xffffff } ) // side
        ];
        let textMesh = new THREE.Mesh(geometrytext, materialstext1);

        textMesh.position.set(y, z, x)
        textMesh.rotation.x=rotationy;
        textMesh.rotation.y=rotationz;
        textMesh.rotation.z=rotationx;
        textMesh.updateMatrix();//更新位置
        textMesh.matrixAutoUpdate=false;//禁止矩阵变动
        scene.add(textMesh)
    } );
}

function createTextMesh(text, position, rotation, font, color = 0x464444) {
    const geometry = new TextGeometry(text, {
        font: font,
        size: 6,
        height: 1,
        depth: 1,
        curveSegments: 16,
        bevelEnabled: false,
        bevelThickness: 0.1,
        bevelSize: 0.3,
        bevelOffset: 0,
        bevelSegments: 10,
    });

    const material = new THREE.MeshPhongMaterial({ color, flatShading: true });

    const textMesh = new THREE.Mesh(geometry, material);

    textMesh.position.set(position.x, position.y, position.z);
    textMesh.rotation.set(rotation.x, rotation.y, rotation.z);

    textMesh.updateMatrix();
    textMesh.matrixAutoUpdate = false;

    return textMesh;
}

export {zuobiaozhou, createCompass, createAxes}