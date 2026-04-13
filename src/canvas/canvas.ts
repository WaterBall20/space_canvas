import { AnimationValue } from "../animation/value";
import type { MapData, UIPos } from "../data/mapData";

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
        mod: 0,
        tempValue: true,
        event: false,
        eventTime: 0,
    };
    canvas: HTMLCanvasElement | undefined;

    /**
     * 自动缩放
     */
    public autoZoonFun(mapData: MapData) {
        //迭代所有重置最值
        let minX = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        //显示用
        let dMinX;
        let dMaxX;
        let dMinY;
        let dMaxY;
        let type;
        let count = 0; //计算次数

        function minMaxValue(pos: UIPos) {
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

        for (let pos of mapData.gameEntityList.value.values()) {
            minMaxValue(pos);
        }
        dMinX = minX;
        dMaxX = maxX;
        dMinY = minY;
        dMaxY = maxY;
        for (let posList of mapData.list.value.values()) {
            let i = 0;
            for (let pos of posList.list) {
                minMaxValue(pos);
                i++;
                //参考最后
                if (i == posList.list.length) {
                    if (pos.x.getEndValue() > dMaxX) {
                        dMaxX = pos.x.getEndValue();
                    }
                    if (pos.x.getEndValue() < dMinX) {
                        dMinX = pos.x.getEndValue();
                    }
                    if (pos.y.getEndValue() > dMaxY) {
                        dMaxY = pos.y.getEndValue();
                    }
                    if (pos.y.getEndValue() < dMinY) {
                        dMinY = pos.y.getEndValue();
                    }
                    type = pos.type;
                }
            }
        }
        //若自动缩放是总览
        if (this.autoZoon.mod == 0) {
            dMinX = minX;
            dMaxX = maxX;
            dMinY = minY;
            dMaxY = maxY;
        }
        if (count > 1) {
            mapData.x.max = maxX;
            mapData.x.min = minX;
            mapData.y.max = maxY;
            mapData.y.min = minY;
            //显示的地图宽度和高度
            let dMapW = dMaxX - dMinX;
            let dMapH = dMaxY - dMinY;
            //尝试设置更新最值
            if (dMapW || dMapH) {
                let c = this.canvas!;
                //宽度和高度缩放
                let wZoom = c.width / dMapW / 1.1;
                let hZoom = c.height / dMapH / 1.1;
                let zoon;
                //取最小缩放，以完全显示
                if (wZoom < hZoom) {
                    zoon = wZoom;
                } else {
                    zoon = hZoom;
                }
                if (zoon > maxZoon) zoon = maxZoon;
                this.zoom.setEndValue(this.time, zoon);
            } else {
                if (type == "") {
                    this.zoom.setEndValue(this.time, maxZoon);
                } else {
                    this.zoom.setEndValue(this.time, 100);
                }
            }
            //自动居中
            this.position.x.setEndValue(this.time, dMinX + (dMaxX - dMinX) / 2);
            this.position.y.setEndValue(this.time, dMinY + (dMaxY - dMinY) / 2);
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

        return { x, y };
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

        return { x, y };
    }
}
