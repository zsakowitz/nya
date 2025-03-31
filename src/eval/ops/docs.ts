import type { FnSignature } from "@/docs/signature"

export interface WithDocs {
  name: string
  label: string
  docs(): FnSignature[]
  // DOCS: "see also", inverse function if exists
  // DOCS: make sure all packages expose every function they modify (e.g. link quaternion to '+')
}

export const ALL_DOCS: WithDocs[] = []
