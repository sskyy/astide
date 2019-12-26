/** @jsx createElement */
import createElement from './DOMgen/createElement';
import Vnode from './DOMgen/VNode'
import { patch } from './DOMgen/digest'

function replaceItem(arr, origin, next) {
  const index = arr.indexOf(origin)
  if (index === -1) return false
  arr.splice(index, 1, next)
  return true
}

// TODO 定位问题
export default class View {
  constructor() {
    this.topLayers = []
    this.bottomLayers = []
    this.defaultLayer = null
  }
  getDefaultLayer() {
    return {
      render: (output) => {
        this.defaultLayer = output
      }
    }
  }
  pushLayer() {
    const placeHolder = {}
    this.topLayers.push(placeHolder)
    return {
      render: (output) => {
        replaceItem(this.topLayers, placeHolder, output)
      }
    }
  }
  unshiftLayer(){
    const placeHolder = {}
    this.bottomLayers.unshift(placeHolder)
    return {
      render: (output) => {
        replaceItem(this.bottomLayers, placeHolder, output)
      }
    }
  }
  render(container) {
    // TODO 层要不要合并？
    patch(container,
      <div>
        {this.bottomLayers}
        {this.defaultLayer}
        {this.topLayers}
      </div>,
    )
  }
  patch(container, next) {
    // 支持 vnode， 或者简单的对象。
    if( next instanceof Vnode) {
      patch(container, next)
    } else {
      Object.keys(next).forEach(k => {
        container[k] = next[k]
      })
    }
  }
}