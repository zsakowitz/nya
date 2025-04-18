import type { Package } from "#/types"
import type { JsVal, Tys } from "@/eval/ty"
import { SNANPT, gl, num, pt, real, unpt } from "@/eval/ty/create"
import { gliderOnLine, type TyInfoByName } from "@/eval/ty/info"
import { OpEq } from "@/field/cmd/leaf/cmp"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdDot } from "@/field/cmd/leaf/num"
import { CmdToken, createToken } from "@/field/cmd/leaf/token"
import { CmdVar } from "@/field/cmd/leaf/var"
import { CmdWord } from "@/field/cmd/leaf/word"
import { CmdBrack } from "@/field/cmd/math/brack"
import { L, R } from "@/field/dir"
import { Block } from "@/field/model"
import { h, path, svgx, sx } from "@/jsx"
import { PICK_TY, definePickTy, toolbar, type Data } from "@/sheet/pick-ty"
import { normVector, type Point } from "@/sheet/point"
import { Color, Opacity, Order, Size } from "@/sheet/ui/cv/consts"
import { Expr } from "@/sheet/ui/expr"
import type { Selected } from "@/sheet/ui/sheet"
import { FN_GLIDER, FN_INTERSECTION, WRITE_POINT, iconPoint } from "../point"
import { computeArcVal, unglideArc } from "./util-arc"
import { EXT_ANGLE, angleGlsl, angleJs, drawAngleCv } from "./util-ext/angle"
import { EXT_ARC, drawArcCv } from "./util-ext/arc"
import { EXT_CIRCLE } from "./util-ext/circle"
import { EXT_LINE, getLineBounds } from "./util-ext/line"
import { EXT_POLYGON } from "./util-ext/polygon"
import { EXT_RAY, getRayBounds } from "./util-ext/ray"
import { EXT_SEGMENT } from "./util-ext/segment"
import { EXT_VECTOR } from "./util-ext/vector"
import { FN_ANGLE, FN_DIRECTEDANGLE } from "./util-fn/angle"
import { FN_ANGLEBISECTOR, bisectAngleJs } from "./util-fn/anglebisector"
import { FN_ANGLES, FN_DIRECTEDANGLES } from "./util-fn/angles"
import { FN_ARC } from "./util-fn/arc"
import { FN_CENTER } from "./util-fn/center"
import { FN_CIRCLE } from "./util-fn/circle"
import { FN_DILATE } from "./util-fn/dilate"
import { FN_DISTANCE } from "./util-fn/distance"
import { FN_END } from "./util-fn/end"
import "./util-fn/glider"
import "./util-fn/intersection"
import { FN_LENGTH } from "./util-fn/length"
import { FN_LINE } from "./util-fn/line"
import { FN_MIDPOINT } from "./util-fn/midpoint"
import { FN_PARALLEL, parallelJs } from "./util-fn/parallel"
import { FN_PERIMETER } from "./util-fn/perimeter"
import { FN_PERPENDICULAR, perpendicularJs } from "./util-fn/perpendicular"
import { FN_PERPENDICULARBISECTOR } from "./util-fn/perpendicularbisector"
import { FN_POLYGON } from "./util-fn/polygon"
import { FN_RADIUS } from "./util-fn/radius"
import { FN_RAY } from "./util-fn/ray"
import { FN_REFLECT } from "./util-fn/reflect"
import { FN_ROTATE } from "./util-fn/rotate"
import { FN_SEGMENT } from "./util-fn/segment"
import { FN_SEGMENTS } from "./util-fn/segments"
import { FN_START } from "./util-fn/start"
import { FN_TRANSLATE } from "./util-fn/translate"
import { FN_VECTOR } from "./util-fn/vector"
import { FN_VERTICES } from "./util-fn/vertices"
import { vectorPath } from "./util-vector"

declare module "@/eval/ty" {
  interface Tys {
    segment: [SPoint, SPoint]
    ray: [SPoint, SPoint]
    line: [SPoint, SPoint] & { source?: "perpendicular" | "parallel" }
    vector: [SPoint, SPoint]
    circle: { center: SPoint; radius: SReal }
    polygon: SPoint[]
    angle: [SPoint, SPoint, SPoint]
    directedangle: [SPoint, SPoint, SPoint]
    arc: [SPoint, SPoint, SPoint]
  }
}

