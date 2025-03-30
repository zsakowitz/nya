import type { Fn } from "@/eval/ops"
import { type WithDocs, ALL_DOCS } from "@/eval/ops/docs"
import type { JsValue } from "@/eval/ty"

function fn(type: "angle" | "directedangle", label: string) {
  const FN: Fn & WithDocs = {
    name: type + "s",
    label,
    js(args): JsValue<"angle" | "directedangle"> {
      if (
        !(
          args.length == 1 &&
          args[0]!.type == "polygon" &&
          args[0]!.list === false
        )
      ) {
        throw new Error(`'${type}s' expects a single polygon.`)
      }
      const polygon = (args[0] as JsValue<"polygon", false>).value
      if (polygon.length < 2) {
        return { type, list: 0, value: [] }
      }
      return {
        type,
        list: polygon.length,
        value: polygon.map((o2, i) => {
          const o1 = polygon[(i + polygon.length - 1) % polygon.length]!
          const o3 = polygon[(i + 1) % polygon.length]!
          return [o1, o2, o3]
        }),
      }
    },
    glsl() {
      throw new Error("Polygons cannot exist in shaders.")
    },
    docs() {
      return [
        {
          params: [{ type: "polygon", list: false }],
          dots: false,
          ret: { type, list: true },
          usage: `${type}(polygon(...))=[${type}(...),${type}(...),...]`,
        },
      ]
    },
  }

  ALL_DOCS.push(FN)

  return FN
}

export const FN_ANGLES = fn(
  "angle",
  "constructs an angle at every vertex of a polygon",
)

export const FN_DIRECTEDANGLES = fn(
  "directedangle",
  "constructs a directed angle at every vertex of a polygon",
)
