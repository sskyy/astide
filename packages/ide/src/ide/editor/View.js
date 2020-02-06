/** @jsx createElement */
import createElement from '../../base/render/createElement';
import Vnode from '../../base/render/VNode'
import { patch } from '../../base/render/digest'

function replaceItem(arr, origin, next) {
  const index = arr.indexOf(origin)
  if (index === -1) return false
  arr.splice(index, 1, next)
  return true
}

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
    patch(container,
      <div style={{position: 'relative'}}>
        {this.bottomLayers}
        {this.defaultLayer}
        {this.topLayers}
      </div>,
    )
  }
  patch = (container, next) => {
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