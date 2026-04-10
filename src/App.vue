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
  pointerDown,
  pointerMove,
  wheel,
} from "./event/event.ts";

const mainMapCanvasRef = ref<HTMLCanvasElement | null>(null);
const sumZoomBtnRef = ref<HTMLButtonElement | null>(null);
const autoZoomBtnRef = ref<HTMLButtonElement | null>(null);
const addZoomBtnRef = ref<HTMLButtonElement | null>(null);
const zoomMod1 = ref<HTMLInputElement | null>(null);
const zoomMod2 = ref<HTMLInputElement | null>(null);

const mapData = new MapData();
const camera = new Camera();

const wsClient = new WSClient("ws://192.168.43.85:4101"); // 服务端地址

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
              handlePointerDown(camera, e.x * camera.dpr, e.y * camera.dpr)
            },
        );
        //抬起
        window.addEventListener("mouseup", () => {
          handlePointerUp(camera)
        });
        //滚轮
        window.addEventListener("wheel", (e) => {
          wheel(camera, canvas, e)
        }, {passive: false});
      }

      function windowTouch() {
        //按下
        window.addEventListener("touchstart", (e) => {
          pointerDown(camera, e)
        }, {
          passive: false,
        });
        //移动
        window.addEventListener(
            "touchmove",
            (e) => {
              e.preventDefault();
              pointerMove(camera, canvas, e)
            },
            {passive: false},
        );
        //松开
        window.addEventListener(
            "touchend",
            (e) => {
              if (e.touches.length == 0) {
                handlePointerUp(camera);
              }
            },
            {passive: false},
        );
      }

      function setAutoZoom() {
        camera.autoZoon.value = !camera.autoZoon.value;
        camera.autoZoon.tempValue = camera.autoZoon.value;
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
        camera.zoom.setEndValue(camera.time, zoom)
      }

      sumZoomBtnRef.value!.addEventListener("click", (e) => {
        e.stopPropagation();
        setZoom(false)
      })
      //自动缩放
      autoZoomBtnRef.value!.addEventListener("click", (e) => {
        e.stopPropagation();
        setAutoZoom()
      })
      //放大缩放
      addZoomBtnRef.value!.addEventListener("click", (e) => {
        e.stopPropagation()
        setZoom(true)
      })
    }

    resize();
    event()
    camera.canvas = canvas;
    //适应性放大
    camera.zoom.setEndValue(250, maxZoon / 10);
  }

  init();
  console.log("页面加载完成");
  //启动渲染
  startRenderLoop((time) =>
      render(time, canvas, ctx, camera, mousePos, mapData, zoomMod1.value!, zoomMod2.value!),
  );
});
</script>

<template>
  <div class="container">
    <canvas id="mapCanvas" ref="mainMapCanvasRef"></canvas>
    <div id="UIDiv">
      <div id="UIDiv2">
        <div>
          自动缩放模式
          <input type="radio" name="zoomMod" ref="zoomMod1" checked>总览
          <input type="radio" name="zoomMod" ref="zoomMod2">跟踪
        </div>
        <button id="sumZoomButton" ref="sumZoomBtnRef">-</button>
        <button id="autoZoomButton" ref="autoZoomBtnRef" event-info="up" value="true">自动缩放(Z)</button>
        <button id="addZoomButton" ref="addZoomBtnRef">+</button>
      </div>
      <div id="lDiv">
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
  background-color: #8888;
}

#autoZoomButton[event-info="down"] {
  background-color: #080;
}

#autoZoomButton[value="true"] {
  color: #f8f;
}

button:hover {
  background-color: #080;
}

#UIDiv {
  display: flex;
  position: fixed;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  justify-content: flex-end;

}

#UIDiv2 {
  padding: 5px;
  align-content: flex-end;
}

#sumZoomButton {
  width: 30px;
  margin: 5px;
}

#addZoomButton {
  width: 30px;
  margin: 5px;
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