function lineInfo<T extends "segment" | "ray" | "line" | "vector">(
  name: T,
  namePlural: string,
  clsx: string | (() => HTMLElement),
  glide: ((bound: number) => number) | null,
  token: (a: Point, b: Point, source: Tys[T]) => HTMLSpanElement | null,
): TyInfoByName<T> {
  return {
    name,
    namePlural,
    glsl: "vec4",
    toGlsl([{ x: x1, y: y1 }, { x: x2, y: y2 }]) {
      return `vec4(${gl(x1)}, ${gl(y1)}, ${gl(x2)}, ${gl(y2)})`
    },
    garbage: { js: [SNANPT, SNANPT], glsl: "vec4(0.0/0.0)" },
    coerce: {},
    write: {
      isApprox(value) {
        return value.some((x) => x.x.type == "approx" || x.y.type == "approx")
      },
      display(value, props) {
        new CmdWord(name, "prefix").insertAt(props.cursor, L)
        const block = new Block(null)
        new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
        const inner = props.at(block.cursor(R))
        WRITE_POINT.display(value[0], inner)
        new CmdComma().insertAt(inner.cursor, L)
        WRITE_POINT.display(value[1], inner)
      },
    },
    order: Order.Graph,
    point: false,
    icon:
      typeof clsx == "function" ? clsx : (
        () =>
          h(
            "",
            h(
              "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(clsx),
            ),
          )
      ),
    token(val) {
      return token(unpt(val[0]), unpt(val[1]), val)
    },
    glide:
      glide ?
        (props) => {
          const raw = gliderOnLine(
            props.cv,
            [unpt(props.shape[0]), unpt(props.shape[1])],
            props.point,
          )

          return {
            value: glide(raw.value),
            precision: raw.precision,
          }
        }
      : null,
    preview(cv, val) {
      switch (name) {
        case "segment": {
          cv.polygon(val.map(unpt), Size.Line, Color.Blue)
          break
        }
        case "ray": {
          const bounds = getRayBounds(cv, unpt(val[0]), unpt(val[1]))
          if (bounds) cv.polygonByCanvas(bounds, Size.Line, Color.Blue)
          break
        }
        case "line": {
          const bounds = getLineBounds(cv, unpt(val[0]), unpt(val[1]))
          if (bounds) cv.polygonByCanvas(bounds, Size.Line, Color.Blue)
          break
        }
        case "vector": {
          const path = vectorPath(cv, unpt(val[0]), unpt(val[1]))
          if (path) cv.path(new Path2D(path), Size.Line, Color.Blue, 1, 1)
          break
        }
      }
    },
    extras: null,
  }
}

const PICK_LINE = definePickTy(
  "line",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const bounds = getLineBounds(sheet.cv, unpt(p1.value), unpt(p2.value))
      sheet.cv.polygonByCanvas(bounds, Size.Line, Color.Blue)
    }
  },
)

const PICK_SEGMENT = definePickTy(
  "segment",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      sheet.cv.polygon([unpt(p1.value), unpt(p2.value)], Size.Line, Color.Blue)
    }
  },
)

const PICK_RAY = definePickTy(
  "ray",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const bounds = getRayBounds(sheet.cv, unpt(p1.value), unpt(p2.value))
      if (bounds) sheet.cv.polygonByCanvas(bounds, Size.Line, Color.Blue)
    }
  },
)

const PICK_VECTOR = definePickTy(
  "vector",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const { cv } = sheet
      const d = vectorPath(cv, unpt(p1.value), unpt(p2.value))
      if (d) cv.path(new Path2D(d), Size.Line, Color.Blue, 1, 1)
    }
  },
)

const PICK_CIRCLE = definePickTy(
  "circle",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const center = unpt(p1.value)
      const edge = unpt(p2.value)
      sheet.cv.circle(
        center,
        Math.hypot(center.x - edge.x, center.y - edge.y),
        Size.Line,
        Color.Green,
      )
    }
  },
)

const PICK_ARC = definePickTy(
  "arc",
  [
    ["point32", "point64"],
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2, p3) => {
    if (p1 && p2 && p3) {
      const arc = computeArcVal([p1.value, p2.value, p3.value])
      drawArcCv(sheet.cv, arc)
    }
  },
)

const PICK_PERPENDICULAR = definePickTy(
  "perpendicular",
  [
    ["segment", "ray", "line", "vector"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const line = perpendicularJs(p1, p2)
      const bounds = getLineBounds(sheet.cv, unpt(line[0]), unpt(line[1]))
      sheet.cv.polygonByCanvas(bounds, Size.Line, Color.Blue)
    }
  },
)

const PICK_PARALLEL = definePickTy(
  "parallel",
  [
    ["segment", "ray", "line", "vector"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const line = parallelJs(p1, p2)
      const bounds = getLineBounds(sheet.cv, unpt(line[0]), unpt(line[1]))
      sheet.cv.polygonByCanvas(bounds, Size.Line, Color.Blue)
    }
  },
)

type PickAngleArgs =
  | [JsVal<"polygon">]
  | [
      JsVal<"point32" | "point64">?,
      JsVal<"point32" | "point64">?,
      JsVal<"point32" | "point64">?,
    ]

