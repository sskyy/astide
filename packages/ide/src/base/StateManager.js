export function State(name, tag) {
  if (name[0] === ':') return { tag: name }
  return { name, tag }
}

export function isState(a, { name, tag }) {
  if (name && name !== a.name) return false
  if (tag && tag !== a.tag) return false

  return true
}

const defaultStateStr = 'DEFAULT'
export const defaultState = State(defaultStateStr)

export default class StateManager {
  constructor(defaultState = defaultStateStr) {
    this.defaultState = State(defaultState)
    this.state = this.defaultState
    this.lastStates = []

    // TODO
    this.withState = this.withState.bind(this)
  }

  setState(newState) {
    // eslint-disable-next-line no-console
    console.log('setState to', newState, this.state)
    this.lastStates.push(this.state)
    this.state = newState
  }

  reset() {
    this.state = this.defaultState
  }

  is(state) {
    return isState(state, this.state)
  }

  restore() {
    // eslint-disable-next-line no-console
    console.log('restoreState to', this.lastStates[this.lastStates.length - 1])
    this.state = this.lastStates.pop()
  }

  getState() {
    return { ...this.state }
  }

  withState(state, fn) {
    return () => {
      this.setState(state)
      const p = fn()
      if (p instanceof Promise) {
        p.finally(() => {
          this.restore()
        })
      } else {
        this.restore()
      }
      return p
    }
  }
}
