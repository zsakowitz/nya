import rawManifest from "#/manifest/data.json"
import { manifestFnKinds, type Manifest } from "#/manifest/types"
import { makeDocName } from "./docs/util"
import { hx } from "./jsx"

const manifest = rawManifest as any as Manifest

const tds = Object.entries(manifest.fns)
  .flatMap(([k, v]) => v.map((v) => [k, v, v.length] as const))
  .map(([k, v]) =>
    hx(
      "tr",
      "",
      hx("td", "", makeDocName(k)),
      hx("td", "", manifestFnKinds[v[3]]),
      hx("td", "", v[2].map((k) => manifest.packages[k]).join(", ")),
      hx("td", "", v[1]),
    ),
  )

const table = hx(
  "table",
  "grid",
  hx("thead", "", hx("tr", "", hx("th", "item name"), hx("th", "item kind"))),
  hx("tbody", "", ...tds),
)

document.body.classList.add("p-4")
document.body.appendChild(table)
