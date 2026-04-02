<script setup lang="ts">
import { onMounted, ref } from "vue";
import { render, startRenderLoop } from "./canvas/renderer";
import { WSClient } from "./api/websocketClient";
import { MapData } from "./data/mapData.ts";
import { Camera, maxZoon } from "./canvas/canvas";
import {
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
    onWheel,
    TouchStart,
    TouchMove,
    mousePos,
} from "./event/event.ts";
const canvasRef = ref<HTMLCanvasElement | null>(null);
const mapData = new MapData();
const camera = new Camera();

const wsClient = new WSClient("ws://192.168.43.85:4101"); // 服务端地址

wsClient.onMessage((posList) => mapData.updatePos(posList, camera));

onMounted(() => {
    const canvas = canvasRef.value!;
    const ctx = canvas.getContext("2d")!;
    function resize() {
        const rect = canvas.getBoundingClientRect();
        const height = window.visualViewport?.height;
        //屏幕缩放
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        camera.dpr = dpr;
        //ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        console.debug("canvas-width", canvas.width);
        console.debug("canvas-height", canvas.height);

        camera.autoZoonFun(mapData);
    }
    function init() {
        resize();
        camera.position.x.setTime(0, 500);
        camera.position.y.setTime(0, 500);
        camera.zoom.setTime(0, 500);
        camera.canvas = canvas;
        //适应性放大
        camera.zoom.setEndValue(250, maxZoon / 10);
        //事件
        //大小改变
        window.addEventListener("resize", resize);
        // 鼠标
        // 移动
        window.addEventListener("mousemove", (e) =>
            handlePointerMove(camera, e.x * camera.dpr, e.y * camera.dpr),
        );
        //按下
        window.addEventListener("mousedown", (e) =>
            handlePointerDown(e.x * camera.dpr, e.y * camera.dpr),
        );
        //抬起
        window.addEventListener("mouseup", handlePointerUp);
        //滚轮
        window.addEventListener("wheel", (e) => onWheel(camera, canvas, e));

        //按下
        window.addEventListener("touchstart", (e) => TouchStart(camera, e), {
            passive: false,
        });
        //移动
        window.addEventListener(
            "touchmove",
            (e) => TouchMove(camera, canvas, e),
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
    startRenderLoop((time) =>
        render(time, canvas, ctx, camera, mousePos, mapData, wsClient),
    );
});
</script>

<template>
    <div class="container">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<style>
.container {
    width: 100%;
    height: 100dvh;
}

canvas {
    width: 100%;
    height: 100%;
    display: flex;
}
</style>
