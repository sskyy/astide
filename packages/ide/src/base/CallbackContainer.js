export default class CallbackContainer {
  constructor() {
    this.callbacks = new Map()
  }
  add(key, callback) {
    if (!this.callbacks.has(key)) this.callbacks.set(key, new Set())
    this.callbacks.get(key).add(callback)
    return () => {
      this.callbacks.get(key).remove(callback)
    }
  }
  call(key, ...argv) {
    const callbacks = this.callbacks.get(key)
    if (callbacks) {
      for(let callback of callbacks ){
        callback(...argv)
      }
    }
  }
}