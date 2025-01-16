import type { Regl } from "regl"
import type { Paper } from "./paper"

export function doMatchReglSize(
  canvas: HTMLCanvasElement,
  regl: Regl,
  paper: Paper,
) {
  setInterval(() => {
    const scale = Math.min(
      devicePixelRatio,
      paper.rawBounds.xmax - paper.rawBounds.xmin,
    )
    canvas.width = canvas.clientWidth * scale
    canvas.height = canvas.clientHeight * scale
    regl.poll()
  })

  return
  function resize() {
    const scale = 1 / 4
    canvas.width = canvas.clientWidth * scale
    canvas.height = canvas.clientHeight * scale
    regl.poll()
  }

  resize()
  new ResizeObserver(resize).observe(canvas)
}
