const Properties = ['startContainer', 'endContainer', 'startOffset', 'endOffset']

export default class Selection {
  constructor(ast, NodeProxy) {
    this.ast = ast
    this.startContainer = null
    this.endContainer = null
    this.startOffset = 0
    this.endOffset = 0
    this.NodeProxy = NodeProxy
    this.range = null
    Properties.forEach(k => {
      Object.defineProperty(this, k, {
        get: () => {
          return this.range[k]
        }
      })
    })
  }
  setRange(range) {
    this.range = range
  }
  isRange() {
    return (this.startContainer !== this.endContainer) || (this.startOffset !== this.endOffset)
  }
  getRect() {
    return this.range.getBoundingClientRect()
  }
  update(props) {
    const {
      startContainer = this.range.startContainer,
      endContainer = this.range.endContainer,
      startOffset = this.range.startOffset,
      endOffset = this.range.endOffset,
    } = props
    this.range.setStart(startContainer, startOffset)
    this.range.setEnd(endContainer, endOffset)
  }

  closest(selector) {
    const selectors = Array.isArray(selector) ? selector : [selector]
    const closestViewNode = this.startContainer.parentNode.closest(selectors.join(','))
    const NodeProxyClass = this.NodeProxy
    return new NodeProxyClass(closestViewNode)
  }

}