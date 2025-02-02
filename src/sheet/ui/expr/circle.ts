import { h } from "../../../jsx"

export type CircleKind = "shader" | "empty"

export function circle(kind: CircleKind) {
  switch (kind) {
    case "shader":
      // prettier-ignore
      return h(
        "relative block bg-white size-8 rounded-full mx-0.5 overflow-clip group-focus-within:outline outline-2 outline-blue-500",
        h("size-[27.27%] top-[00.00%] left-[00.00%] absolute bg-red-300 rounded-br-[25%]"),
        h("size-[27.27%] top-[00.00%] left-[36.36%] absolute bg-yellow-300 rounded-b-[25%]"),
        h("size-[27.27%] top-[00.00%] left-[72.72%] absolute bg-fuchsia-300 rounded-bl-[25%]"),
        h("size-[27.27%] top-[36.36%] left-[00.00%] absolute bg-blue-300 rounded-r-[25%]"),
        h("size-[27.27%] top-[36.36%] left-[36.36%] absolute bg-slate-400 rounded-[25%]"),
        h("size-[27.27%] top-[36.36%] left-[72.72%] absolute bg-green-300 rounded-l-[25%]"),
        h("size-[27.27%] top-[72.72%] left-[00.00%] absolute bg-slate-300 rounded-tr-[25%]"),
        h("size-[27.27%] top-[72.72%] left-[36.36%] absolute bg-purple-300 rounded-t-[25%]"),
        h("size-[27.27%] top-[72.72%] left-[72.72%] absolute bg-orange-300 rounded-tl-[25%]"),
      )
    case "empty":
      return h(
        "relative block bg-[--nya-bg-sidebar] size-8 rounded-full mx-0.5 border-4 border-slate-300 group-focus-within:border-blue-500",
      )
  }
}
