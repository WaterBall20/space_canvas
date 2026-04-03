import {AnimationValue} from "../animation/value";
import type {MapData} from "../data/mapData";

//相机参数

export const maxZoon = 111_320;

export class Camera {
    time = 0;
    position = {
        x: new AnimationValue(),
        y: new AnimationValue(),
    };
    zoom = new AnimationValue();
    dpr = 1;
    autoZoon = {
        value: true,
        tempValue: true,
        event: false,
        eventTime: 0,
    };
    canvas: HTMLCanvasElement | undefined

    /**
     * 自动缩放
     */
    public autoZoonFun(mapData: MapData) {
        //迭代所有重置最值
        let minX = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        let count = 0; //计算次数

        for (let posList of mapData.list.value.values()) {
            for (let pos of posList.list) {
                if (pos.x > maxX) {
                    maxX = pos.x;
                }
                if (pos.x < minX) {
                    minX = pos.x;
                }
                if (pos.y > maxY) {
                    maxY = pos.y;
                }
                if (pos.y < minY) {
                    minY = pos.y;
                }
                count++;
            }
        }
        for (let pos of mapData.gameEntityList.value.values()) {
            if (pos.x.getEndValue() > maxX) {
                maxX = pos.x.getEndValue();
            }
            if (pos.x.getEndValue() < minX) {
                minX = pos.x.getEndValue();
            }
            if (pos.y.getEndValue() > maxY) {
                maxY = pos.y.getEndValue();
            }
            if (pos.y.getEndValue() < minY) {
                minY = pos.y.getEndValue();
            }
            count++;
        }
        if (count > 1) {
            mapData.x.max = maxX;
            mapData.x.min = minX;
            mapData.y.max = maxY;
            mapData.y.min = minY;
            //地图有效宽度和高度
            let mapW = mapData.x.max - mapData.x.min;
            let mapH = mapData.y.max - mapData.y.min;
            if (mapW || mapH) {
                let c = this.canvas!;
                //宽度和高度缩放
                let wZoon = c.width / mapW / 1.1;
                let hZoon = c.height / mapH / 1.1;
                let zoon;
                //取最小缩放，以完全显示
                if (wZoon < hZoon) {
                    zoon = wZoon;
                } else {
                    zoon = hZoon;
                }
                if (zoon > maxZoon) zoon = maxZoon;
                this.zoom.setEndValue(this.time, zoon);
            } else {
                this.zoom.setEndValue(this.time, maxZoon);
            }
        }
    }

    /**
     * 从地图坐标到画布坐标
     * @param time 当前动画时间
     * @param canvas 画布
     * @param in_x 地图坐标X
     * @param in_y 地图坐标Y
     */
    public mapPosToCanvasPos(
        canvas: HTMLCanvasElement,
        in_x: number,
        in_y: number,
        time: number = this.time,
    ) {
        //点与相机坐标之差
        let cx = in_x - this.position.x.getValue(time);
        let cy = in_y - this.position.y.getValue(time);
        //缩放处理
        let zoom = this.zoom.getValue(time);
        let cxZoom = cx * zoom;
        let cyZoom = cy * zoom;

        //居中转换
        let x = canvas.width / 2 + cxZoom;
        let y = canvas.height / 2 + cyZoom;

        return {x, y};
    }

    /**
     * 从画布坐标转换到地图坐标
     * @param time 当前动画时间
     * @param canvas 画布
     * @param in_x 画布坐标X
     * @param in_y 画布坐标Y
     */
    public canvasPosToMapPos(
        canvas: HTMLCanvasElement,
        in_x: number,
        in_y: number,
        time: number = this.time,
    ) {
        //点与画布中心坐标之差
        let cx = in_x - canvas.width / 2;
        let cy = in_y - canvas.height / 2;

        //缩放还原
        let zoom = this.zoom.getValue(time);
        let cxNoZoom = cx / zoom;
        let cyNoZoom = cy / zoom;

        //居中还原
        let x = this.position.x.getValue(time) + cxNoZoom;
        let y = this.position.y.getValue(time) + cyNoZoom;

        return {x, y};
    }
}
