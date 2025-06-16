import { px } from "@/lib/point"
import { theme } from "@/sheet/theme"
import type { Cv } from "@/sheet/ui/cv"
import { OrderMajor } from "@/sheet/ui/cv/consts"

const THEME_MAIN_AXIS_WIDTH = 1.5
const THEME_MAJOR_LINE_ALPHA = 0.3
const THEME_MINOR_LINE_ALPHA = 0.1

const THEME_AXIS_NUMBER_SIZE = 0.875
const THEME_AXIS_NUMBER_STROKE_COLOR = () =>
  theme("--nya-paper-axis-number-stroke", "white")
const THEME_AXIS_NUMBER_STROKE_WIDTH = 4
const THEME_AXIS_NUMBER_ONSCREEN = () =>
  theme("--nya-paper-axis-number-onscreen", "black")
const THEME_AXIS_NUMBER_OFFSCREEN = () =>
  theme("--nya-paper-axis-number-offscreen", "#8e8e8e")
const THEME_AXIS_NUMBER_NEGATIVE_X_OFFSET = -2.5
const THEME_AXIS_STROKE = () => theme("--nya-paper-screen-line", "black")

const MAX_GRIDLINES_MAJOR = 200
const MAX_GRIDLINES_MINOR = MAX_GRIDLINES_MAJOR * 5

function getGridlineSize(scale: number, graphSize: number, canvasSize: number) {
  const MIN_GRIDLINE_SIZE = 16 * scale

  const graphUnitsInGridlineSize = (MIN_GRIDLINE_SIZE * graphSize) / canvasSize

  const exp = 10 ** Math.floor(Math.log10(graphUnitsInGridlineSize))
  const mantissa = graphUnitsInGridlineSize / exp
  if (mantissa < 2) {
    return { minor: 2 * exp, major: 10 * exp }
  } else if (mantissa < 4) {
    return { minor: 5 * exp, major: 20 * exp }
  } else {
    return { minor: 10 * exp, major: 50 * exp }
  }
}

export function gridlineCoords(
  cv: Cv,
  axis: "x" | "y",
  kind: "major" | "minor",
  scale = 1,
) {
  const bounds = cv.bounds()
  const min = axis == "x" ? bounds.xmin : bounds.ymin
  const delta = axis == "x" ? bounds.w : bounds.h
  const canvasSize = axis == "x" ? cv.width : cv.height
  const size = getGridlineSize(scale, delta, canvasSize)[kind]

  const majorStart = Math.floor(min / size) * size
  const majorEnd = Math.ceil((min + delta) / size) * size
  const max = kind == "minor" ? MAX_GRIDLINES_MINOR : MAX_GRIDLINES_MAJOR
  const values: number[] = []
  for (
    let line = majorStart, i = 0;
    line <= majorEnd && i < max;
    line += size, i++
  ) {
    values.push(line)
  }
  return values
}