function createPick(type: "angle" | "directedangle"): Data {
  return {
    vals: [],
    next: ["point32", "point64", "polygon"],
    src: {
      id: Math.random(),
      fn: type,
      next(args) {
        if (args.length == 0) {
          return ["point32", "point64", "polygon"]
        }
        if (args.length == 3) {
          return null
        }
        return args[0]?.type == "polygon" ? null : ["point32", "point64"]
      },
      draw(sheet, args) {
        const [a, b, c] = args as PickAngleArgs

        if (a?.type == "polygon") {
          if (a.value.length < 2) {
            return
          }
          for (let i = 0; i < a.value.length; i++) {
            const prev = a.value[(i + a.value.length - 1) % a.value.length]!
            const self = a.value[i]!
            const next = a.value[(i + 1) % a.value.length]!
            drawAngleCv(sheet.cv, unpt(prev), unpt(self), unpt(next), {
              kind: type,
            })
          }
        } else if (a && b && c) {
          drawAngleCv(sheet.cv, unpt(a.value), unpt(b.value), unpt(c.value), {
            kind: type,
          })
        }
      },
      create(sheet, args) {
        const a = args[0] as Selected<"polygon">

        if (a?.val.type != "polygon") {
          return false
        }

        if (a.val.value.length < 2) {
          return true
        }

        for (let i = 0; i < a.val.value.length; i++) {
          const expr = Expr.of(sheet, true)
          const cursor = expr.field.block.cursor(R)

          const token = CmdToken.new(expr.field.scope)
          token.insertAt(cursor, L)
          new OpEq(false).insertAt(cursor, L)

          a.ref().insertAt(cursor, L)
          new CmdDot().insertAt(cursor, L)
          for (const c of type + "s") {
            new CmdVar(c, sheet.options).insertAt(cursor, L)
          }
          CmdBrack.index(i + 1).insertAt(cursor, L)

          expr.field.dirtyAst = expr.field.dirtyValue = true
          expr.field.trackNameNow()
          expr.field.scope.queueUpdate()
        }

        return true
      },
    },
  }
}

