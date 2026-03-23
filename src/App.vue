<script setup lang="ts">
import { devtools, onMounted, ref } from "vue";
import { startRenderLoop } from "./canvas/renderer";
const canvasRef = ref<HTMLCanvasElement | null>(null);

//import HelloWorld from './components/HelloWorld.vue'
onMounted(() => {
    const canvas = canvasRef.value!;
    const ctx = canvas.getContext("2d")!;
    function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width; // * dpr;
        canvas.height = rect.height; // * dpr;

        //ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        console.debug("canvas-width", canvas.width);
        console.debug("canvas-height", canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);
    console.log("页面加载完成");
    startRenderLoop((time) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
    });
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
    height: 100vh; /* 关键：必须有高度 */
}

canvas {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
