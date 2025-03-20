import { h } from "@/jsx"
import { Store } from "./ext"
import type { Expr } from "./ui/expr"

class Transition {
  readonly el = h("transition-[width]")
  private readonly loop: () => void
  private value: number | undefined

  constructor(value: number, onChange: (tx: Transition) => void) {
    this.el.style.width = value + "px"
    document.body.appendChild(this.el)

    let ended = true

    const loop = (this.loop = () => {
      onChange(this)
      if (ended) return
      requestAnimationFrame(loop)
    })

    this.el.addEventListener("transitionstart", () => {
      onChange(this)
      ended = false
      requestAnimationFrame(loop)
    })

    this.el.addEventListener("transitionend", () => {
      onChange(this)
      ended = true
    })
  }

  get() {
    if (this.value != null) return this.value
    const w = getComputedStyle(this.el).width
    return +w.slice(0, -2)
  }

  set(value: number, instant = false) {
    if (instant) {
      this.value = value
    } else {
      this.value = undefined
    }

    this.el.style.width = value + "px"
    requestAnimationFrame(() => this.loop())
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

  set(expr: Expr, value: number, instant?: boolean) {
    this.store.get(expr).set(value, instant)
  }
}
