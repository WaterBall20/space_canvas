<script setup lang="ts">
import { onMounted, ref } from "vue";
import { startRenderLoop } from "./canvas/renderer";
import { WSClient, type PlayerData as PosData } from "./api/websocketClient";
import { AnimationValue } from "./animation/value";
const canvasRef = ref<HTMLCanvasElement | null>(null);

//import HelloWorld from './components/HelloWorld.vue'
//相机参数
const camera = {
    time: 0,
    position: {
        x: new AnimationValue(),
        y: new AnimationValue(),
    },
    zoom: new AnimationValue(),
    dpr: 1,
};

const maxZoon = 111320; //
let autoZoon = true;

//鼠标点
const mousePos = {
    x: 0,
    y: 0,
};

//地图数据统计
const mapData = {
    x: {
        min: 0,
        max: 0,
    },
    y: {
        min: 0,
        max: 0,
    },
};

const wsClient = new WSClient("ws://192.168.43.85:4101"); // 服务端地址

wsClient.onMessage((pos: PosData) => {
    if (!posArr.length) {
        //初始化统计
        mapData.x.max = mapData.x.min = pos.x;
        mapData.y.max = mapData.y.min = pos.y;
    } else {
        //判断并更新地图统计数据
        if (pos.x > mapData.x.max) {
            mapData.x.max = pos.x;
        } else if (pos.x < mapData.x.min) {
            mapData.x.min = pos.x;
        }
        if (pos.y > mapData.y.max) {
            mapData.y.max = pos.y;
        } else if (pos.y < mapData.y.min) {
            mapData.y.min = pos.y;
        }
        //自动缩放
        if (autoZoon) {
            //自动居中
            autoZoonFun();
            camera.position.x.setEndValue(
                camera.time,
                mapData.x.min + (mapData.x.max - mapData.x.min) / 2,
            );
            camera.position.y.setEndValue(
                camera.time,
                mapData.y.min + (mapData.y.max - mapData.y.min) / 2,
            );
        }
    }
    posArr.push(pos);
});

/**
 * 自动缩放
 */
function autoZoonFun() {
    if (posArr.length > 1) {
        //地图有效宽度和高度
        let mapW = mapData.x.max - mapData.x.min;
        let mapH = mapData.y.max - mapData.y.min;
        let c = canvasRef.value!;
        //宽度和高度的缩放
        let wZoon = c.width / mapW / 1.1;
        let hZoon = c.height / mapH / 1.1;
        let zoon;
        //取最小缩放，以完全显示
        if (wZoon < hZoon) {
            zoon = wZoon;
        } else {
            zoon = hZoon;
        }
        camera.zoom.setEndValue(camera.time, zoon);
    }
}

const posArr = new Array();

/**
 * 从地图坐标到画布坐标
 * @param time 当前动画时间
 * @param canvas 画布
 * @param in_x 地图坐标X
 * @param in_y 地图坐标Y
 */
function mapPosToCanvasPos(
    time: number,
    canvas: HTMLCanvasElement,
    in_x: number,
    in_y: number,
) {
    //点与相机坐标之差
    let cx = in_x - camera.position.x.getValue(time);
    let cy = in_y - camera.position.y.getValue(time);
    //缩放处理
    let zoom = camera.zoom.getValue(time);
    let cxZoom = cx * zoom;
    let cyZoom = cy * zoom;

    //居中转换
    let x = canvas.width / 2 + cxZoom;
    let y = canvas.height / 2 + cyZoom;

    return { x, y };
}

/**
 * 从画布坐标转换到地图坐标
 * @param time 当前动画时间
 * @param canvas 画布
 * @param in_x 画布坐标X
 * @param in_y 画布坐标Y
 */
