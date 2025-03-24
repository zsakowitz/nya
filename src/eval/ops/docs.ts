import type { FnSignature } from "@/docs/signature"

export interface WithDocs {
  name: string
  label: string
  docs(): FnSignature[]
}

export const ALL_DOCS: WithDocs[] = []
