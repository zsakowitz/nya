import type { Package } from ".."
import type { JsVal, SPoint } from "../../eval/ty"
import { num, real, SNANPT, unpt } from "../../eval/ty/create"
import {
  gliderOnLine,
  WRITE_POINT,
  type TyInfo,
  type TyInfoByName,
} from "../../eval/ty/info"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdWord } from "../../field/cmd/leaf/word"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { h, path, svgx, sx } from "../../jsx"
import { definePickTy, PICK_TY, toolbar, type Data } from "../../sheet/pick-ty"
import { segmentByPaper } from "../../sheet/ui/paper"
import {
  drawPoint,
  FN_GLIDER,
  FN_INTERSECTION,
  PKG_GEO_POINT,
} from "../geo-point"
import { PKG_REAL } from "../num-real"
import { computeArcVal, unglideArc } from "./arc"
import { angleGlsl, angleJs, drawAngle, EXT_ANGLE } from "./ext/angle"
import { drawArc, EXT_ARC } from "./ext/arc"
import { drawCircle, EXT_CIRCLE } from "./ext/circle"
import { drawLine, EXT_LINE } from "./ext/line"
import { drawPolygon, EXT_POLYGON } from "./ext/polygon"
import { drawRay, EXT_RAY } from "./ext/ray"
import { EXT_SEGMENT } from "./ext/segment"
import { drawVector, EXT_VECTOR } from "./ext/vector"
import { FN_ANGLE, FN_DIRECTEDANGLE } from "./fn/angle"
import { FN_ANGLEBISECTOR } from "./fn/anglebisector"
import { FN_ANGLES, FN_DIRECTEDANGLES } from "./fn/angles"
import { FN_ARC } from "./fn/arc"
import { FN_CENTER } from "./fn/center"
import { FN_CIRCLE } from "./fn/circle"
import { FN_DISTANCE } from "./fn/distance"
import { FN_END } from "./fn/end"
import "./fn/glider"
import "./fn/intersection"
import { FN_LENGTH } from "./fn/length"
import { FN_LINE } from "./fn/line"
import { FN_MIDPOINT } from "./fn/midpoint"
import { FN_PARALLEL, parallelJs } from "./fn/parallel"
import { FN_PERPENDICULAR, perpendicularJs } from "./fn/perpendicular"
import { FN_PERPENDICULARBISECTOR } from "./fn/perpendicularbisector"
import { FN_POLYGON } from "./fn/polygon"
import { FN_RADIUS } from "./fn/radius"
import { FN_RAY } from "./fn/ray"
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
    line: [SPoint, SPoint]
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

function lineInfo(
  name: string,
  namePlural: string,
  clsx: string,
  glide: ((bound: number) => number) | null,
): TyInfo<[SPoint, SPoint], never> {
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
    icon() {
      return h(
        "",
        h(
          "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
          h(
            "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
          ),
          h(clsx),
        ),
      )
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
  }
}

const PICK_LINE = definePickTy(
  "l",
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
  "l",
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
  "l",
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
  "l",
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
  "c",
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
  "a",
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
  "l",
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
  "l",
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

const PICK_ANGLE = definePickTy(
  "a",
  "angle",
  [
    ["point32", "point64"],
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2, p3) => {
    if (p1 && p2 && p3) {
      drawAngle(sheet.paper, unpt(p1.value), unpt(p2.value), unpt(p3.value), {
        draft: true,
        type: "angle",
      })
    }
  },
)

const PICK_DIRECTEDANGLE = definePickTy(
  "a",
  "directedangle",
  [
    ["point32", "point64"],
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2, p3) => {
    if (p1 && p2 && p3) {
      drawAngle(sheet.paper, unpt(p1.value), unpt(p2.value), unpt(p3.value), {
        draft: true,
        type: "directedangle",
      })
    }
  },
)

const PICK_MIDPOINT: Data = {
  vals: [],
  next: ["point32", "point64", "segment"],
  src: {
    id: Math.random(),
    output: { tag: "p", fn: "midpoint" },
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
    output: { tag: "P", fn: "polygon" },
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
)

const INFO_RAY = lineInfo(
  "ray",
  "rays",
  "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 translate-x-[-10px] translate-y-[-3.5px] border-t-2 border-current -rotate-[30deg]",
  (x) => Math.max(0, x),
)

const INFO_LINE = lineInfo(
  "line",
  "lines",
  "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
  (x) => x,
)

const INFO_VECTOR = lineInfo(
  "vector",
  "vectors",
  "w-[20px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg] after:absolute after:content-['_'] after:bg-current after:top-[-4px] after:right-[-1px] after:bottom-[-2px] after:w-[6px] after:[clip-path:polygon(0%_0%,100%_50%,0%_100%)]",
  null,
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
  glide(props) {
    return unglideArc(props.paper, computeArcVal(props.shape), props.point)
  },
}

function angleInfo(
  type: "angle" | "directedangle",
  svg: () => SVGSVGElement,
): TyInfoByName<"angle" | "directedangle"> {
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
        toolbar(iconPerpendicular, PICK_PERPENDICULAR, "x"),
        toolbar(iconParallel, PICK_PARALLEL, "c"),
        toolbar(iconMidpoint, PICK_MIDPOINT, "m"),
        toolbar(INFO_DIRECTEDANGLE.icon, PICK_DIRECTEDANGLE, "d"),
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
    },
  },
}
