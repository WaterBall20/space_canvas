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
    yaw?: number;
    pitch?: number;
}

export interface UIPos {
    type: string;
    name: string;
    x: AnimationValue;
    y: AnimationValue;
    z: AnimationValue;
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
        value: new Map<string, UIPos>(),
    };

    constructor() {
    }

    public updatePos(posList: Array<PosData>, camera: Camera) {
        let newGameEntityList = new Map<string, UIPos>();
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
                let endPos = posList.list[posList.list.length - 1];
                //排除一致的
                if (
                    endPos == undefined ||
                    endPos.name != pos.name ||
                    endPos.type != pos.type ||
                    endPos.x.getEndValue() != pos.x ||
                    endPos.y.getEndValue() != pos.y ||
                    endPos.z.getEndValue() != pos.z ||
                    endPos.yaw.getEndValue() != pos.yaw
                ) {
                    //转换为动画坐标
                    let uiPos: UIPos = {
                        type: pos.type,
                        name: pos.name,
                        x: new AnimationValue(),
                        y: new AnimationValue(),
                        z: new AnimationValue(),
                        yaw: new AnimationValue(),
                        pitch: new AnimationValue(),
                    }
                    //动画处理
                    if (endPos) {
                        uiPos.x.setEndValue(0, endPos.x.getValue(camera.time)).toEndValue()
                        uiPos.y.setEndValue(0, endPos.y.getValue(camera.time)).toEndValue()
                        // uiPos.z.setEndValue(0, endPos.z.getValue(camera.time)).toEndValue()
                        // uiPos.yaw.setEndValue(0, endPos.yaw.getValue(camera.time)).toEndValue()
                        // uiPos.pitch.setEndValue(0, endPos.pitch.getValue(camera.time)).toEndValue()
                    }
                    uiPos.x.setEndValue(camera.time, pos.x);
                    uiPos.y.setEndValue(camera.time, pos.y);
                    // uiPos.z.setEndValue(camera.time, pos.z)
                    // if (pos.yaw) uiPos.yaw.setEndValue(camera.time, pos.yaw)
                    // if (pos.pitch) uiPos.pitch.setEndValue(camera.time, pos.pitch)
                    posList.list.push(uiPos);
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
                        yaw: new AnimationValue(),
                        pitch: new AnimationValue()
                    }
                    listItem.x.setEndValue(0, pos.x).toEndValue();
                    listItem.y.setEndValue(0, pos.y).toEndValue();
                    // listItem.z.setEndValue(0, pos.z).toEndValue();
                    // if (pos.yaw) listItem.yaw.setEndValue(0, pos.yaw).toEndValue();
                    // if (pos.pitch) listItem.pitch.setEndValue(0, pos.pitch).toEndValue();
                }
                newGameEntityList.set(pos.uuid, listItem)
                listItem.x.setEndValue(camera.time, pos.x)
                listItem.y.setEndValue(camera.time, pos.y)
                // listItem.z.setEndValue(camera.time, pos.z)
                // if (pos.yaw) listItem.yaw.setEndValue(camera.time, pos.yaw)
                // if (pos.pitch) listItem.pitch.setEndValue(camera.time, pos.pitch)

            }
        }
        this.gameEntityList.value = newGameEntityList;
        //自动缩放和居中
        if (camera.autoZoon.tempValue) {
            camera.autoZoonFun(this);
        }
    }
}

interface UIPosList {
    list: Array<UIPos>;
    type: string;
    name: string
}
