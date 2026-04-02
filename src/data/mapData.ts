import type { Camera } from "../canvas/canvas";

// websocketClient.ts
export interface PosData {
    type: string;
    uuid: string;
    name: string;
    x: number;
    y: number;
    z: number;
    time: number;
    yaw?: number;
    pitch?: number;
}
//最大单实体显示列表数量
let aPosListMaxLen = 1000;

//地图数据

export class MapData {
    x = {
        min: -5,
        max: 5,
    };
    y = {
        min: -5,
        max: 5,
    };
    list = {
        value: new Map<string, UIPosList>(),
        len: 0,
    };
    gameEntityList = {
        value: new Map<string, PosData>(),
    };

    constructor() {}

    public updatePos(posList: Array<PosData>, camera: Camera) {
        this.gameEntityList.value = new Map();
        for (let pos of posList) {
            let posList = this.list.value.get(pos.uuid);
            if (!posList) {
                //游戏实体特殊处理
                if (pos.type != "living" && pos.type != "entity") {
                    posList = {
                        list: [],
                        type: pos.type,
                        //随机颜色
                        color: `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`,
                    };
                    this.list.value.set(pos.uuid, posList);
                    this.list.len++;
                }
            }

            //自动缩放和居中
            if (camera.autoZoon) {
                camera.autoZoonFun(this);
                //自动居中
                camera.position.x.setEndValue(
                    camera.time,
                    this.x.min + (this.x.max - this.x.min) / 2,
                );
                camera.position.y.setEndValue(
                    camera.time,
                    this.y.min + (this.y.max - this.y.min) / 2,
                );
            }
            if (posList) {
                //
                let endPos = posList.list[posList.list.length - 1];
                if (
                    endPos == undefined ||
                    endPos.name != pos.name ||
                    endPos.type != pos.type ||
                    endPos.x != pos.x ||
                    endPos.y != pos.y ||
                    endPos.z != pos.z ||
                    endPos.yaw != pos.yaw
                ) {
                    posList.list.push(pos);
                    if (posList.list.length > aPosListMaxLen) {
                        for (let i = 0; i < posList.list.length - 1; i++) {
                            posList.list[i] = posList.list[i + 1];
                        }
                        posList.list.pop();
                    }
                }
            } else {
                this.gameEntityList.value.set(pos.uuid, pos);
            }
        }
    }
}

interface UIPosList {
    list: Array<PosData>;
    type: string;
    color: string;
}
