import { ScriptEnvironment } from "!/exec/loader"
import { errorText } from "@/error"
import readline from "readline"
import { ANSI } from "./nya/ansi"
import repl from "./repl.nya"

const glsl = process.argv[2] == "--glsl"
console.log(glsl)

const env = new ScriptEnvironment()
env._load("repl.nya", repl)

console.write("\n> ")
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
const lib = env.lib(glsl ? "glsl" : "js")

for await (const line of rl) {
  try {
    if (/^(struct|enum|fn|let|use)\b/.test(line)) {
      env._load("repl", line)
    } else {
      const { block, value } = env.process(line, undefined, undefined, lib)
      console.info(
        ANSI.cyan +
          value.type +
          "\n" +
          ANSI.blue +
          ANSI.dim +
          (block.globals.getText() ? block.globals.getText() + "\n" : "") +
          ANSI.reset +
          ANSI.blue +
          (block.source ? block.source + "\n" : "") +
          value.toRuntime() +
          ANSI.reset,
      )
      if (!glsl) {
        console.info(env.compute(block, value))
      }
    }
  } catch (e) {
    console.error(`${ANSI.red}${errorText(e)}${ANSI.reset}`)
  }
  console.write("\n> ")
}

// TODO: @length(vec2) seems to print @length(ans.x, ans.y, undefined); fix
// TODO: @length(vec3) seems to print @length(ans.x, ans.y, ans.z, undefined, undefined); fix
