import rawManifest from "#/manifest/data.json"
import { manifestFnKinds, type Manifest } from "#/manifest/types"
import { makeDocName } from "./docs/util"
import { h, hx } from "./jsx"

const manifest = rawManifest as any as Manifest

const tds = Object.entries(manifest.fns)
  .flatMap(([k, v]) => v.map((v) => [k, v, v.length] as const))
  .map(([k, v]) =>
    hx(
      "tr",
      "contents",
      hx("td", "text-[--nya-text]", makeDocName(k)),
      hx("td", "", manifestFnKinds[v[3]]),
      hx(
        "td",
        "whitespace-pre",
        ...v[2].map((k) => {
          const [, name, l, m, d] = manifest.packages[k]!
          return h(
            {
              class:
                "px-1 rounded-sm break-inside-avoid mx-0.5 bg-[--l] text-[--d] dark:bg-[--m] dark:text-[--l]",
              style: `--l:${l};--m:${m};--d:${d}`,
            },
            name,
          )
        }),
      ),
      hx("td", "mb-2 text-sm text-[--nya-title]", v[1]),
    ),
  )

const table = hx(
  "table",
  "grid [grid-template-columns:repeat(4,auto)] gap-x-4 text-[--nya-text-prose]",
  // hx(
  //   "thead",
  //   "contents",
  //   hx("tr", "contents", hx("th", "item name"), hx("th", "item kind")),
  // ),
  hx("tbody", "contents", ...tds),
)

document.body.classList.add("p-4")
document.body.appendChild(table)
