Map.prototype.upsert = function (k, v) {
  if (this.has(k)) {
    return this.get(k)!
  } else {
    this.set(k, v)
    return v
  }
}

declare global {
  interface Map<K, V> {
    upsert(key: K, value: V): V
  }
}