const PICK_MIDPOINT: Data = {
  vals: [],
  next: ["point32", "point64", "segment"],
  src: {
    id: Math.random(),
    fn: "midpoint",
    next(args) {
      if (args.length == 0) {
        return ["point32", "point64", "segment"]
      }
      if (args.length == 2) {
        return null
      }
      return args[0]?.type == "segment" ? null : ["point32", "point64"]
    },
    draw(sheet, args) {
      const [a, b] = args as
        | []
        | [JsVal<"segment">]
        | [JsVal<"point32" | "point64">, JsVal<"point32" | "point64">]

      let p1, p2
      if (a?.type == "segment") {
        p1 = unpt(a.value[0])
        p2 = unpt(a.value[1])
      } else if (a && b) {
        p1 = unpt(a.value)
        p2 = unpt(b.value)
      } else {
        return
      }

      sheet.cv.point(
        { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
        Size.Point,
        Color.Purple,
      )
    },
  },
}

const PICK_POLYGON: Data = {
  vals: [],
  next: ["point32", "point64"],
  src: {
    id: Math.random(),
    fn: "polygon",
    allowExistingPoint(args) {
      return args.length >= 2
    },
    next(args) {
      if (args.length < 2) {
        return ["point32", "point64"]
      }
      if (
        args[0] == args[args.length - 1] ||
        args[args.length - 2] == args[args.length - 1]
      ) {
        return null
      }
      return ["point32", "point64"]
    },
    draw(sheet, args) {
      if (args.length < 2) return

      const pts = args as JsVal<"point32" | "point64">[]

      sheet.cv.polygon(
        pts.map((x) => unpt(x.value)),
        Size.Line,
        Color.Blue,
        1,
        0.3,
        false,
      )
    },
  },
}

const INFO_SEGMENT = lineInfo(
  "segment",
  "segements",
  "w-[20px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
  (x) => Math.max(0, Math.min(1, x)),
  (a, b) => segmentIcon(a, b),
)

function segmentIcon(a: Point, b: Point, color = "text-[#2d70b3]") {
  return h(
    "",
    h(
      color +
        " size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
      h(
        "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
      ),
      h({
        class:
          "w-[16px] h-0 absolute rounded-full top-1/2 left-1/2 border-t-2 border-current",
        style: `transform: translate(-50%, -50%) rotate(${-(180 / Math.PI) * Math.atan2(b.y - a.y, b.x - a.x)}deg)`,
      }),
    ),
  )
}

const INFO_RAY = lineInfo(
  "ray",
  "rays",
  "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 translate-x-[-10px] translate-y-[-3.5px] border-t-2 border-current -rotate-[30deg]",
  (x) => Math.max(0, x),
  (a, b) => {
    const x = Math.cos(Math.atan2(b.y - a.y, b.x - a.x))
    const y = Math.sin(Math.atan2(b.y - a.y, b.x - a.x))
    return h(
      "",
      h(
        "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
        h(
          "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
        ),
        sx(
          "svg",
          {
            "class": "size-[22px] absolute inset-0 fill-none stroke-current",
            "viewBox": "0 0 22 22",
            "stroke-linecap": "round",
            "stroke-width": 2,
          },
          path(`M ${11 - 8 * x} ${11 + 8 * y} L ${11 + 50 * x} ${11 - 50 * y}`),
        ),
      ),
    )
  },
)

const INFO_LINE = lineInfo(
  "line",
  "lines",
  "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
  (x) => x,
  (a, b, c) => {
    const x = Math.cos(Math.atan2(b.y - a.y, b.x - a.x))
    const y = -Math.sin(Math.atan2(b.y - a.y, b.x - a.x))
    return h(
      "",
      h(
        "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
        h(
          "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
        ),
        sx(
          "svg",
          {
            "class": "size-[22px] absolute inset-0 fill-none stroke-current",
            "viewBox": "0 0 22 22",
            "stroke-linecap": "round",
            "stroke-width": 2,
          },
          c.source == "perpendicular" ?
            sx("path", {
              "d": `M ${11 - 50 * y} ${11 + 50 * x} L ${11 + 50 * y} ${11 - 50 * x}`,
              "stroke-opacity": 0.3,
            })
          : null,
          c.source == "parallel" ?
            sx("path", {
              "d": `M ${11 + 4 * y - 50 * x} ${11 - 4 * x - 50 * y} L ${11 + 4 * y + 50 * x} ${11 - 4 * x + 50 * y}`,
              "stroke-opacity": 0.3,
            })
          : null,
          path(
            `M ${11 - 50 * x} ${11 - 50 * y} L ${11 + 50 * x} ${11 + 50 * y}`,
          ),
        ),
      ),
    )
  },
)

const INFO_VECTOR = lineInfo(
  "vector",
  "vectors",
  () =>
    h(
      "",
      h(
        "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
        h(
          "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
        ),
        sx(
          "svg",
          {
            "class": "size-[22px] absolute inset-0 fill-current stroke-current",
            "viewBox": "0 0 22 22",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": 2,
          },
          path(
            `M 4.153044906177569 15.137536216539871 L 17.84695509382243 6.86246378346013 M 17.84695509382243 6.86246378346013 L 13.182216681949255 6.877145363583335 L 15.664738411873175 10.985318419876794 Z`,
          ),
        ),
      ),
    ),
  null,
  (o1, o2) => {
    const angle = Math.atan2(o2.y - o1.y, o2.x - o1.x)
    const x = Math.cos(angle)
    const y = -Math.sin(angle)

    const sz = 4
    const d = 8 - sz
    const w = 0.6 * sz

    return h(
      "",
      h(
        "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
        h(
          "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
        ),
        sx(
          "svg",
          {
            "class": "size-[22px] absolute inset-0 fill-current stroke-current",
            "viewBox": "0 0 22 22",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": 2,
          },
          path(
            `M ${11 - 8 * x} ${11 - 8 * y} L ${11 + 8 * x} ${11 + 8 * y} M ${11 + 8 * x} ${11 + 8 * y} L ${11 + d * x + w * y} ${11 + d * y - w * x} L ${11 + d * x - w * y} ${11 + d * y + w * x} Z`,
          ),
        ),
      ),
    )
  },
)

const INFO_CIRCLE: TyInfoByName<"circle"> = {
  name: "circle",
  namePlural: "circles",
  glsl: "vec3",
  toGlsl({ center: { x, y }, radius }) {
    return `vec3(${gl(x)}, ${gl(y)}, ${gl(radius)})`
  },
  garbage: {
    js: { center: SNANPT, radius: real(NaN) },
    glsl: "vec3(0.0/0.0)",
  },
  coerce: {},
  write: {
    isApprox(value) {
      return (
        value.center.x.type == "approx" ||
        value.center.y.type == "approx" ||
        value.radius.type == "approx"
      )
    },
    display(value, props) {
      new CmdWord("circle", "prefix").insertAt(props.cursor, L)
      const block = new Block(null)
      new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
      const inner = props.at(block.cursor(R))
      WRITE_POINT.display(value.center, inner)
      new CmdComma().insertAt(inner.cursor, L)
      inner.num(value.radius)
    },
  },
  order: Order.Graph,
  point: false,
  icon() {
    return h(
      "",
      h(
        "text-[#388c46] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
        h(
          "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
        ),
        h(
          "size-[16px] absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-current",
        ),
      ),
    )
  },
  token: null,
  glide(props) {
    const x = num(props.shape.center.x)
    const y = num(props.shape.center.y)
    const angle =
      props.point.x == x && props.point.y == y ?
        0
      : Math.atan2(props.point.y - y, props.point.x - x)
    return {
      precision: 2 * Math.PI * props.cv.offsetDistance(props.point, { x, y }),
      value: angle / 2 / Math.PI,
    }
  },
  preview(cv, val) {
    cv.circle(unpt(val.center), num(val.radius), Size.Line, Color.Green)
  },
  extras: null,
}

const INFO_POLYGON: TyInfoByName<"polygon"> = {
  name: "polygon",
  namePlural: "polygons",
  get glsl(): never {
    throw new Error("Cannot construct polygons in shaders.")
  },
  toGlsl() {
    throw new Error("Cannot construct polygons in shaders.")
  },
  garbage: {
    js: [],
    get glsl(): never {
      throw new Error("Cannot construct polygons in shaders.")
    },
  },
  coerce: {},
  write: {
    isApprox(value) {
      return value.some((x) => x.x.type == "approx" || x.y.type == "approx")
    },
    display(value, props) {
      new CmdWord("polygon", "prefix").insertAt(props.cursor, L)
      const inner = new Block(null)
      const brack = new CmdBrack("(", ")", null, inner)
      brack.insertAt(props.cursor, L)
      let first = true
      props = props.at(inner.cursor(R))
      for (const pt of value) {
        if (first) {
          first = false
        } else {
          new CmdComma().insertAt(props.cursor, L)
        }
        const block = new Block(null)
        new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
        const inner = props.at(block.cursor(R))
        inner.num(pt.x)
        new CmdComma().insertAt(inner.cursor, L)
        inner.num(pt.y)
      }
    },
  },
  order: Order.Graph,
  point: false,
  icon() {
    return h(
      "",
      h(
        "text-[#388c46] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
        h(
          "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
        ),
        h(
          "w-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          svgx(
            "2.2 4.4 17.6 13.2",
            "stroke-current fill-none overflow-visible [stroke-linejoin:round] stroke-2",
            path("M 7.2 4.4 L 19.8 13.2 L 2.2 17.6 Z"),
          ),
        ),
      ),
    )
  },
  token(val) {
    if (val.length < 2) {
      return null
    }
    const pts = val.map(unpt)
    return createToken(
      "#388c46",
      sx(
        "g",
        { "fill": "currentcolor", "fill-opacity": Opacity.TokenFill },
        path(
          `M ${pts[0]!.x} ${-pts[0]!.y}${pts.slice(1).map((pt) => ` L ${pt.x} ${-pt.y}`)} Z`,
        ),
      ),
    )
  },
  // TODO: polygons can have perimeter gliders
  glide: null,
  preview(cv, val) {
    cv.polygon(val.map(unpt), Size.Line, Color.Blue, 1, 0.3, false)
  },
  extras: null,
}