export function createDrawAxes(paper: Cv) {
  if (location.href.includes("nogrid")) {
    return
  }

  const cv = paper.ctx.canvas
  const ctx = paper.ctx

  function scale() {
    return paper.scale
  }

  function paperToCanvas(x: number, y: number) {
    const pt = paper.toOffset(px(x, y))
    return px(pt.x * scale(), pt.y * scale())
  }

  function drawScreenLineX(x: number, w: number) {
    ctx.strokeStyle = THEME_AXIS_STROKE()
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, cv.height)
    ctx.stroke()
  }

  function drawScreenLineY(y: number, h: number) {
    ctx.strokeStyle = THEME_AXIS_STROKE()
    ctx.lineWidth = h
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(cv.width, y)
    ctx.stroke()
  }

  function drawAxes() {
    ctx.beginPath()
    ctx.globalAlpha = 1
    const { x, y } = paperToCanvas(0, 0)
    drawScreenLineX(x, THEME_MAIN_AXIS_WIDTH * scale())
    drawScreenLineY(y, THEME_MAIN_AXIS_WIDTH * scale())
  }

  function drawGridlinesX() {
    const { xmin, w } = paper.bounds()
    const { minor, major } = getGridlineSize(scale(), w, cv.width)

    ctx.strokeStyle = THEME_AXIS_STROKE()
    ctx.lineWidth = scale()

    ctx.beginPath()
    ctx.globalAlpha = THEME_MAJOR_LINE_ALPHA
    const majorStart = Math.floor(xmin / major) * major
    const majorEnd = Math.ceil((xmin + w) / major) * major
    for (
      let line = majorStart, i = 0;
      line < majorEnd && i < MAX_GRIDLINES_MAJOR;
      line += major, i++
    ) {
      const { x } = paperToCanvas(line, 0)
      drawScreenLineX(x, scale())
    }

    ctx.beginPath()
    ctx.globalAlpha = THEME_MINOR_LINE_ALPHA
    const minorStart = Math.floor(xmin / minor) * minor
    const minorEnd = Math.ceil((xmin + w) / minor) * minor
    for (
      let line = minorStart, i = 0;
      line < minorEnd && i < MAX_GRIDLINES_MINOR;
      line += minor, i++
    ) {
      const { x } = paperToCanvas(line, 0)
      drawScreenLineX(x, 1 * scale())
    }

    ctx.globalAlpha = 1
  }

  function drawGridlinesY() {
    const { ymin, h } = paper.bounds()
    const { minor, major } = getGridlineSize(scale(), h, cv.height)

    ctx.strokeStyle = THEME_AXIS_STROKE()
    ctx.lineWidth = scale()

    ctx.beginPath()
    ctx.globalAlpha = THEME_MAJOR_LINE_ALPHA
    const majorStart = Math.floor(ymin / major) * major
    const majorEnd = Math.ceil((ymin + h) / major) * major
    for (
      let line = majorStart, i = 0;
      line < majorEnd && i < MAX_GRIDLINES_MAJOR;
      line += major, i++
    ) {
      const { y } = paperToCanvas(0, line)
      drawScreenLineY(y, 1 * scale())
    }

    ctx.beginPath()
    ctx.globalAlpha = THEME_MINOR_LINE_ALPHA
    const minorStart = Math.floor(ymin / minor) * minor
    const minorEnd = Math.ceil((ymin + h) / minor) * minor
    for (
      let line = minorStart, i = 0;
      line < minorEnd && i < MAX_GRIDLINES_MINOR;
      line += minor, i++
    ) {
      const { y } = paperToCanvas(0, line)
      drawScreenLineY(y, 1 * scale())
    }

    ctx.globalAlpha = 1
  }

  function superscript(value: string): string {
    return value
      .replace(/-/g, "⁻")
      .replace(/0/g, "⁰")
      .replace(/1/g, "¹")
      .replace(/2/g, "²")
      .replace(/3/g, "³")
      .replace(/4/g, "⁴")
      .replace(/5/g, "⁵")
      .replace(/6/g, "⁶")
      .replace(/7/g, "⁷")
      .replace(/8/g, "⁸")
      .replace(/9/g, "⁹")
  }

  function toString(value: number): string {
    if (Math.abs(value) <= 1e-4 || Math.abs(value) >= 1e8) {
      const exp = Math.floor(Math.log10(Math.abs(value)))
      const mantissa = value / 10 ** exp

      return `${(+mantissa.toPrecision(15)).toString()}×10${superscript(
        exp.toString(),
      )}`
    } else {
      return (+value.toPrecision(15)).toString()
    }
  }

  function drawAxisNumbersX() {
    const { xmin, w } = paper.bounds()
    const { major } = getGridlineSize(scale(), w, cv.width)

    ctx.beginPath()

    ctx.strokeStyle = THEME_AXIS_NUMBER_STROKE_COLOR()
    ctx.lineWidth = THEME_AXIS_NUMBER_STROKE_WIDTH * scale()
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.font = `${THEME_AXIS_NUMBER_SIZE * scale()}rem sans-serif`

    const majorStart = Math.floor(xmin / major)
    const majorEnd = Math.ceil((xmin + w) / major)

    const zeroMetrics = ctx.measureText("0")
    const letterSize =
      zeroMetrics.fontBoundingBoxDescent - zeroMetrics.fontBoundingBoxAscent

    const { y } = paperToCanvas(0, 0)

    const pos =
      y + 7.5 * scale() + letterSize > cv.height ? "bottom"
      : y + 1.5 * scale() < 0 ? "top"
      : "middle"

    if (pos == "middle") {
      ctx.fillStyle = THEME_AXIS_NUMBER_ONSCREEN()
    } else {
      ctx.fillStyle = THEME_AXIS_NUMBER_OFFSCREEN()

      if (pos == "bottom") {
        ctx.textBaseline = "bottom"
      }
    }

    for (
      let line = majorStart, i = 0;
      line <= majorEnd && i < MAX_GRIDLINES_MAJOR;
      line++, i++
    ) {
      if (line == 0) {
        continue
      }

      const value = toString(line * major)
      let { x } = paperToCanvas(line * major, 0)
      if (line * major < 0) {
        x += THEME_AXIS_NUMBER_NEGATIVE_X_OFFSET * scale()
      }

      if (pos == "bottom") {
        ctx.strokeText(value, x, cv.height - 3 * scale())
        ctx.fillText(value, x, cv.height - 3 * scale())
      } else if (pos == "top") {
        ctx.strokeText(value, x, 3 * scale())
        ctx.fillText(value, x, 3 * scale())
      } else {
        ctx.strokeText(value, x, y + 3 * scale())
        ctx.fillText(value, x, y + 3 * scale())
      }
    }
  }

  function drawAxisNumbersY() {
    const { ymin, h } = paper.bounds()
    const { major } = getGridlineSize(scale(), h, cv.height)

    ctx.beginPath()

    ctx.strokeStyle = THEME_AXIS_NUMBER_STROKE_COLOR()
    ctx.lineWidth = THEME_AXIS_NUMBER_STROKE_WIDTH * scale()
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.font = `${THEME_AXIS_NUMBER_SIZE * scale()}rem sans-serif`

    const majorStart = Math.floor(ymin / major)
    const majorEnd = Math.ceil((ymin + h) / major)

    for (
      let line = majorStart, i = 0;
      line <= majorEnd && i < MAX_GRIDLINES_MAJOR;
      line++, i++
    ) {
      if (line == 0) {
        continue
      }

      const value = toString(line * major)
      let { x, y } = paperToCanvas(0, line * major)
      x -= 6 * scale()

      const metrics = ctx.measureText(value)
      const xleft = x - metrics.width

      if (xleft < 6 * scale()) {
        ctx.textAlign = "left"
        ctx.fillStyle = THEME_AXIS_NUMBER_OFFSCREEN()
        ctx.strokeText(value, 6 * scale(), y)
        ctx.fillText(value, 6 * scale(), y)
      } else if (x > cv.width - 6 * scale()) {
        ctx.textAlign = "right"
        ctx.fillStyle = THEME_AXIS_NUMBER_OFFSCREEN()
        ctx.strokeText(value, cv.width - 6 * scale(), y)
        ctx.fillText(value, cv.width - 6 * scale(), y)
      } else {
        ctx.textAlign = "right"
        ctx.fillStyle = THEME_AXIS_NUMBER_ONSCREEN()
        ctx.strokeText(value, x, y)
        ctx.fillText(value, x, y)
      }
    }
  }

  function drawGridlines() {
    drawGridlinesX()
    drawGridlinesY()
    drawAxisNumbersX()
    drawAxisNumbersY()
    drawAxes()
  }

  paper.fn(OrderMajor.Grid, drawGridlines)
}
