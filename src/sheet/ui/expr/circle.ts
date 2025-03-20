import { faQuoteLeft } from "@fortawesome/free-solid-svg-icons/faQuoteLeft"
import { fa } from "@/field/fa"
import { h, path, svgx } from "@/jsx"

export function circle(
  kind: "shaderon" | "empty" | "ithkuilscript" | "text",
): HTMLSpanElement {
  switch (kind) {
    case "shaderon":
      // prettier-ignore
      return h(
        "relative block bg-white size-8 rounded-full mx-0.5 overflow-clip group-focus-within:outline outline-2 outline-blue-500 dark:bg-slate-950",
        h("size-[27.27%] top-[00.00%] left-[00.00%] absolute dark:bg-red-700 bg-red-300 rounded-br-[25%]"),
        h("size-[27.27%] top-[00.00%] left-[36.36%] absolute dark:bg-yellow-700 bg-yellow-300 rounded-b-[25%]"),
        h("size-[27.27%] top-[00.00%] left-[72.72%] absolute dark:bg-fuchsia-700 bg-fuchsia-300 rounded-bl-[25%]"),
        h("size-[27.27%] top-[36.36%] left-[00.00%] absolute dark:bg-blue-700 bg-blue-300 rounded-r-[25%]"),
        h("size-[27.27%] top-[36.36%] left-[36.36%] absolute dark:bg-slate-600 bg-slate-400 rounded-[25%]"),
        h("size-[27.27%] top-[36.36%] left-[72.72%] absolute dark:bg-green-700 bg-green-300 rounded-l-[25%]"),
        h("size-[27.27%] top-[72.72%] left-[00.00%] absolute dark:bg-slate-700 bg-slate-300 rounded-tr-[25%]"),
        h("size-[27.27%] top-[72.72%] left-[36.36%] absolute dark:bg-purple-700 bg-purple-300 rounded-t-[25%]"),
        h("size-[27.27%] top-[72.72%] left-[72.72%] absolute dark:bg-orange-700 bg-orange-300 rounded-tl-[25%]"),
      )
    case "empty":
      return h(
        "relative block bg-[--nya-bg-sidebar] size-8 rounded-full mx-0.5 border-4 border-slate-300 group-focus-within:border-blue-500 dark:border-slate-700",
      )
    case "ithkuilscript":
      return h(
        "relative block size-8 mx-0.5",
        svgx(
          "-9.5367431640625e-7 -35.04999923706055 34.20000076293945 70.0999984741211",
          "absolute top-1/2 left-1/2 h-[90%] -translate-x-1/2 -translate-y-1/2 fill-current",
          path(
            "M 8.449998474121093 -25.05 l 0 25 l -8.45 8.45 l 26.7 26.65 l 7.5 -7.5 l -25.5 -25.5 l 9.75 -9.7 l 0 -27.4 l -10 10 z",
          ),
        ),
      )
    case "text":
      return h(
        "relative block size-8 mx-0.5",
        fa(
          faQuoteLeft,
          "absolute top-1/2 left-1/2 w-[50%] -translate-x-1/2 -translate-y-1/2 fill-current",
        ),
      )
  }
}