const INFO_ARC: TyInfoByName<"arc"> = {
  name: "arc",
  namePlural: "arcs",
  glsl: "mat3x2",
  toGlsl(val) {
    return `mat3x2(${val.map(({ x, y }) => `vec2(${gl(x)}, ${gl(y)})`).join(", ")})`
  },
  garbage: {
    js: [SNANPT, SNANPT, SNANPT],
    glsl: "mat3x2(vec2(0.0/0.0),vec2(0.0/0.0),vec2(0.0/0.0))",
  },
  coerce: {},
  write: {
    isApprox(value) {
      return value.some((x) => x.x.type == "approx" || x.y.type == "approx")
    },
    display(value, props) {
      new CmdWord("arc", "prefix").insertAt(props.cursor, L)
      const block = new Block(null)
      new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
      const inner = props.at(block.cursor(R))
      WRITE_POINT.display(value[0], inner)
      new CmdComma().insertAt(inner.cursor, L)
      WRITE_POINT.display(value[1], inner)
      new CmdComma().insertAt(inner.cursor, L)
      WRITE_POINT.display(value[2], inner)
    },
  },
  order: Order.Graph,
  point: false,
  icon() {
    return h(
      "",
      h(
        "text-[#388c46] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
        h(
          "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
        ),
        sx(
          "svg",
          {
            class:
              "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible",
            viewBox: `0 0 64 64`,
            fill: "none",
          },
          sx("path", {
            "d": "M 6.821075367479289 58.046972674137905 A 60.375975878779 -60.375975878779 0 0 1 60.110633724316074 7.562127915029379",
            "stroke": "#388c46",
            "stroke-linecap": "round",
            "stroke-width": 8,
          }),
        ),
      ),
    )
  },
  token(val) {
    const arc = computeArcVal(val)

    switch (arc.type) {
      case "invalid":
        return null
      case "segment":
        return segmentIcon(arc.p1, arc.p3, "text-[#388c46]")
      case "tworay":
        const x = Math.cos(Math.atan2(arc.p3.y - arc.p1.y, arc.p3.x - arc.p1.x))
        const y = -Math.sin(
          Math.atan2(arc.p3.y - arc.p1.y, arc.p3.x - arc.p1.x),
        )
        return h(
          "",
          h(
            "text-[#388c46] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
            h(
              "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
            ),
            sx(
              "svg",
              {
                "class":
                  "size-[22px] absolute inset-0 fill-none stroke-current",
                "viewBox": "0 0 22 22",
                "stroke-linecap": "round",
                "stroke-width": 2,
              },
              path(
                `M ${11 - 50 * x} ${11 - 50 * y} L ${11 - 4 * x} ${11 - 4 * y} M ${11 + 4 * x} ${11 + 4 * y} L ${11 + 50 * x} ${11 + 50 * y}`,
              ),
            ),
          ),
        )
      case "circle":
        return createToken(
          "#388c46",
          path(
            `M ${arc.p1.x} ${-arc.p1.y} A ${arc.r} ${arc.r} 0 ${+arc.large} ${+arc.swap} ${arc.p3.x} ${-arc.p3.y}`,
          ),
        )
    }
  },
  glide(props) {
    return unglideArc(props.cv, computeArcVal(props.shape), props.point)
  },
  preview(cv, val) {
    const arc = computeArcVal(val)
    drawArcCv(cv, arc)
  },
  extras: null,
}

