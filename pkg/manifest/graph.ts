import { rm } from "node:fs/promises"
import { index } from ".."

const paths = await Promise.all(
  Object.entries(index).map(async ([id, load]) => {
    const pkg = (await load()).default
    const source = pkg.deps
      .map((x) => `import ${JSON.stringify("#/graphsource/" + x)}\n`)
      .join("")
    const path = `./pkg/graphsource/${id}.ts`
    await Bun.write(path, source, { createPath: true })
    return path
  }),
)

await Bun.$`bun madge --image graph.svg --ts-config tsconfig.json ${paths}`

await rm("./pkg/graphsource", { recursive: true })
