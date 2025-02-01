import { twMerge } from "tailwind-merge"
import { safe } from "../eval/lib/util"
import { add } from "../eval/ops/op/add"
import { div } from "../eval/ops/op/div"
import { mul } from "../eval/ops/op/mul"
import { sub } from "../eval/ops/op/sub"
import type { SReal } from "../eval/ty"
import { isZero } from "../eval/ty/check"
import { frac, num, real } from "../eval/ty/create"
import { Display } from "../eval/ty/display"
import type { Cursor } from "../field/model"
import { h, hx } from "../jsx"

export class Slider {
  private _min = real(0)
  private _max = real(1)
  private _step = real(0)
  private _steps = 0
  private _base = 10
  private _value = real(1)

  private elNative
  private elScroller
  private elStepsOuter
  private elSteps
  private elInner

  /**
   * Applying padding or borders to {@linkcode Slider.el} will layer them around
   * the inner slider element. All mouse events will still work as expected.
   */
  el

  constructor(className?: string) {
    this.el = h(
      twMerge("block w-full", className),
      (this.elInner = h(
        "group/nya-slider block w-full px-[0.5625rem] py-[0.5625rem] relative cursor-pointer",
        (this.elNative = hx("input", {
          class: "sr-only",
          type: "range",
          min: "" + this._min,
          max: "" + this._max,
          step: "" + (this._step || "any"),
          value: "" + this._value,
        })),
        (this.elStepsOuter = h(
          "relative block w-full h-1.5 bg-[--nya-border] rounded-full",
          (this.elSteps = h(
            "absolute block top-0.5 h-0.5 left-0.5 right-1 rounded-full",
          )),
        )),
        h(
          "absolute top-0 left-0 right-6 h-6 touch-none",
          (this.elScroller = h(
            "absolute block size-6 rounded-full bg-blue-500/40 top-0 left-0 flex group/nya-scroller group-focus-within/nya-slider:ring-2 ring-offset-2 ring-blue-500/40 ring-offset-[--nya-bg]",
            h(
              "block size-1.5 rounded-full bg-blue-500 group-hover/nya-scroller:size-6 [.nya-scrolleractive_&]:size-6 m-auto transition-[width,height]",
            ),
          )),
        ),
      )),
    )
    this.updateScroller()
    this.updateSteps()
    this.elNative.addEventListener("input", () => {
      this._value = real(+this.elNative.value)
      this.updateScroller()
      this.onInput?.()
    })
    let dragging = false
    this.el.addEventListener("contextmenu", (ev) => ev.preventDefault())
    addEventListener(
      "pointerup",
      () => {
        dragging = false
        this.elScroller.classList.remove("nya-scrolleractive")
      },
      { passive: true },
    )
    this.el.addEventListener(
      "pointerdown",
      (event) => {
        dragging = true
        this.elScroller.classList.add("nya-scrolleractive")
        this.setByPageX(event.pageX)
      },
      { passive: true },
    )
    addEventListener(
      "blur",
      () => {
        dragging = false
        this.elScroller.classList.remove("nya-scrolleractive")
      },
      { passive: true },
    )
    addEventListener(
      "pointermove",
      (event) => dragging && this.setByPageX(event.pageX),
      { passive: true },
    )
    new ResizeObserver(() => this.checkStepExistence()).observe(
      this.elStepsOuter,
    )
  }

  private setByPageX(pageX: number) {
    const rem = this.rem()
    const pos = Math.max(
      0,
      Math.min(
        1,
        (pageX - (this.elInner.getBoundingClientRect().left + 0.75 * rem)) /
          (this.elInner.clientWidth - 1.5 * rem),
      ),
    )
    const val = this.clamp(
      pos * (num(this._max) - num(this._min)) + num(this._min),
    )
    this._value = real(val)
    this.elNative.value = "" + val
    this.updateScroller()
    this.onInput?.()
  }

  private clamp(value: number): number {
    const min = num(this._min)
    const max = num(this._max)
    const step = num(this._step)
    // takes care of NaN
    if (!(value > min)) return min
    if (value >= max) return max
    if (!step) return value
    var low = Math.floor((value - min) / step) * step + min
    if (low < min) low = min
    var high = Math.ceil((value - min) / step) * step + min
    if (high > max) high = max
    if (value - low < high - value) {
      return low
    } else {
      return high
    }
  }

