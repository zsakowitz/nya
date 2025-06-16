import { getScriptContent, SCRIPT_NAMES } from "#/script-index"
import { Chunk, Issues } from "../../lang/src/ast/issue"
import { ExposePackage } from "../../lang/src/ast/node/expose"
import { ItemExpose } from "../../lang/src/ast/node/item"
import { parse } from "../../lang/src/ast/parse"
import { createStream } from "../../lang/src/ast/stream"
import { issue } from "../../lang/src/emit/error"
import { parseExposePackage } from "../../lang/src/emit/pkg"

const packages = await Promise.all(
  SCRIPT_NAMES.map(async (name) => {
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
    const props = parseExposePackage(pkg)
  }),
)
