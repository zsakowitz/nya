import { Chunk, Issues } from "!/ast/issue"
import { ExposePackage } from "!/ast/node/expose"
import { ItemExpose } from "!/ast/node/item"
import { parse } from "!/ast/parse"
import { createStream } from "!/ast/stream"
import { issue } from "!/emit/error"
import { parseExposePackage } from "!/emit/pkg"
import { SCRIPTS, type ScriptName } from "#/script-index"
import type { Package } from "#/types"

await createPredefinedPackages()

async function createPredefinedPackages() {
  const packages = (
    await Promise.all(
      Array.from(SCRIPTS.keys() as Iterable<ScriptName>, getPackage),
    )
  ).filter((x) => x != null)

  const generated = `export const NYALANG_PACKAGES_BUILTIN = {\n  __proto__: null,\n${packages
    .filter((x) => x.builtin)
    .map((x) => x.decl)
    .join("")}} as const

export const NYALANG_PACKAGES_ADDONS = {\n  __proto__: null,\n${packages
    .filter((x) => !x.builtin)
    .map((x) => x.decl)
    .join("")}} as const
`

  await Bun.write(
    new URL(`../../pkg/index-nyalang.ts`, import.meta.url).pathname,
    generated,
  )

  console.log(`✅ ${packages.length} packages defined`)
}

async function getPackage(name: ScriptName) {
  const content = SCRIPTS.get(name)!
  const issues = new Issues()
  const chunk = new Chunk(name, content)
  const stream = createStream(chunk, issues, { comments: false })
  const script = parse(stream)
  const packages = script.items
    .flatMap((x) => (x instanceof ItemExpose ? x.items : []))
    .filter((x) => x instanceof ExposePackage)
  if (!packages.length) {
    return
  }
  if (packages.length != 1) {
    issue(`Script '${name}' may only have one 'expose package' declaration.`)
  }
  const pkg = packages[0]!
  const props = parseExposePackage(pkg)
  const actualPackageDeclaration: Package = {
    name: props.name,
    label: props.label,
    category: "auto-generated (nyalang)",
    deps: [],
    scripts: [name],
  }
  return {
    decl: `  ${JSON.stringify(`nya:${name}`)}: ()=>Promise.resolve({default:${JSON.stringify(actualPackageDeclaration)} as const}),\n`,
    builtin: props.default,
  }
}
