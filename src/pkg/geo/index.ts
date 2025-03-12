import type { Package } from ".."
import type { JsVal, Tys } from "../../eval/ty"
import { SNANPT, num, pt, real, unpt } from "../../eval/ty/create"
import {
  WRITE_POINT,
  gliderOnLine,
  type TyInfo,
  type TyInfoByName,
} from "../../eval/ty/info"
import { OpEq } from "../../field/cmd/leaf/cmp"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdDot } from "../../field/cmd/leaf/dot"
import { CmdNum } from "../../field/cmd/leaf/num"
import { CmdToken, createToken } from "../../field/cmd/leaf/token"
import { CmdVar } from "../../field/cmd/leaf/var"
import { CmdWord } from "../../field/cmd/leaf/word"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { h, path, svgx, sx } from "../../jsx"
import { PICK_TY, definePickTy, toolbar, type Data } from "../../sheet/pick-ty"
import { normVector, type Point } from "../../sheet/point"
import { Colors, Size } from "../../sheet/ui/cv/consts"
import { Expr } from "../../sheet/ui/expr"
import { segmentByPaper } from "../../sheet/ui/paper"
import type { Selected } from "../../sheet/ui/sheet"
import {
  FN_GLIDER,
  FN_INTERSECTION,
  PKG_GEO_POINT,
  drawPoint,
} from "../geo-point"
import { PKG_REAL } from "../num-real"
import { computeArcVal, unglideArc } from "./arc"
import {
  EXT_ANGLE,
  angleGlsl,
  angleJs,
  drawAngle,
  drawAngleCv,
} from "./ext/angle"
import { EXT_ARC, drawArc, drawArcCv } from "./ext/arc"
import { EXT_CIRCLE, drawCircle } from "./ext/circle"
import { EXT_LINE, drawLine, getLineBounds } from "./ext/line"
import { EXT_POLYGON, drawPolygon } from "./ext/polygon"
import { EXT_RAY, drawRay, getRayBounds } from "./ext/ray"
import { EXT_SEGMENT } from "./ext/segment"
import { EXT_VECTOR, drawVector, vectorPath } from "./ext/vector"
import { FN_ANGLE, FN_DIRECTEDANGLE } from "./fn/angle"
import { FN_ANGLEBISECTOR, bisectAngleJs } from "./fn/anglebisector"
import { FN_ANGLES, FN_DIRECTEDANGLES } from "./fn/angles"
import { FN_ARC } from "./fn/arc"
import { FN_CENTER } from "./fn/center"
import { FN_CIRCLE } from "./fn/circle"
import { FN_DILATE } from "./fn/dilate"
import { FN_DISTANCE } from "./fn/distance"
import { FN_END } from "./fn/end"
import "./fn/glider"
import "./fn/intersection"
import { FN_LENGTH } from "./fn/length"
import { FN_LINE } from "./fn/line"
import { FN_MIDPOINT } from "./fn/midpoint"
import { FN_PARALLEL, parallelJs } from "./fn/parallel"
import { FN_PERIMETER } from "./fn/perimeter"
import { FN_PERPENDICULAR, perpendicularJs } from "./fn/perpendicular"
import { FN_PERPENDICULARBISECTOR } from "./fn/perpendicularbisector"
import { FN_POLYGON } from "./fn/polygon"
import { FN_RADIUS } from "./fn/radius"
import { FN_RAY } from "./fn/ray"
import { FN_REFLECT } from "./fn/reflect"
import { FN_ROTATE } from "./fn/rotate"
import { FN_SEGMENT } from "./fn/segment"
import { FN_SEGMENTS } from "./fn/segments"
import { FN_START } from "./fn/start"
import { FN_TRANSLATE } from "./fn/translate"
import { FN_VECTOR } from "./fn/vector"
import { FN_VERTICES } from "./fn/vertices"

declare module "../../eval/ty" {
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

  interface TyComponents {
    segment: never
    ray: never
    line: never
    vector: never
    circle: never
    polygon: never
    angle: never
    directedangle: never
    arc: never
  }
}

