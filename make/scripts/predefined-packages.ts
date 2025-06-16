import { Chunk, Issues } from "!/ast/issue"
import { ExposePackage } from "!/ast/node/expose"
import { ItemExpose } from "!/ast/node/item"
import { parse } from "!/ast/parse"
import { createStream } from "!/ast/stream"
import { issue } from "!/emit/error"
import { parseExposePackage } from "!/emit/pkg"
import { getScriptContent, SCRIPT_NAMES, type ScriptName } from "#/script-index"

const packages = (await Promise.all(SCRIPT_NAMES.map(getPackage))).filter(
  (x) => x != null,
)

async function getPackage(name: ScriptName) {
  const content = await getScriptContent(name)
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
  return { script: name, props: parseExposePackage(pkg) }
}
