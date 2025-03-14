import { h } from "../jsx"
import { Store } from "./ext"
import type { Expr } from "./ui/expr"

export class Transition {
  readonly el = h("transition-[width]")

  constructor(value: number, onChange: (tx: Transition) => void) {
    this.el.style.width = value + "px"
    document.body.appendChild(this.el)

    let ended = true

    const loop = () => {
      onChange(this)
      if (ended) return
      requestAnimationFrame(loop)
    }

    this.el.addEventListener("transitionstart", () => {
      onChange(this)
      ended = false
      requestAnimationFrame(loop)
    })

    this.el.addEventListener("transitionend", () => {
      onChange(this)
      ended = true
    })

    this.set = (value) => {
      this.el.style.width = value + "px"
      requestAnimationFrame(loop)
    }
  }

  get() {
    const w = getComputedStyle(this.el).width
    return +w.slice(0, -2)
  }

  set(value: number) {
    this.el.style.width = value + "px"
  }
}

export class TransitionProp {
  private readonly store

  constructor(value: number) {
    this.store = new Store(
      (expr) => new Transition(value, () => expr.sheet.cv.queue()),
    )
  }

  get(expr: Expr) {
    return this.store.get(expr).get()
  }

  set(expr: Expr, value: number) {
    this.store.get(expr).set(value)
  }
}