function lineInfo<T extends "segment" | "ray" | "line" | "vector">(
  name: T,
  namePlural: string,
  clsx: string | (() => HTMLElement),
  glide: ((bound: number) => number) | null,
  token: (a: Point, b: Point, source: Tys[T]) => HTMLSpanElement | null,
): TyInfo<Tys[T], never> {
  return {
    name,
    namePlural,
    glsl: "vec4",
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
            props.paper,
            [unpt(props.shape[0]), unpt(props.shape[1])],
            props.point,
          )

          return {
            value: glide(raw.value),
            precision: raw.precision,
          }
        }
      : undefined,
    preview(cv, val) {
      switch (name) {
        case "segment": {
          cv.polygon(val.map(unpt), Size.Line, Colors.Blue)
          break
        }
        case "ray": {
          const bounds = getRayBounds(cv, unpt(val[0]), unpt(val[1]))
          if (bounds) cv.polygonByCanvas(bounds, Size.Line, Colors.Blue)
          break
        }
        case "line": {
          const bounds = getLineBounds(unpt(val[0]), unpt(val[1]), cv)
          if (bounds) cv.polygonByCanvas(bounds, Size.Line, Colors.Blue)
          break
        }
        case "vector": {
          const path = vectorPath(cv, unpt(val[0]), unpt(val[1]))
          if (path) cv.path(new Path2D(path), Size.Line, Colors.Blue, 1, 1)
          break
        }
      }
    },
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
      drawLine(sheet.paper, unpt(p1.value), unpt(p2.value), { ghost: true })
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
      segmentByPaper(sheet.paper, unpt(p1.value), unpt(p2.value), {
        ghost: true,
      })
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
      drawRay(sheet.paper, unpt(p1.value), unpt(p2.value), {
        ghost: true,
        kind: "ray",
      })
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
      drawVector(sheet.paper, unpt(p1.value), unpt(p2.value), {
        ghost: true,
      })
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
      drawCircle(sheet.paper, {
        at: center,
        r: Math.hypot(center.x - edge.x, center.y - edge.y),
        ghost: true,
        kind: "circle",
      })
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
      drawArc(sheet.paper, {
        arc: computeArcVal([p1.value, p2.value, p3.value]),
        ghost: true,
        kind: "arc",
      })
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
      drawLine(sheet.paper, unpt(line[0]), unpt(line[1]), { ghost: true })
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
      drawLine(sheet.paper, unpt(line[0]), unpt(line[1]), { ghost: true })
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
            drawAngle(sheet.paper, unpt(prev), unpt(self), unpt(next), {
              draft: true,
              kind: type,
            })
          }
        } else if (a && b && c) {
          drawAngle(sheet.paper, unpt(a.value), unpt(b.value), unpt(c.value), {
            draft: true,
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

          const token = CmdToken.new(expr.field.ctx)
          token.insertAt(cursor, L)
          new OpEq(false).insertAt(cursor, L)

          a.ref().insertAt(cursor, L)
          new CmdDot().insertAt(cursor, L)
          for (const c of type + "s") {
            new CmdVar(c, sheet.options).insertAt(cursor, L)
          }

          const index = new Block(null)
          new CmdBrack("[", "]", null, index).insertAt(cursor, L)
          {
            const cursor = index.cursor(R)
            for (const char of BigInt(i + 1).toString()) {
              new CmdNum(char).insertAt(cursor, L)
            }
          }

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

      drawPoint(sheet.paper, {
        at: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
        ghost: true,
      })
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

      drawPolygon(
        sheet.paper,
        pts.map((x) => unpt(x.value)),
        { closed: false, ghost: true },
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
            class: "size-[22px] absolute inset-0 fill-none stroke-current",
            viewBox: "0 0 22 22",
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
            class: "size-[22px] absolute inset-0 fill-none stroke-current",
            viewBox: "0 0 22 22",
            "stroke-linecap": "round",
            "stroke-width": 2,
          },
          c.source == "perpendicular" ?
            sx("path", {
              d: `M ${11 - 50 * y} ${11 + 50 * x} L ${11 + 50 * y} ${11 - 50 * x}`,
              "stroke-opacity": 0.3,
            })
          : null,
          c.source == "parallel" ?
            sx("path", {
              d: `M ${11 + 4 * y - 50 * x} ${11 - 4 * x - 50 * y} L ${11 + 4 * y + 50 * x} ${11 - 4 * x + 50 * y}`,
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
            class: "size-[22px] absolute inset-0 fill-current stroke-current",
            viewBox: "0 0 22 22",
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
            class: "size-[22px] absolute inset-0 fill-current stroke-current",
            viewBox: "0 0 22 22",
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
  glide(props) {
    const x = num(props.shape.center.x)
    const y = num(props.shape.center.y)
    const angle =
      props.point.x == x && props.point.y == y ?
        0
      : Math.atan2(props.point.y - y, props.point.x - x)
    return {
      precision:
        2 * Math.PI * props.paper.offsetDistance(props.point, { x, y }),
      value: angle / 2 / Math.PI,
    }
  },
  preview(cv, val) {
    cv.circle(unpt(val.center), num(val.radius), Size.Line, Colors.Green)
  },
}

const INFO_POLYGON: TyInfoByName<"polygon"> = {
  name: "polygon",
  namePlural: "polygons",
  get glsl(): never {
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
      path(
        `M ${pts[0]!.x} ${-pts[0]!.y}${pts.slice(1).map((pt) => ` L ${pt.x} ${-pt.y}`)} Z`,
      ),
    )
  },
  preview(cv, val) {
    cv.polygon(val.map(unpt), Size.Line, Colors.Blue, 1, 0.3, false)
  },
}

const INFO_ARC: TyInfoByName<"arc"> = {
  name: "arc",
  namePlural: "arcs",
  glsl: "mat3x2",
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
            d: "M 6.821075367479289 58.046972674137905 A 60.375975878779 -60.375975878779 0 0 1 60.110633724316074 7.562127915029379",
            stroke: "#388c46",
            "stroke-linecap": "round",
            "stroke-width": 8,
          }),
          sx("circle", {
            cx: 6.821075367479289,
            cy: 58.046972674137905,
            r: 8,
            fill: "#6042a6",
          }),
          sx("circle", {
            cx: 15.235216160664043,
            cy: 35.60926389231189,
            r: 8,
            fill: "#6042a6",
          }),
          sx("circle", {
            cx: 60.110633724316074,
            cy: 7.562127915029379,
            r: 8,
            fill: "#6042a6",
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
                class: "size-[22px] absolute inset-0 fill-none stroke-current",
                viewBox: "0 0 22 22",
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
    return unglideArc(props.paper, computeArcVal(props.shape), props.point)
  },
  preview(cv, val) {
    const arc = computeArcVal(val)
    drawArcCv(cv, arc)
  },
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
      q32: {
        js(value) {
          return [angleJs({ value, type }), real(0), real(0), real(0)]
        },
        glsl(expr, ctx) {
          return `vec4(${angleGlsl(ctx, { expr, type })}, 0, 0, 0)`
        },
      },
    },
    garbage: {
      js: [SNANPT, SNANPT, SNANPT],
      glsl: "mat3x2(vec2(0.0/0.0),vec2(0.0/0.0),vec2(0.0/0.0))",
    },
    glsl: "mat3x2",
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
            d: `${path} L ${o2.x} ${o2.y} Z`,
            fill: "var(--nya-angle)",
            "fill-opacity": 0.3,
          }),
        )
      }

      els.push(g)

      return createToken("var(--nya-angle)", ...els)
    },
    preview(cv, val) {
      drawAngleCv(cv, unpt(val[0]), unpt(val[1]), unpt(val[2]), { kind: type })
    },
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
      drawRay(sheet.paper, unpt(p1), unpt(p2), { ghost: true, kind: "ray" })
    }
  },
)

