import { issue } from "!/emit/error"
import { ScriptEnvironment } from "!/exec/loader"
import { isScriptName } from "#/scripts"

const lang = process.argv[2]
const name = process.argv[3]
const file = process.argv[4]

try {
  if (!(lang == "js" || lang == "glsl")) {
    issue(`First argument to 'make/compile' must be js, glsl, or nya.`)
  }

  if (!name || !isScriptName(name)) {
    issue(`Second argument to 'make/compile' must be the name of a script.`)
  }

  const env = new ScriptEnvironment()
  await env.load(name)
  const main = env.getMain(lang)
  if (file) {
    await Bun.write(file, main)
  } else {
    console.log(main)
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
}
