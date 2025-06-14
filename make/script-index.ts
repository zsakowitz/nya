const scripts = new URL("../pkg/scripts", import.meta.url)
const glob = new Bun.Glob("**/*.nya")

let imports = ""
let index = 0
let items = ""
let name = ""

// Scans the current working directory and each of its sub-directories recursively
for await (const file of glob.scan(scripts.pathname)) {
  const idx = index++
  const alias = JSON.stringify(file.slice(0, -4))
  imports += `import s${idx} from ${JSON.stringify("./scripts/" + file)}\n`
  items += `\n  [${alias}, s${idx}],`
  name += `\n  | ${alias}`
}

const source =
  imports +
  `\nexport const SCRIPTS = new Map([${items}\n])\n\nexport type ScriptName =${name}\n`
await Bun.write(new URL("../pkg/script-index.ts", import.meta.url), source)
