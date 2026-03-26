export class Interpolator {
    private getValueFun: (t: number) => number;

    constructor(f: (t: number) => number) {
        this.getValueFun = f;
    }

    public getValue(t: number): number {
        return this.getValueFun(t);
    }
}

/**
 * An interpolator where the rate of change starts and ends slowly but
 * accelerates through the middle.
 * 两边慢 中间快
 */
export class AccelerateDecelerateInterpolator extends Interpolator {
    constructor() {
        super((t) => Math.cos((t + 1) * Math.PI) / 2 + 0.5);
    }
}

/**
 * An interpolator where the rate of change starts out slowly and
 * and then accelerates.
 * 先慢 后快
 */
export class AccelerateInterpolator extends Interpolator {
    private factor = 1;
    private doubleFactor = 2;

    constructor() {
        super((t) => {
            if (this.factor == 1) {
                return t * t;
            } else {
                return Math.pow(t, this.doubleFactor);
            }
        });
    }

    public setFactor(value: number) {
        this.factor = value;
        this.doubleFactor = value * 2;
    }
}

/**
 * An interpolator where the change starts backward then flings forward.
 * 先向后 再向前
 */
export class AnticipateInterpolator extends Interpolator {
    private tension = 2;

    constructor() {
        super((t) => t * t * ((this.tension + 1) * t - this.tension));
    }

    public setTension(value: number) {
        this.tension = value;
    }
}

/**
 * An interpolator where the change starts backward then flings forward and overshoots
 * the target value and finally goes back to the final value.
 * 先向后运动 超过临界值，再快速向前运动超过临界值，最后慢慢回到临界值
 */
export class BounceInterpolator extends Interpolator {
    constructor() {
        super((t) => {
            let bounce = this.bounce;
            t *= 1.1226;
            if (t < 0.3535) return bounce(t);
            else if (t < 0.7408) return bounce(t - 0.54719) + 0.7;
            else if (t < 0.9644) return bounce(t - 0.8526) + 0.9;
            else return bounce(t - 1.0435) + 0.95;
        });
    }

    private bounce(t: number): number {
        return t * t * 8;
    }
}

/**
 * An interpolator where the change bounces at the end.
 * 快速运动到临界值后，进行几次回跳，类似一个从高空坠落篮球的运动曲线。
 */
export class CycleInterpolator extends Interpolator {
    private cycles;

    constructor(cycles: number) {
        super((t) => Math.sin(2 * this.cycles * Math.PI * t));
        this.cycles = cycles;
    }

    public setCycles(value: number) {
        this.cycles = value;
    }
}

/**
 * Repeats the animation for a specified number of cycles. The
 * rate of change follows a sinusoidal pattern.
 * sin正弦变化曲线
 */
export class DecelerateInterpolator extends Interpolator {
    private factor = 1;

    constructor() {
        super((t) => {
            let result;
            if (this.factor == 1) {
                result = 1 - (1 - t) * (1 - t);
            } else {
                result = 1 - Math.pow(1 - t, 2 * this.factor);
            }
            return result;
        });
    }

    public setFactor(value: number) {
        this.factor = value;
    }
}

/**
 * An interpolator where the rate of change starts out quickly and
 * and then decelerates.
 * 减速插值器变化曲线，其算法为AccelerateInterpolator的完全倒置。
 */
export class OvershootInterpolator extends Interpolator {
    private tension = 2;

    constructor() {
        super((t) => {
            t -= 1;
            return t * t * ((this.tension + 1) * t + this.tension) + 1;
        });
    }

    public setTension(value: 2) {
        this.tension = value;
    }
}

/**
 * An interpolator where the rate of change starts out quickly and
 * and then decelerates.
 * 为0~1之间匀速变化的一条直线。
 */
export class LinearInterpolator extends Interpolator {
    constructor() {
        super((t) => t);
    }
}
