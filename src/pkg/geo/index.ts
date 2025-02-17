import type { Package } from ".."
import type { JsVal, SPoint, TyComponents, Tys } from "../../eval/ty"
import { num, pt, real, unpt } from "../../eval/ty/create"
import { gliderOnLine, WRITE_POINT, type TyInfo } from "../../eval/ty/info"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdWord } from "../../field/cmd/leaf/word"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { h, p, svgx } from "../../jsx"
import {
  drawPoint,
  FN_GLIDER,
  FN_INTERSECTION,
  PKG_GEO_POINT,
} from "../geo-point"
import { PKG_REAL } from "../num-real"
import { drawCircle, EXT_CIRCLE } from "./ext/circle"
import { drawLine, EXT_LINE } from "./ext/line"
import { drawPolygon, EXT_POLYGON } from "./ext/polygon"
import { drawRay, EXT_RAY } from "./ext/ray"
import { drawSegment, EXT_SEGMENT } from "./ext/segment"
import { drawVector, EXT_VECTOR } from "./ext/vector"
import { FN_CENTER } from "./fn/center"
import { FN_CIRCLE } from "./fn/circle"
import { FN_DISTANCE } from "./fn/distance"
import { FN_END } from "./fn/end"
import "./fn/glider"
import "./fn/intersection"
import { FN_LINE } from "./fn/line"
import { FN_MIDPOINT } from "./fn/midpoint"
import { FN_PARALLEL, parallelJs } from "./fn/parallel"
import { FN_PERPENDICULAR, perpendicularJs } from "./fn/perpendicular"
import { FN_POLYGON } from "./fn/polygon"
import { FN_RADIUS } from "./fn/radius"
import { FN_RAY } from "./fn/ray"
import { FN_SEGMENT } from "./fn/segment"
import { FN_SEGMENTS } from "./fn/segments"
import { FN_START } from "./fn/start"
import { FN_VECTOR } from "./fn/vector"
import { FN_VERTICES } from "./fn/vertices"
import {
  createPickByTy,
  PICK_BY_TY,
  picker,
  type PropsByTy,
} from "./pick-normal"

declare module "../../eval/ty/index.js" {
  interface Tys {
    segment: [SPoint, SPoint]
    ray: [SPoint, SPoint]
    line: [SPoint, SPoint]
    vector: [SPoint, SPoint]
    circle: { center: SPoint; radius: SReal }
    polygon: SPoint[]
  }

  interface TyComponents {
    segment: never
    ray: never
    line: never
    vector: never
    circle: never
    polygon: never
  }
}

const NANPT = pt(real(NaN), real(NaN))

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
    garbage: { js: [NANPT, NANPT], glsl: "vec4(0.0/0.0)" },
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
            [unpt(props.shape[0]), unpt(props.shape[1])],
            props.point,
            props.paper,
          )

          return {
            value: glide(raw.value),
            precision: raw.precision,
          }
        }
      : undefined,
  }
}

const PICK_LINE = createPickByTy(
  "l",
  "line",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      drawLine([p1.value, p2.value], sheet.paper, false, false)
    }
  },
)

const PICK_SEGMENT = createPickByTy(
  "l",
  "segment",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      drawSegment([p1.value, p2.value], sheet.paper, false, false)
    }
  },
)

const PICK_RAY = createPickByTy(
  "l",
  "ray",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      drawRay([p1.value, p2.value], sheet.paper, false, false)
    }
  },
)

const PICK_VECTOR = createPickByTy(
  "l",
  "vector",
  [
    ["point32", "point64"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      drawVector([p1.value, p2.value], sheet.paper)
    }
  },
)

const PICK_CIRCLE = createPickByTy(
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
      const radius = Math.hypot(center.x - edge.x, center.y - edge.y)
      drawCircle(center, radius, sheet.paper, false, false)
    }
  },
)

const PICK_PERPENDICULAR = createPickByTy(
  "l",
  "perpendicular",
  [
    ["segment", "ray", "line", "vector"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const line = perpendicularJs(p1, p2)
      drawLine(line, sheet.paper, false, false)
    }
  },
)

const PICK_PARALLEL = createPickByTy(
  "l",
  "parallel",
  [
    ["segment", "ray", "line", "vector"],
    ["point32", "point64"],
  ],
  (sheet, p1, p2) => {
    if (p1 && p2) {
      const line = parallelJs(p1, p2)
      drawLine(line, sheet.paper, false, false)
    }
  },
)

const PICK_MIDPOINT: PropsByTy = {
  chosen: [],
  next: ["point32", "point64", "segment"],
  ext: {
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

      drawPoint(sheet.paper, { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 })
    },
  },
}

const PICK_POLYGON: PropsByTy = {
  chosen: [],
  next: ["point32", "point64"],
  ext: {
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
        pts.map((x) => x.value),
        sheet.paper,
        false,
        false,
      )
    },
  },
}

const INFO_SEGMENT = lineInfo(
  "line segment",
  "line segements",
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

const INFO_CIRCLE: TyInfo<Tys["circle"], TyComponents["circle"]> = {
  name: "circle",
  namePlural: "circles",
  glsl: "vec3",
  garbage: {
    js: { center: NANPT, radius: real(NaN) },
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
    const circumPaper = Math.hypot(props.point.x - x, props.point.y - y)
    const circumCanvas =
      2 * Math.PI * props.paper.canvasDistance(props.point, { x, y })
    return {
      precision: circumCanvas / circumPaper,
      value: angle / 2 / Math.PI,
    }
  },
}

const INFO_POLYGON: TyInfo<Tys["polygon"], TyComponents["polygon"]> = {
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
            p("M 7.2 4.4 L 19.8 13.2 L 2.2 17.6 Z"),
          ),
        ),
      ),
    )
  },
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
    },
  },
  eval: {
    fns: {
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
    },
  },
  sheet: {
    exts: {
      1: [EXT_CIRCLE, EXT_LINE, EXT_POLYGON, EXT_RAY, EXT_SEGMENT, EXT_VECTOR],
    },
    toolbar: {
      1: [
        picker(INFO_SEGMENT.icon, PICK_SEGMENT),
        picker(INFO_RAY.icon, PICK_RAY),
        picker(INFO_LINE.icon, PICK_LINE),
        picker(INFO_VECTOR.icon, PICK_VECTOR),
        picker(INFO_CIRCLE.icon, PICK_CIRCLE),
        picker(INFO_POLYGON.icon, PICK_POLYGON),
        picker(
          () =>
            h(
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
            ),
          PICK_PERPENDICULAR,
        ),
        picker(
          () =>
            h(
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
            ),
          PICK_PARALLEL,
        ),
        picker(
          () =>
            h(
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
            ),
          PICK_MIDPOINT,
        ),
      ],
    },
    keys: {
      s: (sheet) => sheet.setPick(PICK_BY_TY, PICK_SEGMENT),
      r: (sheet) => sheet.setPick(PICK_BY_TY, PICK_RAY),
      l: (sheet) => sheet.setPick(PICK_BY_TY, PICK_LINE),
      v: (sheet) => sheet.setPick(PICK_BY_TY, PICK_VECTOR),
      c: (sheet) => sheet.setPick(PICK_BY_TY, PICK_CIRCLE),
      x: (sheet) => sheet.setPick(PICK_BY_TY, PICK_PERPENDICULAR),
      z: (sheet) => sheet.setPick(PICK_BY_TY, PICK_PARALLEL),
      m: (sheet) => sheet.setPick(PICK_BY_TY, PICK_MIDPOINT),
    },
  },
}
