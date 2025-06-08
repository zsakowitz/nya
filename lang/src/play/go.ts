import { writeFileSync } from "fs"
import { Chunk, Issues } from "../ast/issue"
import { parse, parseBlockContents } from "../ast/parse"
import { createStream } from "../ast/stream"
import { Block, Exits } from "../emit/decl"
import { emitBlock, emitItem } from "../emit/emit"
import { addInspectKeys } from "../emit/inspect"
import { EmitProps, type Lang } from "../emit/props"
import { createStdlib } from "../emit/stdlib"
import { sourceWithExample as source } from "./source"

function emitCore(props: EmitProps) {
  const issues = new Issues()
  const lib = createStdlib(props)
  const root = []
  const decls: Record<string, string[]> = Object.create(null)
  for (const chunk of source) {
    for (const item of parse(createStream(chunk, issues, { comments: false }))
      .items) {
      const result = emitItem(item, lib)
      if (result?.decl) {
        root.push(result.decl)
      }
      if (result?.declNya) {
        for (const item of result.declNya) {
          if (item.kind != "fn") {
            ;(decls[item.name] ??= []).push(item.of)
          }
        }
      }
    }
  }

  const expr = new Chunk("<main>", "main")
  const block = new Block(lib, new Exits(null))
  const value = emitBlock(
    parseBlockContents(createStream(expr, issues, { comments: false })),
    block,
  )
  const a =
    [lib.globals(), root.join("\n"), block.source, value.toRuntime() + ""]
      .filter((x) => x)
      .join("\n") + "\n"

  const nyaDecl1 = Object.entries(decls)
    .sort(([a], [b]) =>
      a < b ? -1
      : a > b ? 1
      : 0,
    )
    .map((x) => x[1].join("\n"))
    .join("\n")

  const nyaDecl2 = lib.fns
    .all()
    .map((a) => [a[0]!.id.label, a.map((x) => x.declaration())] as const)
    .sort(([a], [b]) =>
      a < b ? -1
      : a > b ? 1
      : 0,
    )
    .map((x) => x[1].join("\n"))
    .join("\n\n")

  const finalDeclarationFile =
    nyaDecl1 && nyaDecl2 ? nyaDecl1 + "\n\n" + nyaDecl2 : nyaDecl1 || nyaDecl2

  return {
    lib,
    compiledScript: a,
    compiledDecls: finalDeclarationFile,
  }
}

function emitGl() {
  const { compiledScript } = emitCore(new EmitProps("glsl"))
  writeFileSync(new URL("./compiled.glsl", import.meta.url), compiledScript)
}

function emitJs(lang: Lang) {
  const { compiledScript, compiledDecls } = emitCore(new EmitProps(lang))
  writeFileSync(new URL("./compiled.js", import.meta.url), compiledScript)
  writeFileSync(new URL("./compiled.nya", import.meta.url), compiledDecls)
  console.log((0, eval)(compiledScript))
}

addInspectKeys()
try {
  emitJs("js")
  emitGl()
} catch (e) {
  console.error(e)
  console.log(e instanceof Error ? e.message : String(e))
  process.exitCode = 1
}
