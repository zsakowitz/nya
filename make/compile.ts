import { errorText, issue } from "!/emit/error"
import { ScriptEnvironment } from "!/exec/loader"
import { isScriptName } from "@/pkg/scripts"

const lang = process.argv[2]
const name = process.argv[3]
const file = process.argv[4]

try {
  if (!(lang == "js" || lang == "glsl")) {
    issue(`First argument to 'make/compile' must be 'js' or 'glsl'.`)
  }

  if (!name || !isScriptName(name)) {
    issue(`Second argument to 'make/compile' must be the name of a script.`)
  }

  const env = new ScriptEnvironment()
  env.load(name)
  const main = env.lib(lang).getTypeDeclarations()
  if (file) {
    await Bun.write(file, main)
  } else {
    console.info(main)
  }
} catch (e) {
  console.error(errorText(e))
}
