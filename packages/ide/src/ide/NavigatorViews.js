/** @jsx createElement */
import { createElement } from 'axii';
import Event from '../base/Event'
import useForceUpdate from '../base/render/useForceUpdate';

function createReactivePiece(codebase) {
  return function ReactivePiece({ uri, children }) {
    codebase.watch(uri, useForceUpdate)
    return children[0]({ status })
  }
}

export default class NavigatorViews extends Event{
  constructor(codebase, Codebase, navigators) {
    super()
    this.ReactivePiece = createReactivePiece(codebase)

    // 将 navigator view delegate 到当前组件上。
    Object.entries(navigators).forEach(([name, navigator]) => {
      this[name] = () => {
        // 注入参数
        return navigator({ codebase, Codebase, actions: this.actions, ReactivePiece: this.ReactivePiece })
      }
    })
  }
  get actions() {
    return new Proxy({}, {
      get: (target, prop) => {
        return (...argv) => this.call(prop, ...argv)
      }
    })
  }
}
