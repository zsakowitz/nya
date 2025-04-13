import type { Regl } from "regl"

export function doMatchReglSize(
  canvas: HTMLCanvasElement,
  regl: Regl,
): [get: () => number, set: (value: number) => void] {
  let ratio = 1

  if (globalThis.location?.search.includes("shaderpixelsize")) {
    const val = new URLSearchParams(location.search).get("shaderpixelsize")
    if (val) {
      const num = +val
      if (Number.isSafeInteger(num) && 1 <= num && num <= 16) {
        ratio = num
      }
    }
  }

  function resize() {
    const scale = (window.devicePixelRatio ?? 1) / ratio
    canvas.width = canvas.clientWidth * scale
    canvas.height = canvas.clientHeight * scale
    regl.poll()
  }

  resize()
  new ResizeObserver(resize).observe(canvas)

  let queued = false
  return [
    () => ratio,
    (newRatio: number) => {
      if (newRatio < 1) return
      if (!Number.isFinite(newRatio)) return
      ratio = newRatio
      if (queued) return
      queued = true
      setTimeout(() => {
        queued = false
        resize()
      })
    },
  ]
}