  private rem() {
    const value = +getComputedStyle(document.documentElement).fontSize.slice(
      0,
      -2,
    )
    if (value !== value) {
      return 16
    } else {
      return value
    }
  }

  private updateSteps() {
    while (this.elSteps.firstChild) {
      this.elSteps.firstChild.remove()
    }
    const min = num(this._min)
    const max = num(this._max)
    const step = num(this._step)
    const steps = (this._steps = (max - min) / step)
    if (0 < steps && steps <= 100) {
      for (let i = 0; i <= steps; i++) {
        const el = h("absolute top-0 size-0.5 bg-[--nya-bg] rounded-full")
        el.style.left = 100 * (i / steps) + "%"
        this.elSteps.appendChild(el)
      }
    }
    const zero = -min / (max - min)
    if (0 <= zero && zero <= 1) {
      const el = h(
        "absolute top-0 size-0.5 bg-[--nya-slider-zero] rounded-full",
      )
      el.style.left = 100 * zero + "%"
      this.elSteps.appendChild(el)
    }
    this.checkStepExistence()
  }

  private checkStepExistence() {
    const rem = this.rem()
    const w = this.elStepsOuter.clientWidth - 0.375 * rem
    const width = w / this._steps
    this.elSteps.classList.toggle("hidden", width < 0.5 * rem)
  }

  private updateScroller() {
    const min = num(this._min)
    const max = num(this._max)
    const value = num(this._value)
    const pc = Math.max(0, Math.min(1, (value - min) / (max - min)))
    this.elScroller.style.left = 100 * pc + "%"
  }

  get step() {
    return this._step
  }

  set step(v) {
    const x = num(v)
    if (x >= 0 && isFinite(x)) {
      this._step = v
    }
    this.updateSteps()
  }

  get min() {
    return this._min
  }

  get max() {
    return this._max
  }

  get base() {
    return frac(this._base, 1)
  }

  set base(v: SReal) {
    if (v.type == "exact" && v.d == 1 && v.n >= 2) {
      this._base = v.n
    } else {
      this._base = 10
    }
  }

  private virtualStepExp() {
    return Math.ceil(
      Math.log(
        (this.elInner.clientWidth * (globalThis.devicePixelRatio ?? 1)) /
          (num(this._max) - num(this._min)),
      ) / Math.log(this._base),
    )
  }

  private virtualStep() {
    return frac(1, this._base ** this.virtualStepExp())
  }

  get value() {
    if (isZero(this._step)) {
      const step = this.virtualStep()
      return mul(frac(Math.round(num(div(this._value, step))), 1), step)
    } else {
      return add(
        mul(
          frac(
            Math.round(num(div(sub(this._value, this._min), this._step))),
            1,
          ),
          this._step,
        ),
        this._min,
      )
    }
  }

  set value(v) {
    this._value = v
    this.updateScroller()
    this.elNative.value = "" + num(this._value)
  }

  bounds(min: SReal, max: SReal) {
    if (isFinite(num(min)) && isFinite(num(max)) && num(min) < num(max)) {
      this._min = min
      this._max = max
      this.updateScroller()
      this.updateSteps()
      this.elNative.min = "" + num(min)
      this.elNative.max = "" + num(max)
    }
  }

  display(cursor: Cursor, baseRaw: SReal) {
    const base = num(baseRaw)

    if (!isZero(this._step) || !(safe(base) && 2 <= base && base <= 36)) {
      new Display(cursor, baseRaw || frac(10, 1)).value(num(this.value))
      return
    }

    const display = new Display(cursor, baseRaw || frac(10, 1))
    const step = this.virtualStep()
    const stepExp = this.virtualStepExp()
    let main = Math.round(num(div(this._value, step)))
    if (main < 0) {
      display.digits("-")
      main = -main
    }
    let str = BigInt(main).toString(base)
    if (stepExp > 0) {
      str = str.padStart(stepExp, "0")
      str = (str.slice(0, -stepExp) || "0") + "." + str.slice(-stepExp)
      while (str[str.length - 1] == "0") {
        str = str.slice(0, -1)
      }
      if (str[str.length - 1] == ".") {
        str = str.slice(0, -1)
      }
    } else if (stepExp < 0) {
      str += "0".repeat(-stepExp)
    }

    display.digits(str)
  }

  onInput?(): void
}
