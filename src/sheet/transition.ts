import { h } from "../jsx"

// TODO: this is probably inefficient and should be reworked
// but it's HILARIOUS so i may keep it just for comedic effect
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
