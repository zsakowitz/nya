import { ScriptEnvironment } from "!/exec/loader"
import { errorText } from "@/error"
import readline from "readline"
import { ANSI } from "./nya/ansi"
import repl from "./repl.nya"

const env = new ScriptEnvironment()
env._load("repl.nya", repl)

console.write("\n> ")
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

for await (const line of rl) {
  try {
    if (/^(struct|enum|fn|let)\b/.test(line)) {
      env._load("repl", line)
    } else {
      const { block, value } = env.process(line)
      console.log(`${ANSI.cyan}${value.type}
${ANSI.blue}${block.source ? block.source + "\n" : ""}${value.toRuntime()}${ANSI.reset}`)
      console.log(env.evalRaw(block.source + "\n" + value.toRuntime()))
    }
  } catch (e) {
    console.error(`${ANSI.red}${errorText(e)}${ANSI.reset}`)
  }
  console.write("\n> ")
}

// TODO: @length(vec2) seems to print @length(ans.x, ans.y, undefined); fix
// TODO: @length(vec3) seems to print @length(ans.x, ans.y, ans.z, undefined, undefined); fix
