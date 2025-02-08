export interface WithDocs {
  name: string
  label: string
  docs(): Node[]
}

export const ALL_DOCS: WithDocs[] = []
