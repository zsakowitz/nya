import { Scalar } from "./type"

export function addInspection() {
  Scalar.prototype.inspect = function (this: Scalar) {}
}