export const PKG_GEOMETRY: Package = {
  id: "nya:geometry",
  name: "geometry",
  label: "geometric objects and constructions",
  deps: [() => PKG_GEO_POINT, () => PKG_REAL],
  ty: {
    info: {
      segment: INFO_SEGMENT,
      ray: INFO_RAY,
      line: INFO_LINE,
      vector: INFO_VECTOR,
      circle: INFO_CIRCLE,
      polygon: INFO_POLYGON,
      angle: INFO_ANGLE,
      directedangle: INFO_DIRECTEDANGLE,
      arc: INFO_ARC,
    },
  },
  eval: {
    fn: {
      center: FN_CENTER,
      circle: FN_CIRCLE,
      distance: FN_DISTANCE,
      end: FN_END,
      glider: FN_GLIDER,
      intersection: FN_INTERSECTION,
      line: FN_LINE,
      midpoint: FN_MIDPOINT,
      parallel: FN_PARALLEL,
      perpendicular: FN_PERPENDICULAR,
      polygon: FN_POLYGON,
      radius: FN_RADIUS,
      ray: FN_RAY,
      segment: FN_SEGMENT,
      segments: FN_SEGMENTS,
      start: FN_START,
      vector: FN_VECTOR,
      vertices: FN_VERTICES,
      angle: FN_ANGLE,
      directedangle: FN_DIRECTEDANGLE,
      angles: FN_ANGLES,
      directedangles: FN_DIRECTEDANGLES,
      anglebisector: FN_ANGLEBISECTOR,
      perpendicularbisector: FN_PERPENDICULARBISECTOR,
      arc: FN_ARC,
      length: FN_LENGTH,
      translate: FN_TRANSLATE,
      rotate: FN_ROTATE,
      dilate: FN_DILATE,
      reflect: FN_REFLECT,
      perimeter: FN_PERIMETER,
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
        toolbar(INFO_SEGMENT.icon, PICK_SEGMENT, "s"),
        toolbar(INFO_RAY.icon, PICK_RAY, "r"),
        toolbar(INFO_LINE.icon, PICK_LINE, "l"),
        toolbar(INFO_VECTOR.icon, PICK_VECTOR, "v"),
        toolbar(INFO_CIRCLE.icon, PICK_CIRCLE, "c"),
        toolbar(INFO_ARC.icon, PICK_ARC, "a"),
        toolbar(INFO_POLYGON.icon, PICK_POLYGON, "P"),
        toolbar(INFO_ANGLE.icon, PICK_ANGLE, "A"),
        toolbar(INFO_DIRECTEDANGLE.icon, PICK_DIRECTEDANGLE, "d"),
        toolbar(iconPerpendicular, PICK_PERPENDICULAR, "x"),
        toolbar(iconParallel, PICK_PARALLEL, "z"),
        toolbar(iconMidpoint, PICK_MIDPOINT, "m"),
        toolbar(iconAngleBisector, PICK_ANGLEBISECTOR, "b"),
      ],
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
    },
  },
}