function canvasPosToMapPos(
    time: number,
    canvas: HTMLCanvasElement,
    in_x: number,
    in_y: number,
) {
    //点与画布中心坐标之差
    let cx = in_x - canvas.width / 2;
    let cy = in_y - canvas.height / 2;

    //缩放还原
    let zoom = camera.zoom.getValue(time);
    let cxNoZoom = cx / zoom;
    let cyNoZoom = cy / zoom;

    //居中还原
    let x = camera.position.x.getValue(time) + cxNoZoom;
    let y = camera.position.y.getValue(time) + cyNoZoom;

    return { x, y };
}

/**
 * 渲染方法
 * @param time 当前动画时间
 * @param canvas 画布
 * @param ctx 绘制类
 */
function render(
    time: number,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
) {
    /**
     * 绘制圆点
     * @param x 画布坐标X
     * @param y 画布坐标Y
     * @param radius 半径
     * @param color 颜色
     */
    function drawPoint(x: number, y: number, radius: number, color: string) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    /**
     * 绘制直线
     * @param sx 起始画布坐标X
     * @param sy 起始画布坐标Y
     * @param ex 结束画布坐标X
     * @param ey 结束画布坐标Y
     * @param width 粗细度
     * @param color 颜色
     */
    function drawLine(
        sx: number,
        sy: number,
        ex: number,
        ey: number,
        width: number,
        color: string,
    ) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);

        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    //
    camera.time = time;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //绘制标线和文本
    ctx.font = "24px sans-serif";
    //线大小
    let s = 1;
    //
    let canvasStartPos = canvasPosToMapPos(time, canvas, 0, 0);
    let canvasEndPos = canvasPosToMapPos(
        time,
        canvas,
        canvas.width,
        canvas.height,
    );
    let cESP = {
        x: canvasEndPos.x - canvasStartPos.x,
        y: canvasEndPos.y - canvasStartPos.y,
    };
    let cgs = calcGridSpacing(
        canvasStartPos.x,
        canvasEndPos.x,
        canvasStartPos.y,
        canvasEndPos.y,
    );

    /**
     * 计算网格间距（自动密度 + 对齐）
     * @param worldMinX 当前视口最小X（世界坐标）
     * @param worldMaxX 当前视口最大X
     * @param worldMinY 当前视口最小Y
     * @param worldMaxY 当前视口最大Y
     * @param targetLines 期望网格线数量（建议 8~20）
     */
    function calcGridSpacing(
        worldMinX: number,
        worldMaxX: number,
        worldMinY: number,
        worldMaxY: number,
        targetLines: number = 12,
    ): number {
        const rangeX = Math.abs(worldMaxX - worldMinX);
        const rangeY = Math.abs(worldMaxY - worldMinY);
        // 使用较大范围保证 X/Y 一致比例
        const range = Math.max(rangeX, rangeY);
        if (range === 0) return 1;
        // 理想间距
        const rawStep = range / targetLines;
        // 计算数量级（10^n）
        const exponent = Math.floor(Math.log10(rawStep));
        const base = Math.pow(10, exponent);
        // 归一化到 [1,10)
        const normalized = rawStep / base;
        // 吸附到 1 / 2 / 5
        let nice;
        if (normalized < 1.5) {
            nice = 1;
        } else if (normalized < 3) {
            nice = 2;
        } else if (normalized < 7) {
            nice = 5;
        } else {
            nice = 10;
        }
        const spacing = nice * base;
        return fixFloat(spacing);
    }
    /**
     * 修正浮点误差，保证 0.1 / 0.01 这种精度稳定
     */
    function fixFloat(value: number): number {
        const precision = 12; // 防止 0.30000000004
        return parseFloat(value.toFixed(precision));
    }
    //经度
    ctx.textAlign = "center";
    let xLineCount = Math.round(cESP.x / cgs + 1);
    for (let i = 0; i < xLineCount; i++) {
        let posX = Math.round(canvasStartPos.x / cgs + i) * cgs;
        let cPos = mapPosToCanvasPos(time, canvas, posX, 0);
        drawLine(cPos.x, 0, cPos.x, canvas.height, s, (ctx.fillStyle = "#f80"));
        ctx.textBaseline = "top";
        ctx.fillText(fixFloat(posX).toString(), cPos.x, 5);
        ctx.textBaseline = "bottom";
        ctx.fillText(fixFloat(posX).toString(), cPos.x, canvas.height - 5);
    }
    //纬度
    ctx.textBaseline = "middle";
    let yLineCount = Math.round(cESP.y / cgs + 1);
    for (let i = 0; i < yLineCount; i++) {
        let posY = Math.round(canvasStartPos.y / cgs + i) * cgs;
        let cPos = mapPosToCanvasPos(time, canvas, 0, posY);
        drawLine(0, cPos.y, canvas.width, cPos.y, s, (ctx.fillStyle = "#0a0"));
        ctx.textAlign = "left";
        ctx.fillText(fixFloat(posY).toString(), 5, cPos.y);
        ctx.textAlign = "right";
        ctx.fillText(fixFloat(posY).toString(), canvas.width, cPos.y);
    }
    //鼠标测试
    ctx.fillStyle = "#f8a";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    let mousePosW = canvasPosToMapPos(time, canvas, mousePos.x, mousePos.y);
    ctx.fillText(`x=${mousePosW.x} y=${mousePosW.y}`, mousePos.x, mousePos.y);

    let rs = 5;
    for (let i = 0; i < posArr.length; i++) {
        let pos: PosData = posArr[i];
        let cPos = mapPosToCanvasPos(time, canvas, pos.x, pos.y);
        let cPosIsDraw =
            cPos.x + rs > 0 &&
            cPos.x - rs < canvas.width &&
            cPos.y + rs &&
            cPos.y - rs < canvas.height;
        if (cPosIsDraw) {
            drawPoint(cPos.x, cPos.y, rs, "red");
        }
        if (i > 0) {
            let lastPos: PosData = posArr[i - 1];
            let cLastPos = mapPosToCanvasPos(
                time,
                canvas,
                lastPos.x,
                lastPos.y,
            );
            if (
                cPosIsDraw ||
                (cLastPos.x + rs > 0 &&
                    cLastPos.x - rs < canvas.width &&
                    cLastPos.y + rs &&
                    cLastPos.y - rs < canvas.height)
            ) {
                drawLine(cPos.x, cPos.y, cLastPos.x, cLastPos.y, rs, "red");
            }
        }
    }
}

