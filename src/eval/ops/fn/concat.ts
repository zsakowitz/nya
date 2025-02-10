import type { Ty } from "../../ty"
import { doc } from "../dist"
import { FnDistManual, type FnDistOverload } from "../dist-manual"
import { ALL_DOCS } from "../docs"
import { OP_TO_STR } from "../op/tostr"

export const FN_CONCAT = new (class extends FnDistManual<"str"> {
  constructor() {
    super("concat", "concatenates one or more string-like values into a string")
    ALL_DOCS.push(this)
  }

  signature(args: Ty[]): FnDistOverload<"str"> {
    return {
      params: args.map((x) => x.type),
      type: "str",
      js(...args) {
        return args.flatMap((x) => OP_TO_STR.js1(x).value)
      },
      glsl() {
        throw new Error("Text cannot be created in shaders.")
      },
    }
  }

  docs() {
    const ps = OP_TO_STR.o
      .map((x) => (x.params.length == 1 ? x.params[0]! : null))
      .filter((x) => x != null)
    return [
      ...ps.map((a) => doc([a], "str")),
      ...ps.flatMap((a) => ps.map((b) => doc([a, b], "str"))),
    ]
  }
})()

// FIXME: remove this
// export const FN_CONCAT = new (class extends FnDistManual<"str"> {
//   constructor() {
//     super("concat", "concatenates one or more string-like values into a string")
//     ALL_DOCS.push(this)
//   }
//
//   signature(args: Ty[]): FnDistOverload<"str"> {
//     return {
//       params: args.map((x) => x.type),
//       type: "str",
//       js(...args) {
//         return args.flatMap((x) => {
//           if (x.type == "str") {
//             return x.value as StrSegment[]
//           }
//
//           const block = new Block(null)
//           new Display(block.cursor(R), frac(10, 1)).plainVal(x)
//           return [{ type: "latex", value: block.latex() }]
//         })
//       },
//       glsl() {
//         throw new Error("Text cannot be created in shaders.")
//       },
//     }
//   }
//
//   docs() {
//     return [
//       docByIcon([any()], TY_INFO.str.icon()),
//       docByIcon([any(), any("text-[#2d70b3]")], TY_INFO.str.icon()),
//     ]
//   }
// })()
