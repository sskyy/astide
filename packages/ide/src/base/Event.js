export default class Event {
  constructor() {
    this.eventHandlers = new Map()
  }
  on(event, handler) {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, new Set())
    this.eventHandlers.get(event).add(handler)

    return () => {
      this.eventHandlers.get(event).remove(handler)
    }
  }
  call(event, ...argv) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for( let handler of handlers) {
        handler(...argv)
      }
    }
  }
}