import { vectorPath } from "../vector"
import { createLineLikeExt } from "./line-like"

export const EXT_VECTOR = createLineLikeExt("vector", (cv, p1, p2) => {
  const d = vectorPath(cv, p1, p2)
  return d ? new Path2D(d) : null
})
