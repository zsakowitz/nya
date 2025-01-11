import type { Regl } from "regl"

export function doMatchReglSize(canvas: HTMLCanvasElement, regl: Regl) {
  function resize() {
    const scale = globalThis.devicePixelRatio ?? 1
    canvas.width = canvas.clientWidth * scale
    canvas.height = canvas.clientHeight * scale
    regl.poll()
  }

  resize()
  new ResizeObserver(resize).observe(canvas)
}
