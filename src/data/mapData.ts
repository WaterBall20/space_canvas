import type {Camera} from "../canvas/canvas";
import {AnimationValue} from "../animation/value.ts";

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

export interface EntityUIPos {
    type: string;
    name: string;
    x: AnimationValue;
    y: AnimationValue;
    z: AnimationValue;
    time: number;
    yaw: AnimationValue;
    pitch: AnimationValue;
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
        value: new Map<string, EntityUIPos>(),
    };

    constructor() {
    }

    public updatePos(posList: Array<PosData>, camera: Camera) {
        let newGameEntityList = new Map<string, EntityUIPos>();
        for (let pos of posList) {
            let posList = this.list.value.get(pos.uuid);
            if (!posList) {
                //游戏实体特殊处理
                if (pos.type != "living" && pos.type != "entity") {
                    posList = {
                        list: [],
                        type: pos.type,
                        name: pos.name
                    };
                    this.list.value.set(pos.uuid, posList);
                    this.list.len++;
                }
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
                let listItem = this.gameEntityList.value.get(pos.uuid);
                if (!listItem) {
                    listItem = {
                        type: pos.type,
                        name: pos.name,
                        x: new AnimationValue(),
                        y: new AnimationValue(),
                        z: new AnimationValue(),
                        time: pos.time,
                        yaw: new AnimationValue(),
                        pitch: new AnimationValue()
                    }
                    listItem.x.setTime(camera.time, 500).setEndValue(0, pos.x).toEndValue()
                    listItem.y.setTime(camera.time, 500).setEndValue(0, pos.y).toEndValue()
                    listItem.z.setTime(camera.time, 500)
                    listItem.yaw.setTime(camera.time, 500)
                    listItem.pitch.setTime(camera.time, 500)
                }
                newGameEntityList.set(pos.uuid, listItem)
                listItem.x.setEndValue(camera.time, pos.x)
                listItem.y.setEndValue(camera.time, pos.y)
                listItem.z.setEndValue(camera.time, pos.z)
                if (pos.yaw) {
                    listItem.yaw.setEndValue(camera.time, pos.yaw)
                }
                if (pos.pitch) {
                    listItem.pitch.setEndValue(camera.time, pos.pitch)
                }
            }
        }
        this.gameEntityList.value = newGameEntityList;
        //自动缩放和居中
        if (camera.autoZoon.tempValue) {
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
    }
}

interface UIPosList {
    list: Array<PosData>;
    type: string;
    name: string
}
