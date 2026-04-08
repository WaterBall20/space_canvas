<script setup lang="ts">
import {onMounted, ref} from "vue";
import {render, startRenderLoop} from "./canvas/renderer";
import {WSClient} from "./api/websocketClient";
import {MapData} from "./data/mapData.ts";
import {Camera, maxZoon} from "./canvas/canvas";
import {
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  mousePos,
  onWheel,
  TouchMove,
  TouchStart,
} from "./event/event.ts";

const mainMapCanvasRef = ref<HTMLCanvasElement | null>(null);
const autoZoomBtnRef = ref<HTMLButtonElement | null>(null);

const mapData = new MapData();
const camera = new Camera();

const wsClient = new WSClient("ws://localhost:4101"); // 服务端地址

wsClient.onMessage((posList) => mapData.updatePos(posList, camera));


onMounted(() => {
  const canvas = mainMapCanvasRef.value!;
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
              handlePointerMove(camera, e.x * camera.dpr, e.y * camera.dpr)
            },
        );
        //按下
        window.addEventListener("mousedown", (e) => {
              handlePointerDown(camera,e.x * camera.dpr, e.y * camera.dpr)
            },
        );
        //抬起
        window.addEventListener("mouseup", () => {
          handlePointerUp(camera)
        });
        //滚轮
        window.addEventListener("wheel", (e) => onWheel(camera, canvas, e));
      }

      function windowTouch() {
        //按下
        window.addEventListener("touchstart", (e) => {
          TouchStart(camera, e)
        }, {
          passive: false,
        });
        //移动
        window.addEventListener(
            "touchmove",
            (e) => {
              TouchMove(camera, canvas, e)
            },
            {passive: false},
        );
        //松开
        window.addEventListener(
            "touchend",
            (e) => {
              e.preventDefault();
              if (e.touches.length == 0) {
                handlePointerUp(camera);
              }
            },
            {passive: false},
        );
      }

      function setAutoZoom() {
        camera.autoZoon.value = !camera.autoZoon.value;
        autoZoomBtnRef.value!.setAttribute("value", camera.autoZoon.value.toString())
      }

      //键盘事件
      function windowKey() {
        //按下
        window.addEventListener("keydown", (e) => {
          console.debug("keydown", e)
          switch (e.key) {
            case "z":
              if (e.ctrlKey) {
                setAutoZoom()
              }
              break;
          }

        }, true)
        //抬起
        window.addEventListener("keyup", (e) => {
          console.debug("keyup", e)
        })
      }

      //大小改变
      window.addEventListener("resize", resize);
      windowMouse();
      windowTouch();

      windowKey();

      autoZoomBtnRef.value!.addEventListener("click", (e) => {
        e.stopPropagation();
        setAutoZoom()
      })
    }

    resize();
    event()
    camera.position.x.setTime(0, 500);
    camera.position.y.setTime(0, 500);
    camera.zoom.setTime(0, 500);
    camera.canvas = canvas;
    //适应性放大
    camera.zoom.setEndValue(250, maxZoon / 10);
  }

  init();
  console.log("页面加载完成");
  //启动渲染
  startRenderLoop((time) =>
      render(time, canvas, ctx, camera, mousePos, mapData),
  );
});
</script>

<template>
  <div class="container">
    <canvas id="mapCanvas" ref="mainMapCanvasRef"></canvas>
    <div id="div2">
      <div id="div3">
        <button id="autoZoomButton" ref="autoZoomBtnRef" event-info="up" value="true">自动缩放(Z)</button>
      </div>
    </div>
  </div>
</template>

<style>

button {
  all: unset;
  cursor: pointer;
  padding: 5px;
  border-radius: 8px;
  color: #f8f;
  background-color: #8888;
}

#autoZoomButton[event-info="down"] {
  background-color: #080;
}

#autoZoomButton[value="true"] {
  color: #f8f;
}

#autoZoomButton:hover {
  background-color: #080;
}

#div2 {
  display: flex;
  position: fixed;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
}

#div3 {
  padding: 5px;
  align-content: flex-end;
}

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