//事件监听函数
//正在按下
let isPointerDown = false;
///按下
function handlePointerDown(x: number, y: number) {
    isPointerDown = true;
    //console.debug("onMuseDown", e);
    mousePos.x = x;
    mousePos.y = y;
}
//移动
function handlePointerMove(x: number, y: number) {
    //console.debug("onMouseMove", e);
    if (isPointerDown) {
        //console.debug("isMouseDown", "onMouseMove", e);
        let thisLastX = x - mousePos.x;
        let thisLastY = y - mousePos.y;
        //console.debug("this-last_x", thisLastX);
        //console.debug("this-last_y", thisLastY);
        //更改坐标
        camera.position.x
            .setEndValue(
                camera.time,
                camera.position.x.getEndValue() -
                    thisLastX / camera.zoom.getEndValue(),
            )
            .toEndValue();
        camera.position.y
            .setEndValue(
                camera.time,
                camera.position.y.getEndValue() -
                    thisLastY / camera.zoom.getEndValue(),
            )
            .toEndValue();
        //console.debug("camera", camera);
    }
    //更新
    mousePos.x = x;
    mousePos.y = y;
}
//松开
function handlePointerUp() {
    isPointerDown = false;
}
//滚轮
function onWheel(e: WheelEvent) {
    let canvas = canvasRef.value!;
    //立刻目标值
    let mousePos = canvasPosToMapPos(
        camera.time,
        canvas,
        e.x * camera.dpr,
        e.y * camera.dpr,
    );
    //缩放处理
    let scale = 1.1;
    if (e.deltaY < 0) {
        let newZoom = camera.zoom.getEndValue() * scale;
        if (newZoom > maxZoon) {
            newZoom = maxZoon;
        }
        camera.zoom.setEndValue(camera.time, newZoom).toEndValue();
    } else {
        camera.zoom
            .setEndValue(camera.time, camera.zoom.getEndValue() / scale)
            .toEndValue();
    }

    //
    let newMousePos = canvasPosToMapPos(
        camera.time,
        canvas,
        e.x * camera.dpr,
        e.y * camera.dpr,
    );
    //计算世界坐标差
    let nOCaPosX = mousePos.x - newMousePos.x;
    let nOCaPosY = mousePos.y - newMousePos.y;
    camera.position.x
        .setEndValue(camera.time, camera.position.x.getEndValue() + nOCaPosX)
        .toEndValue();
    camera.position.y
        .setEndValue(camera.time, camera.position.y.getEndValue() + nOCaPosY)
        .toEndValue();
}