function angleInfo(
  type: "angle" | "directedangle",
  svg: () => SVGSVGElement,
): TyInfoByName<"angle" | "directedangle"> {
  const LINE = 32
  const ARC = type == "directedangle" ? 28 : 20

  return {
    name: type == "angle" ? "angle" : "directed angle",
    namePlural: type == "angle" ? "angles" : "directed angles",
    glsl: "mat3x2",
    toGlsl(val) {
      return `mat3x2(${val.map(({ x, y }) => `vec2(${gl(x)}, ${gl(y)})`).join(", ")})`
    },
    garbage: {
      js: [SNANPT, SNANPT, SNANPT],
      glsl: "mat3x2(vec2(0.0/0.0),vec2(0.0/0.0),vec2(0.0/0.0))",
    },
    coerce: {
      r32: {
        js(value) {
          return angleJs({ value, type })
        },
        glsl(expr, ctx) {
          return angleGlsl(ctx, { expr, type })
        },
      },
      c32: {
        js(value) {
          return pt(angleJs({ value, type }), real(0))
        },
        glsl(expr, ctx) {
          return `vec2(${angleGlsl(ctx, { expr, type })}, 0)`
        },
      },
    },
    write: {
      display(value, props) {
        new CmdWord(type, "prefix").insertAt(props.cursor, L)
        const inner = new Block(null)
        const brack = new CmdBrack("(", ")", null, inner)
        brack.insertAt(props.cursor, L)
        let first = true
        props = props.at(inner.cursor(R))
        for (const pt of value) {
          if (first) {
            first = false
          } else {
            new CmdComma().insertAt(props.cursor, L)
          }
          const block = new Block(null)
          new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          const inner = props.at(block.cursor(R))
          inner.num(pt.x)
          new CmdComma().insertAt(inner.cursor, L)
          inner.num(pt.y)
        }
      },
      isApprox(value) {
        return value.some((x) => x.x.type == "approx" || x.y.type == "approx")
      },
    },
    order: Order.Angle,
    point: false,
    icon() {
      return h(
        "",
        h(
          "text-black dark:text-slate-500 size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
          h(
            "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
          ),
          h(
            "w-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            svg(),
          ),
        ),
      )
    },
    token(val) {
      const p1 = unpt(val[0])
      const p2 = unpt(val[1])
      const p3 = unpt(val[2])

      const measure =
        (Math.atan2(p1.x - p2.x, p1.y - p2.y) -
          Math.atan2(p3.x - p2.x, p3.y - p2.y) +
          2 * Math.PI) %
        (2 * Math.PI)

      const swap = measure > Math.PI

      const o1 = { x: p1.x, y: -p1.y }
      const o2 = { x: p2.x, y: -p2.y }
      const o3 = { x: p3.x, y: -p3.y }
      const s1 = normVector(o2, o1, LINE)
      const s3 = normVector(o2, o3, LINE)
      const a1 = normVector(o2, o1, ARC)
      const a3 = normVector(o2, o3, ARC)

      const els: SVGElement[] = []

      for (const s of [s1, s3]) {
        els.push(sx("line", { x1: o2.x, y1: o2.y, x2: s.x, y2: s.y }))
      }

      const src = swap ? a3 : a1
      const dst = swap ? a1 : a3

      const path =
        type == "angle" && Math.abs((measure % Math.PI) - Math.PI / 2) < 9e-7 ?
          `M ${src.x} ${src.y} L ${a1.x + a3.x - o2.x} ${a1.y + a3.y - o2.y} L ${dst.x} ${dst.y}`
        : `M ${src.x} ${src.y} A ${ARC} ${ARC} 0 0 0 ${dst.x} ${dst.y}`

      const g = sx("g", "", sx("path", { d: path }))

      if (type == "directedangle") {
        const size = Math.max(
          8,
          Math.min(
            16,
            ((measure > Math.PI ? 2 * Math.PI - measure : measure) * ARC) / 2,
          ),
        )

        // source: https://www.desmos.com/geometry/e4uy7yykhv
        // rotates the triangle so the center of the back edge is on the angle's arc
        const adj = 0.0323385 * size - 0.00388757

        const tilt = swap ? -adj : Math.PI + adj
        const dx1 =
          Math.cos(tilt) * (a3.y - o2.y) + Math.sin(tilt) * (a3.x - o2.x)
        const dy1 =
          Math.cos(tilt) * (a3.x - o2.x) - Math.sin(tilt) * (a3.y - o2.y)

        const dx = -dx1
        const dy = dy1
        const nx = (size * dx) / Math.hypot(dx, dy)
        const ny = (size * dy) / Math.hypot(dx, dy)
        const ox = a3.x - nx
        const oy = a3.y - ny
        const w = 0.4

        g.appendChild(
          sx("path", {
            d: `M ${a3.x} ${a3.y} L ${ox + w * ny} ${oy - w * nx} L ${ox - w * ny} ${oy + w * nx} Z`,
            fill: "currentcolor",
          }),
        )
      } else {
        g.appendChild(
          sx("path", {
            "d": `${path} L ${o2.x} ${o2.y} Z`,
            "fill": "var(--nya-angle)",
            "fill-opacity": 0.3,
          }),
        )
      }

      els.push(g)

      return createToken("var(--nya-angle)", ...els)
    },
    glide: null,
    preview(cv, val) {
      drawAngleCv(cv, unpt(val[0]), unpt(val[1]), unpt(val[2]), { kind: type })
    },
    extras: null,
  }
}

