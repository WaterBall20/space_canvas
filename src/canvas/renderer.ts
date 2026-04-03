import type {MapData, PosData} from "../data/mapData";
import type {Camera} from "./canvas";

export function startRenderLoop(render: (time: number) => void) {
    function loop(time: number) {
        render(time);
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}

let lastTime = 0;

/**
 * 渲染方法
 * @param time 当前动画时间
 * @param canvas 画布
 * @param ctx 绘制类
 * @param camera 相机参数
 * @param mousePos 鼠标坐标
 * @param mapData 地图数据
 */
export function render(
    time: number,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    mousePos: { x: number; y: number },
    mapData: MapData,
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
        color: string | undefined = undefined,
    ) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);

        ctx.lineWidth = width;
        if (color) ctx.strokeStyle = color;
        ctx.stroke();
    }

    /**
     * 绘制文本
     * @param value 内容
     * @param x 画布坐标X
     * @param y 画布坐标Y
     * @param lineHeight 行高
     * @param color 颜色
     */
    function drawText(
        value: string,
        x: number,
        y: number,
        lineHeight: number,
        color: string | undefined,
    ) {
        if (color) {
            ctx.fillStyle = color;
        }
        let lines = value.split("\n");
        lines.forEach((line, index) => {
            //对其
            switch (ctx.textBaseline) {
                case "top":
                    ctx.fillText(line, x, y + index * lineHeight);
                    break;
                case "bottom":
                    ctx.fillText(line, x, y - (lines.length - 1 - index) * lineHeight);
                    break;
                default:
                    ctx.fillText("警告：使用暂不支持的对其方式", x, y);
            }
        });
    }

    //
    let thisListTime = time - lastTime;
    lastTime = time;
    camera.time = time;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //线大小
    let s = 1;
    //画布起始世界坐标
    let canvasStartPos = camera.canvasPosToMapPos(canvas, 0, 0, time);
    //画布结束世界坐标
    let canvasEndPos = camera.canvasPosToMapPos(
        canvas,
        canvas.width,
        canvas.height,
        time,
    );
    //世界坐标差
    let cESP = {
        x: canvasEndPos.x - canvasStartPos.x,
        y: canvasEndPos.y - canvasStartPos.y,
    };
    //网格间距
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

    //名称到颜色
    function nameToColor(name: string): string {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i);
            hash |= 0;
        }

        const hue = Math.abs(hash) % 360;

        //饱和度
        const saturation = 60;
        //亮度
        const lightness = 55;

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }


    //相机参数更新
    if (camera.autoZoon.event) {
        camera.autoZoon.eventTime = time;
        camera.autoZoon.tempValue = false;
    }
    //自动缩放恢复
    if (camera.autoZoon.tempValue != camera.autoZoon.value && time - camera.autoZoon.eventTime > 5_000) {
        camera.autoZoon.tempValue = camera.autoZoon.value;
    }

    //绘制标线和文本
    let fontS = 16 * camera.dpr; //字体大小,根据dpr自动缩放，实现各设备接近
    ctx.font = `${fontS}px sans-serif`;

    function drawGrid() {
        //经度
        ctx.textAlign = "center";
        let xLineCount = Math.round(cESP.x / cgs + 1);
        for (let i = 0; i < xLineCount; i++) {
            let posX = Math.round(canvasStartPos.x / cgs + i) * cgs;
            let cPos = camera.mapPosToCanvasPos(canvas, posX, 0);
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
            let cPos = camera.mapPosToCanvasPos(canvas, 0, posY);
            drawLine(0, cPos.y, canvas.width, cPos.y, s, (ctx.fillStyle = "#0a0"));
            ctx.textAlign = "left";
            ctx.fillText(fixFloat(posY).toString(), 5, cPos.y);
            ctx.textAlign = "right";
            ctx.fillText(fixFloat(posY).toString(), canvas.width, cPos.y);
        }
    }

    drawGrid();
    //鼠标十字线
    ctx.fillStyle = "#f8c";
    ctx.textAlign = "center";
    let mouseMapPos = camera.canvasPosToMapPos(canvas, mousePos.x, mousePos.y);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(mouseMapPos.x.toString(), mousePos.x, fontS + 5);
    drawLine(mousePos.x, 0, mousePos.x, canvas.height, 1, ctx.fillStyle);
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(mouseMapPos.y.toString(), 5, mousePos.y);
    drawLine(5, mousePos.y, canvas.width, mousePos.y, 1, ctx.fillStyle);

    let rs = 5;
    //迭代渲染
    for (let posList of mapData.list.value.values()) {
        for (let i = 0; i < posList.list.length; i++) {
            let posData = posList.list[i];
            let cPos = camera.mapPosToCanvasPos(canvas, posData.x, posData.y);
            //可视检查
            let cPosIsDraw =
                cPos.x + rs > 0 &&
                cPos.x - rs < canvas.width &&
                cPos.y + rs &&
                cPos.y - rs < canvas.height;
            cPosIsDraw = true;//Debug
            if (cPosIsDraw) {
                let color = nameToColor(posData.name)
                drawPoint(cPos.x, cPos.y, rs, color);
                //最后一个附加文本和坐标线
                if (i + 1 == posList.list.length) {
                    ctx.textAlign = "center";
                    ctx.textBaseline = "top";
                    let text = `(${posData.x}, ${posData.y})`;
                    if (posData.name) {
                        text = posData.name + "\n" + text;
                    }
                    drawText(text, cPos.x, cPos.y, fontS, color);
                    //绘制坐标线
                    drawLine(
                        cPos.x,
                        0,
                        cPos.x,
                        canvas.height,
                        1,
                        nameToColor(posList.name),
                    );
                    drawLine(0, cPos.y, canvas.width, cPos.y, 1, nameToColor(posList.name));
                }
            }
            if (i > 0) {
                let lastPos: PosData = posList.list[i - 1];
                let cLastPos = camera.mapPosToCanvasPos(
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
                    drawLine(
                        cPos.x,
                        cPos.y,
                        cLastPos.x,
                        cLastPos.y,
                        rs,
                        nameToColor(posList.name),
                    );
                }
            }
        }
    }
    //游戏实体渲染
    for (let posData of mapData.gameEntityList.value.values()) {
        let cPos = camera.mapPosToCanvasPos(canvas, posData.x.getValue(time), posData.y.getValue(time));
        let cPosIsDraw =
            cPos.x + rs > 0 &&
            cPos.x - rs < canvas.width &&
            cPos.y + rs &&
            cPos.y - rs < canvas.height;
        if (cPosIsDraw) {
            let color = nameToColor(posData.name)
            drawPoint(cPos.x, cPos.y, rs, color);
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            let text = ""; // = `(${posData.x}, ${posData.y})`;
            if (posData.name) {
                text = posData.name + "\n" + text;
            }
            drawText(text, cPos.x, cPos.y + rs * 2, fontS, color);
        }
    }
    //debug信息
        let debug = false;
    if (debug) {
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        let timeFPS = 1000 / thisListTime;
        drawText(
            `debug:
        time: 
            this: ${time}ms
            this - lastTime: ${thisListTime}ms
            timeFPS: ${Math.round(timeFPS)}/s | ${timeFPS}/s
        camera: 
            position:
                x: 
                    thisValue: ${camera.position.x.getValue(time)}
                    endValue: ${camera.position.x.getEndValue()}
                y: 
                    thisValue: ${camera.position.y.getValue(time)}
                    endValue: ${camera.position.y.getEndValue()}
            zoom: 
                thisValue: ${camera.zoom.getValue(time)}
                endValue: ${camera.zoom.getEndValue()}
            autoZoom: 
                value: ${camera.autoZoon.value}
                event: ${camera.autoZoon.event}
                tempValue: ${camera.autoZoon.tempValue}
                eventTime: ${camera.autoZoon.eventTime}ms
            dpr: ${camera.dpr}
            `,
            0,
            canvas.height,
            fontS,
            "#888"
        )
    }
    //wsClient.send("renderEnd");
}
