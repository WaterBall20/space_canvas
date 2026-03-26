import { AnimationValue } from "./value";

export class PointAnimation {
    private x = new AnimationValue();
    private y = new AnimationValue();
    private z = new AnimationValue();

    public setTime(thisTime: number, value: number): PointAnimation {
        this.x.setTime(thisTime, value);
        this.y.setTime(thisTime, value);
        this.z.setTime(thisTime, value);
        return this;
    }

    public setEndValue(
        time: number,
        x: number,
        y: number,
        z: number,
    ): PointAnimation {
        this.x.setEndValue(time, x);
        this.y.setEndValue(time, y);
        this.z.setEndValue(time, z);
        return this;
    }

    public toEndValue(): PointAnimation {
        this.x.toEndValue();
        this.y.toEndValue();
        this.z.toEndValue();
        return this;
    }
}
