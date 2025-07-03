const scripts = new URL("../../nya", import.meta.url)
const glob = new Bun.Glob("**/*.nya")

let imports = ""
let index = 0
let items = ""
let name = ""
const entries = new Set<string>()
let indexFiles = ""

// Scans the current working directory and each of its sub-directories recursively
for await (const file of glob.scan(scripts.pathname)) {
  if (file.split("/").some((x) => x[0] == "_")) {
    continue
  }
  const idx = index++
  const isIndex = file.endsWith("/index.nya")
  const rawAlias = file.slice(0, isIndex ? -10 : -4)
  const alias = JSON.stringify(rawAlias)
  if (isIndex) {
    indexFiles += `${alias},`
  }
  if (entries.has(rawAlias)) {
    throw new Error(
      `Script '${rawAlias}' is defined twice, likely under the names '${rawAlias}/index.nya' and '${rawAlias}.nya'. Delete one.`,
    )
  }
  entries.add(rawAlias)
  imports += `import s${idx} from ${JSON.stringify("../nya/" + file)}\n`
  items += `\n  [${alias}, s${idx}],`
  name += `\n  | ${alias}`
}

const source =
  imports +
  `\nexport const SCRIPTS = new Map([${items}\n])\n\nexport const SCRIPT_INDICES = new Set([${indexFiles}])\n\nexport type ScriptName =${name}\n`
await Bun.write(new URL("../../pkg/script-index.ts", import.meta.url), source)
