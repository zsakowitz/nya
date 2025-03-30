import type { FnSignature } from "@/docs/signature"

export interface WithDocs {
  name: string
  label: string
  docs(): FnSignature[]
  // DOCS: "see also", inverse function
}

export const ALL_DOCS: WithDocs[] = []