const INFO_ANGLE = angleInfo("angle", () =>
  svgx(
    "2.2 4.4 17.6 13.2",
    "stroke-current fill-none overflow-visible [stroke-linejoin:round] [stroke-linecap:round] stroke-2",
    path(
      "M 19.8 13.2 L 2.2 17.6 L 7.2 4.4 M 9.96114000116 15.6597149997 A 8 8 0 0 0 5.03381650088 10.1187244377",
    ),
  ),
)

const INFO_DIRECTEDANGLE = angleInfo("directedangle", () =>
  svgx(
    "2.2 4.4 17.6 13.2",
    "stroke-current fill-none overflow-visible [stroke-linejoin:round] [stroke-linecap:round] stroke-2",
    path(
      "M 19.8 13.2 L 2.2 17.6 L 7.2 4.4 M 6.55 6.116 A 12.28 12.28 0 0 1 14.113 14.621",
    ),
    sx("path", {
      d: "M 14.11360097 14.62159976 L 8.057568123 10.64149487 13.89384933 7.378086938 Z",
      fill: "currentcolor",
    }),
  ),
)

function iconPerpendicular() {
  return h(
    "",
    h(
      "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
      h(
        "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
      ),
      h(
        "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
      ),
      h(
        "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current opacity-30 rotate-[60deg]",
      ),
      h(
        "size-1 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#6042a6]",
      ),
    ),
  )
}

function iconParallel() {
  return h(
    "",
    h(
      "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
      h(
        "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
      ),
      h(
        "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_+_4px)] border-t-2 border-current -rotate-[30deg]",
      ),
      h(
        "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_-_4px)] border-t-2 border-current opacity-30 -rotate-[30deg]",
      ),
      h(
        "size-1 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(-50%_+_4px)] bg-[#6042a6]",
      ),
    ),
  )
}

function iconMidpoint() {
  return h(
    "",
    h(
      "text-[#6042a6] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
      h(
        "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
      ),
      h(
        "text-[#2d70b3] w-[20px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
      ),
      h(
        "size-1 absolute rounded-full top-1/2 left-1/2 [transform:translate(-50%,-50%)_rotate(-30deg)_translate(-8px,0)] bg-[#6042a6]",
      ),
      h(
        "size-1 absolute rounded-full top-1/2 left-1/2 [transform:translate(-50%,-50%)_rotate(-30deg)_translate(8px,0)] bg-[#6042a6]",
      ),
      h(
        "size-[7px] absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#6042a6]",
      ),
    ),
  )
}

function iconAngleBisector() {
  return h(
    "",
    h(
      "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
      h(
        "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
      ),
      h(
        "w-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        svgx(
          "2.2 4.4 17.6 13.2",
          "stroke-current fill-none overflow-visible [stroke-linejoin:round] [stroke-linecap:round] stroke-2",
          sx("path", {
            d: "M 19.8 13.2 L 2.2 17.6 L 7.2 4.4 M 6.55 6.116 A 12.28 12.28 0 0 1 14.113 14.621",
            class: "opacity-30",
          }),
          path("M 2.2 17.6 L 76.9 -48.9"),
        ),
      ),
    ),
  )
}

const PICK_ANGLE = createPick("angle")
const PICK_DIRECTEDANGLE = createPick("directedangle")

const PICK_ANGLEBISECTOR = definePickTy(
  "anglebisector",
  [["angle", "directedangle"]],
  (sheet, a) => {
    if (a) {
      const [p1, p2] = bisectAngleJs(a)
      const bounds = getRayBounds(sheet.cv, unpt(p1), unpt(p2))
      if (bounds) sheet.cv.polygonByCanvas(bounds, Size.Line, Color.Blue)
    }
  },
)

// straightedge and compass
const sc =
  globalThis.URLSearchParams ?
    !new URLSearchParams(globalThis.location?.search).has("sconly")
  : true