onMounted(() => {
    const canvas = canvasRef.value!;
    const ctx = canvas.getContext("2d")!;
    function resize() {
        const rect = canvas.getBoundingClientRect();
        //屏幕缩放
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        camera.dpr = dpr;
        //ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        console.debug("canvas-width", canvas.width);
        console.debug("canvas-height", canvas.height);

        autoZoonFun();
    }
    function init() {
        camera.position.x.setTime(0, 500);
        camera.position.y.setTime(0, 500);
        camera.zoom.setTime(0, 500);
        resize();
        //适应性放大
        camera.zoom.setEndValue(250, maxZoon / 10);
        //事件
        //大小改变
        window.addEventListener("resize", resize);
        // 鼠标
        // 移动
        window.addEventListener("mousemove", (e) => {
            handlePointerMove(e.x * camera.dpr, e.y * camera.dpr);
        });
        //按下
        window.addEventListener("mousedown", (e) => {
            handlePointerDown(e.x * camera.dpr, e.y * camera.dpr);
        });
        //抬起
        window.addEventListener("mouseup", handlePointerUp);
        //滚轮
        window.addEventListener("wheel", onWheel);

        //触控
        let lastTouchPos = new Array();
        //按下
        window.addEventListener(
            "touchstart",
            (e) => {
                e.preventDefault();
                for (let i = 0; e.touches.length; ++i) {
                    let touch = e.touches[i];
                    if (i == 0) {
                        handlePointerDown(
                            touch.clientX * camera.dpr,
                            touch.clientY * camera.dpr,
                        );
                    }
                    lastTouchPos[i] = {
                        x: touch.clientX,
                        y: touch.clientY,
                    };
                }
            },
            { passive: false },
        );
        //移动
        window.addEventListener(
            "touchmove",
            (e) => {
                e.preventDefault();
                for (let i = 0; e.touches.length; ++i) {
                    let touch = e.touches[i];
                    if (i == 0) {
                        handlePointerMove(
                            touch.clientX * camera.dpr,
                            touch.clientY * camera.dpr,
                        );
                    }

                    //
                    lastTouchPos[i] = {
                        x: touch.clientX,
                        y: touch.clientY,
                    };
                }
            },
            { passive: false },
        );
        //松开
        window.addEventListener(
            "touchend",
            (e) => {
                e.preventDefault();
                if (e.touches.length == 0) {
                    handlePointerUp();
                }
            },
            { passive: false },
        );
    }
    init();
    console.log("页面加载完成");
    //启动渲染
    startRenderLoop((time) => render(time, canvas, ctx));
});
</script>

<template>
    <div class="container">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<style>
.container {
    width: 100vw;
    height: 100vh;
}

canvas {
    width: 100%;
    height: 100%;
    display: flex;
}
</style>
