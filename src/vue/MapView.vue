<script setup lang="ts">
import { onMounted, ref } from "vue";
import { render, startRenderLoop } from "../canvas/renderer.ts";
import { WSClient } from "../api/websocketClient.ts";
import { MapData } from "../data/mapData.ts";
import { Camera, maxZoon } from "../canvas/canvas.ts";
import {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    mousePos,
    pointerDown,
    pointerMove,
    wheel,
} from "../event/event.ts";
const props = defineProps({
    auto_zoon_mod: String,
});
let autoZoonMod = "FitBounds";

const mapCanvasRef = ref<HTMLCanvasElement | null>(null);

const mapData = new MapData();
const camera = new Camera();

const wsClient = new WSClient("ws://192.168.43.85:4101"); // 服务端地址

wsClient.onMessage((posList) => mapData.updatePos(posList, camera));

onMounted(() => {
    const canvas = mapCanvasRef.value!;
    const ctx = canvas.getContext("2d")!;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        //const height = window.visualViewport?.height;
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
        /**
         * 事件
         */
        function event() {
            function windowMouse() {
                // 移动
                window.addEventListener("mousemove", (e) => {
                    handlePointerMove(
                        camera,
                        e.x * camera.dpr,
                        e.y * camera.dpr,
                    );
                });
                //按下
                window.addEventListener("mousedown", (e) => {
                    handlePointerDown(
                        camera,
                        e.x * camera.dpr,
                        e.y * camera.dpr,
                    );
                });
                //抬起
                window.addEventListener("mouseup", () => {
                    handlePointerUp(camera);
                });
                //滚轮
                window.addEventListener(
                    "wheel",
                    (e) => {
                        wheel(camera, canvas, e);
                    },
                    { passive: false },
                );
            }

            function windowTouch() {
                //按下
                window.addEventListener(
                    "touchstart",
                    (e) => {
                        pointerDown(camera, e);
                    },
                    {
                        passive: false,
                    },
                );
                //移动
                window.addEventListener(
                    "touchmove",
                    (e) => {
                        e.preventDefault();
                        pointerMove(camera, canvas, e);
                    },
                    { passive: false },
                );
                //松开
                window.addEventListener(
                    "touchend",
                    (e) => {
                        if (e.touches.length == 0) {
                            handlePointerUp(camera);
                        }
                    },
                    { passive: false },
                );
            }

            function setAutoZoom() {
                camera.autoZoon.value = !camera.autoZoon.value;
                camera.autoZoon.tempValue = camera.autoZoon.value;
            }

            //键盘事件
            function windowKey() {
                //按下
                window.addEventListener(
                    "keydown",
                    (e) => {
                        console.debug("keydown", e);
                        switch (e.key) {
                            case "z":
                                if (e.ctrlKey) {
                                    setAutoZoom();
                                }
                                break;
                        }
                    },
                    true,
                );
                //抬起
                window.addEventListener("keyup", (e) => {
                    console.debug("keyup", e);
                });
            }

            //大小改变
            window.addEventListener("resize", resize);
            windowMouse();
            windowTouch();

            windowKey();

            //缩小缩放
            function setZoom(add: boolean) {
                if (camera.autoZoon.value) {
                    camera.autoZoon.tempValue = false;
                    camera.autoZoon.eventTime = camera.time;
                }
                let zoom;
                if (add) {
                    zoom = camera.zoom.getEndValue() * 1.5;
                } else {
                    zoom = camera.zoom.getEndValue() / 1.5;
                }
                if (zoom > maxZoon) {
                    zoom = maxZoon;
                }
                camera.zoom.setEndValue(camera.time, zoom);
            }

            /* sumZoomBtnRef.value!.addEventListener("click", (e) => {
                e.stopPropagation();
                setZoom(false);
            });
            //自动缩放
            autoZoomBtnRef.value!.addEventListener("click", (e) => {
                e.stopPropagation();
                setAutoZoom();
            });
            //放大缩放
            addZoomBtnRef.value!.addEventListener("click", (e) => {
                e.stopPropagation();
                setZoom(true);
            }); */
        }

        if (props.auto_zoon_mod) {
            autoZoonMod = props.auto_zoon_mod;
        }

        resize();
        event();
        camera.canvas = canvas;
        //适应性放大
        camera.zoom.setEndValue(250, maxZoon / 10);
    }

    init();
    console.log("页面加载完成");
    //启动渲染
    startRenderLoop((time) =>
        render(time, canvas, ctx, camera, mousePos, mapData, autoZoonMod),
    );
});
</script>

<template>
    <div class="container">
        <canvas id="mapCanvas" ref="mapCanvasRef"></canvas>
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
