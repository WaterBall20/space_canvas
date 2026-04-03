import {DecelerateInterpolator, type Interpolator,} from "./Interpolator";

export class AnimationValue {
    private startValue = 0;
    private endValue = 0;
    private time = 1000;
    private startTime = 0;
    private interpolator: Interpolator = new DecelerateInterpolator();

    constructor() {
    }

    public setTime(thisTime: number, value: number): AnimationValue {
        if (this.time != value) {
            this.startValue = this.getValue(thisTime);
            this.startTime = thisTime;
            this.time = value;
        }
        return this
    }

    public setInterpolator(value: Interpolator): AnimationValue {
        this.interpolator = value;
        return this;
    }

    public setEndValue(time: number, value: number): AnimationValue {
        if (value != this.endValue) {
            this.startValue = this.getValue(time);
            this.endValue = value;
            this.startTime = time;
        }
        return this;
    }

    public getEndValue(): number {
        return this.endValue;
    }

    public getValue(time: number): number {
        //估值
        let endTime = this.startTime + this.time;
        let t = 0;
        if (time > endTime) {
            t = 1;
        } else {
            t = (time - this.startTime) / this.time;
        }
        let tV = this.interpolator.getValue(t);
        return this.startValue + (this.endValue - this.startValue) * tV;
    }

    public toEndValue(): AnimationValue {
        this.startTime -= this.time;
        return this;
    }
}
