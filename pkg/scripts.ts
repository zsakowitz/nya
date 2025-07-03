import { SCRIPT_INDICES, SCRIPTS, type ScriptName } from "./script-index"

export function getScriptContents(name: ScriptName) {
  return SCRIPTS.get(name)!
}

export function isScriptName(name: string): name is ScriptName {
  return SCRIPTS.has(name)
}

export function getScriptPath(name: ScriptName) {
  return SCRIPT_INDICES.has(name) ? `${name}/index.nya` : `${name}.nya`
}

export const SCRIPT_NAMES = Array.from(SCRIPTS.keys()) as readonly ScriptName[]