const PICK_POINT = definePickTy(null, [["point32", "point64"]], () => {})

export default {
  name: "geometry",
  label: "geometric objects and constructions",
  category: "geometry",
  deps: ["geo/point", "num/real"],
  ty: {
    info: {
      segment: INFO_SEGMENT,
      ray: INFO_RAY,
      line: INFO_LINE,
      vector: INFO_VECTOR,
      circle: INFO_CIRCLE,
      arc: INFO_ARC,
      polygon: INFO_POLYGON,
      angle: INFO_ANGLE,
      directedangle: INFO_DIRECTEDANGLE,
    },
  },
  eval: {
    fn: {
      "center": FN_CENTER,
      "circle": FN_CIRCLE,
      "distance": FN_DISTANCE,
      "end": FN_END,
      "glider": FN_GLIDER,
      "intersection": FN_INTERSECTION,
      "line": FN_LINE,
      "midpoint": FN_MIDPOINT,
      "parallel": FN_PARALLEL,
      "perpendicular": FN_PERPENDICULAR,
      "polygon": FN_POLYGON,
      "radius": FN_RADIUS,
      "ray": FN_RAY,
      "segment": FN_SEGMENT,
      "segments": FN_SEGMENTS,
      "start": FN_START,
      "vector": FN_VECTOR,
      "vertices": FN_VERTICES,
      "angle": FN_ANGLE,
      "directed angle": FN_DIRECTEDANGLE,
      "angles": FN_ANGLES,
      "directed angles": FN_DIRECTEDANGLES,
      "angle bisector": FN_ANGLEBISECTOR,
      "perpendicular bisector": FN_PERPENDICULARBISECTOR,
      "arc": FN_ARC,
      "length": FN_LENGTH,
      "translate": FN_TRANSLATE,
      "rotate": FN_ROTATE,
      "dilate": FN_DILATE,
      "reflect": FN_REFLECT,
      "perimeter": FN_PERIMETER,
    },
  },
  sheet: {
    exts: {
      1: [
        EXT_CIRCLE,
        EXT_LINE,
        EXT_POLYGON,
        EXT_RAY,
        EXT_SEGMENT,
        EXT_VECTOR,
        EXT_ANGLE,
        EXT_ARC,
      ],
    },
    toolbar: {
      1: [
        toolbar(() => iconPoint(false), PICK_POINT, "p"),
        toolbar(INFO_SEGMENT.icon, PICK_SEGMENT, "s"),
        toolbar(INFO_RAY.icon, PICK_RAY, "r"),
        toolbar(INFO_LINE.icon, PICK_LINE, "l"),
        sc && toolbar(INFO_VECTOR.icon, PICK_VECTOR, "v"),
        toolbar(INFO_CIRCLE.icon, PICK_CIRCLE, "c"),
        sc && toolbar(INFO_ARC.icon, PICK_ARC, "a"),
        toolbar(INFO_POLYGON.icon, PICK_POLYGON, "P"),
        toolbar(INFO_ANGLE.icon, PICK_ANGLE, "A"),
        toolbar(INFO_DIRECTEDANGLE.icon, PICK_DIRECTEDANGLE, "d"),
        sc && toolbar(iconPerpendicular, PICK_PERPENDICULAR, "x"),
        sc && toolbar(iconParallel, PICK_PARALLEL, "z"),
        sc && toolbar(iconMidpoint, PICK_MIDPOINT, "m"),
        sc && toolbar(iconAngleBisector, PICK_ANGLEBISECTOR, "b"),
      ].filter((x) => x != false),
    },
    keys: {
      s: (sheet) => sheet.pick.set(PICK_TY, PICK_SEGMENT),
      r: (sheet) => sheet.pick.set(PICK_TY, PICK_RAY),
      l: (sheet) => sheet.pick.set(PICK_TY, PICK_LINE),
      v: (sheet) => sheet.pick.set(PICK_TY, PICK_VECTOR),
      c: (sheet) => sheet.pick.set(PICK_TY, PICK_CIRCLE),
      a: (sheet) => sheet.pick.set(PICK_TY, PICK_ARC),
      x: (sheet) => sheet.pick.set(PICK_TY, PICK_PERPENDICULAR),
      z: (sheet) => sheet.pick.set(PICK_TY, PICK_PARALLEL),
      m: (sheet) => sheet.pick.set(PICK_TY, PICK_MIDPOINT),
      P: (sheet) => sheet.pick.set(PICK_TY, PICK_POLYGON),
      A: (sheet) => sheet.pick.set(PICK_TY, PICK_ANGLE),
      d: (sheet) => sheet.pick.set(PICK_TY, PICK_DIRECTEDANGLE),
      b: (sheet) => sheet.pick.set(PICK_TY, PICK_ANGLEBISECTOR),
      p: (sheet) => sheet.pick.set(PICK_TY, PICK_POINT),
    },
  },
} satisfies Package
