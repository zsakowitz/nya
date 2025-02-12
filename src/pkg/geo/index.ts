import type { Package } from ".."
import type { SPoint } from "../../eval/ty"
import { num, pt, real, unpt } from "../../eval/ty/create"
import { gliderOnLine, WRITE_POINT, type TyInfo } from "../../eval/ty/info"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdWord } from "../../field/cmd/leaf/word"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { h, p, svgx } from "../../jsx"
import { FN_CENTER } from "./fn/center"
import { FN_CIRCLE } from "./fn/circle"
import { FN_DISTANCE } from "./fn/distance"
import { FN_END } from "./fn/end"
import { FN_GLIDER } from "./fn/glider"
import { FN_INTERSECTION } from "./fn/intersection"
import { FN_LINE } from "./fn/line"
import { FN_MIDPOINT } from "./fn/midpoint"
import { FN_PARALLEL } from "./fn/parallel"
import { FN_PERPENDICULAR } from "./fn/perpendicular"
import { FN_POLYGON } from "./fn/polygon"
import { FN_RADIUS } from "./fn/radius"
import { FN_RAY } from "./fn/ray"
import { FN_SEGMENT } from "./fn/segment"
import { FN_SEGMENTS } from "./fn/segments"
import { FN_START } from "./fn/start"
import { FN_VECTOR } from "./fn/vector"
import { FN_VERTICES } from "./fn/vertices"

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

export const PKG_GEOMETRY: Package = {
  id: "nya:geometry",
  name: "geometry",
  label: "adds geometric objects and geometric constructions",
  ty: {
    info: {
      segment: lineInfo(
        "line segment",
        "line segements",
        "w-[20px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
        (x) => Math.max(0, Math.min(1, x)),
      ),
      ray: lineInfo(
        "ray",
        "rays",
        "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 translate-x-[-10px] translate-y-[-3.5px] border-t-2 border-current -rotate-[30deg]",
        (x) => Math.max(0, x),
      ),
      line: lineInfo(
        "line",
        "lines",
        "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
        (x) => x,
      ),
      vector: lineInfo(
        "vector",
        "vectors",
        "w-[20px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg] after:absolute after:content-['_'] after:bg-current after:top-[-4px] after:right-[-1px] after:bottom-[-2px] after:w-[6px] after:[clip-path:polygon(0%_0%,100%_50%,0%_100%)]",
        null,
      ),
      circle: {
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
      },
      polygon: {
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
            return value.some(
              (x) => x.x.type == "approx" || x.y.type == "approx",
            )
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
      },
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
}
