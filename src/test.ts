export function group(...data: any[]): Disposable {
  console.group(...data)
  return {
    [Symbol.dispose]() {
      console.groupEnd()
    },
  }
}
