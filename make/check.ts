import { SCRIPTS, type ScriptName } from "#/script-index"
import { ScriptEnvironment } from "../lang/src/exec/loader"

/*! https://stackoverflow.com/a/12646864 */
function shuffleArray(array: unknown[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

const TEAL = "\x1b[36m"
const RED = "\x1b[31m"

let ok = true
await Promise.all(
  [...SCRIPTS.keys()].map(async (key) => {
    try {
      const env = new ScriptEnvironment()
      await env.load(key as ScriptName)
    } catch (e) {
      ok = false
      console.error(
        `\x1b[30min ${TEAL}${key}\x1b[30m: ${RED}${e instanceof Error ? e.message : String(e)}`,
      )
      process.exitCode = 1
    }
  }),
)
if (ok) {
  console.log(`✅ ${SCRIPTS.size} scripts checked individually with no errors!`)
}

ok = true

const GROUP_COUNTS = 10
await Promise.all(
  Array.from({ length: GROUP_COUNTS }, async () => {
    try {
      const scripts = Array.from(SCRIPTS.keys())
      shuffleArray(scripts)
      // decreases risk of order-dependent errors
      const env = new ScriptEnvironment()
      for (const k of scripts) {
        await env.load(k as ScriptName)
      }
    } catch (e) {
      console.error(e instanceof Error ? e.message : String(e))
      process.exitCode = 1
      ok = false
    }
  }),
)
if (ok) {
  console.log(
    `✅ ${SCRIPTS.size} scripts loaded together in ${GROUP_COUNTS} different orders with no errors!`,
  )
}
