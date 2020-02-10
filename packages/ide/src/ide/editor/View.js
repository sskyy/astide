/** @jsx createElement */
import createElement from '../../base/render/createElement';
import Vnode from '../../base/render/VNode'
import { patch, append } from '../../base/render/digest'
import { invariant } from '../../base/util';

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
      <editor style={{position: 'relative'}}>
        {this.bottomLayers}
        {this.defaultLayer}
        {this.topLayers}
      </editor>,
    )
  }
  patch = (container, next) => {
    // 支持 vnode， 或者简单的对象。
    invariant(next instanceof Vnode, 'can only view vnode')
    return patch(container, next)
  }
  append = (container, sibling) => {
    return append(container, sibling)
  }
}