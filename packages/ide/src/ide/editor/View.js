/** @jsx createElement */
import createElement from '../../base/render/createElement';
import Vnode from '../../base/render/VNode'
import { patch, append } from '../../base/render/digest'
import { invariant } from '../../base/util';
import paper from "paper";

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
  unshiftLayer(render){
    this.bottomLayers.unshift(render)
  }
  onMount = (editor) => {
    this.editor = editor
    this.resizeObserver = new ResizeObserver(([{ contentRect }]) => {
      // setup canvas
      console.log(contentRect)
      // this.bottomLayerCanvas.style.width = `${contentRect.width}px`
      // this.bottomLayerCanvas.style.height = `${contentRect.height}px`
    })
    this.resizeObserver.observe(this.editor)
  }
  onMountCanvas = (canvas) => {
    this.bottomLayerCanvas = canvas
    paper.setup(this.bottomLayerCanvas)
    this.bottomLayers.forEach(render => render())
    paper.view.draw()
  }
  render(container) {
    patch(container,
      <editor style={{position: 'relative'}} ref={this.onMount}>
        <canvas height="1000" width="1000" style={{position: 'absolute', left: 0, top: 0}} ref={this.onMountCanvas}></canvas>
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