import {type Camera, maxZoon} from "../canvas/canvas";
//鼠标点
export const mousePos = {
    x: 0,
    y: 0,
};

//事件监听函数
//正在按下
let isPointerDown = false;

///按下
export function handlePointerDown(camera: Camera,x: number, y: number) {
    camera.autoZoon.event = true;
    isPointerDown = true;
    mousePos.x = x;
    mousePos.y = y;
}

//移动
export function handlePointerMove(camera: Camera, x: number, y: number) {
    if (isPointerDown) {
        let thisLastX = x - mousePos.x;
        let thisLastY = y - mousePos.y;
        //更改坐标
        camera.position.x
            .setEndValue(
                camera.time,
                camera.position.x.getValue(camera.time) -
                thisLastX / camera.zoom.getValue(camera.time),
            )
            .toEndValue();
        camera.position.y
            .setEndValue(
                camera.time,
                camera.position.y.getValue(camera.time) -
                thisLastY / camera.zoom.getValue(camera.time),
            )
            .toEndValue();
    }
    //更新
    mousePos.x = x;
    mousePos.y = y;
}

//松开
export function handlePointerUp(camera: Camera) {
    camera.autoZoon.event = false;
    isPointerDown = false;
}

//滚轮
export function wheel(
    camera: Camera,
    canvas: HTMLCanvasElement,
    e: WheelEvent,
) {
    camera.autoZoon.tempValue = false;
    camera.autoZoon.eventTime = camera.time;
    //立刻目标值
    let mousePos = camera.canvasPosToMapPos(
        canvas,
        e.x * camera.dpr,
        e.y * camera.dpr,
    );
    //缩放处理
    let scale = 1.1;
    if (e.deltaY < 0) {
        let newZoom = camera.zoom.getValue(camera.time) * scale;
        if (newZoom > maxZoon) {
            newZoom = maxZoon;
        }
        camera.zoom.setEndValue(camera.time, newZoom).toEndValue();
    } else {
        camera.zoom
            .setEndValue(camera.time, camera.zoom.getValue(camera.time) / scale)
            .toEndValue();
    }

    //
    let newMousePos = camera.canvasPosToMapPos(
        canvas,
        e.x * camera.dpr,
        e.y * camera.dpr,
    );
    //计算世界坐标差
    let nOCaPosX = mousePos.x - newMousePos.x;
    let nOCaPosY = mousePos.y - newMousePos.y;
    camera.position.x
        .setEndValue(camera.time, camera.position.x.getValue(camera.time) + nOCaPosX)
        .toEndValue();
    camera.position.y
        .setEndValue(camera.time, camera.position.y.getValue(camera.time) + nOCaPosY)
        .toEndValue();
}

//触控
let lastTouchCPos = {
    x: 0,
    y: 0,
};
let lastTouchD = 0;
let lastTouchCount = 0;

function getTouchC(camera: Camera, e: TouchEvent) {
    let touch1 = e.touches[0];
    let touch2 = e.touches[1];
    let x1 = touch1.clientX;
    let y1 = touch1.clientY;
    let x2 = touch2.clientX;
    let y2 = touch2.clientY;
    let cx = Math.abs(x1 - x2) / 2;
    if (x1 < x2) {
        cx += x1;
    } else {
        cx += x2;
    }
    let cy = Math.abs(y2 - y1) / 2;
    if (y1 < y2) {
        cy += y1;
    } else {
        cy += y2;
    }
    return { x: cx * camera.dpr, y: cy * camera.dpr };
}

function getDistance(x1: number, y1: number, x2: number, y2: number) {
    let xx = x2 - x1;
    let yy = y2 - y1;
    if (xx == 0) {
        return yy;
    } else if (yy == 0) {
        return xx;
    }
    return Math.abs(Math.sqrt(xx * xx + yy * yy));
}

export function pointerDown(camera: Camera, e: TouchEvent) {
    if (e.touches.length == 1) {
        let touch = e.touches[0];
        handlePointerDown(
            camera,
            touch.clientX * camera.dpr,
            touch.clientY * camera.dpr,
        );
    } else {
        camera.autoZoon.event = true;
        let cPos = getTouchC(camera, e);
        lastTouchCPos = cPos;
        mousePos.x = cPos.x;
        mousePos.y = cPos.y;
        lastTouchD = getDistance(
            e.touches[0].clientX,
            e.touches[0].clientY,
            e.touches[1].clientX,
            e.touches[1].clientY,
        );
    }
    lastTouchCount = e.touches.length;
}

export function pointerMove(
    camera: Camera,
    canvas: HTMLCanvasElement,
    e: TouchEvent,
) {
    if (e.touches.length == 1) {
        let touch = e.touches[0];
        if (lastTouchCount > 1) {
            mousePos.x = touch.clientX * camera.dpr;
            mousePos.y = touch.clientY * camera.dpr;
        }
        handlePointerMove(
            camera,
            touch.clientX * camera.dpr,
            touch.clientY * camera.dpr,
        );
    } else {
        //移动
        camera.autoZoon.event = true;
        let cPos = getTouchC(camera, e);
        let xm = cPos.x - lastTouchCPos.x;
        let ym = cPos.y - lastTouchCPos.y;
        camera.position.x
            .setEndValue(
                camera.time,
                camera.position.x.getValue(camera.time) -
                xm / camera.zoom.getValue(camera.time),
            )
            .toEndValue();
        camera.position.y
            .setEndValue(
                camera.time,
                camera.position.y.getValue(camera.time) -
                ym / camera.zoom.getValue(camera.time),
            )
            .toEndValue();
        mousePos.x = cPos.x;
        mousePos.y = cPos.y;
        lastTouchCPos = cPos;
        //缩放
        let cMapPos = camera.canvasPosToMapPos(canvas, cPos.x, cPos.y);
        let touch1 = e.touches[0];
        let touch2 = e.touches[1];
        let x1 = touch1.clientX;
        let y1 = touch1.clientY;
        let x2 = touch2.clientX;
        let y2 = touch2.clientY;
        let d = getDistance(x1, y1, x2, y2);
        let dd = d / lastTouchD;
        camera.zoom
            .setEndValue(camera.time, camera.zoom.getValue(camera.time) * dd)
            .toEndValue();
        lastTouchD = d;
        let newCMapPos = camera.canvasPosToMapPos(canvas, cPos.x, cPos.y);
        camera.position.x
            .setEndValue(
                camera.time,
                camera.position.x.getValue(camera.time) + (cMapPos.x - newCMapPos.x),
            )
            .toEndValue();
        camera.position.y
            .setEndValue(
                camera.time,
                camera.position.y.getValue(camera.time) + (cMapPos.y - newCMapPos.y),
            )
            .toEndValue();
    }
    lastTouchCount = e.touches.length;
}

export function KeyDown() {

}

export function KeyUP() {

}
