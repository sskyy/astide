import { invariant } from '../../base/util';
import CallbackContainer from '../../base/CallbackContainer';
import { VIEW_NODE_TYPE_TEXT } from './constant';

function closest(viewNode, selector) {
  const start = viewNode.nodeType === VIEW_NODE_TYPE_TEXT ? viewNode.parentNode : viewNode
  return start.closest(selector)
}

const CHANGE_KEY = Symbol('change')


export default class Selection {
  constructor(source) {
    this.listeners = new CallbackContainer()
    this.source = source
    // TODO 利用 range 对象帮忙找共同根、getBoundingClientRect
    this.range = document.createRange();

    ([
      ['startContainer', 'startOffset', 'setStart'],
      ['endContainer', 'endOffset', 'setEnd']
    ]).forEach(([containerName, offsetName, method]) => {
      Object.defineProperty(this, containerName, {
        get: () => {
          // TODO 这里怎么会知道 proxy
          return this.source.createViewNodeProxy(this.range[containerName], this.source)
        },
        set: (viewNodeProxy) => {
          this.range[method](viewNodeProxy.toRaw(), 0)
          this.callListener()
        }
      })

      Object.defineProperty(this, offsetName, {
        get: () => {
          return this.range[offsetName]
        },
        set: (offset) => {
          this.range[method](this.range[containerName], offset)
          this.callListener()
        }
      })
    });

  }
  batch(fn) {
    this.inBatch = true
    try {
      fn()
    } catch(e) {
      console.error(e)
    } finally {
      this.inBatch = false
      this.callListener()
    }
  }
  onChange(listener) {
    this.listeners.add(CHANGE_KEY, listener)
  }
  callListener() {
    if (!this.inBatch) {
      this.listeners.call(CHANGE_KEY)
    }
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
    this.callListener()
  }
  collapseTo(viewNodeProxy, offset) {
    const viewNode = viewNodeProxy.toRaw()
    this.range.setStart(viewNode, offset)
    this.range.setEnd(viewNode, offset)
    this.callListener()
  }
  closestStatement() {
    const [ancestor] =  this.source.findCommonAncestorNode(this.startContainer, this.endContainer)
    return ancestor.closestStatement()
  }
  getRect() {
    // TODO cache?
    // TODO 鼠标滑词选中？
    let containerLeft
    let containerTop
    const {top, left, width, height}  = this.range.getBoundingClientRect()
    // CAUTION 当选中的部分在行位时，有 bug，不确定是不是 chrome 产生的。先区分判断一下。
    if (top === 0 && left === 0) {
      const {top: endContainerTop, right: endContainerRight, }  = this.range.endContainer.getBoundingClientRect()
      containerLeft = endContainerRight
      containerTop = endContainerTop
    } else {
      containerLeft = left
      containerTop = top
    }
    const {top: programTop, left: programLeft } = this.range.startContainer.parentNode.closest('program').getBoundingClientRect()
    return {
      left: containerLeft - programLeft,
      top: containerTop - programTop,
      width,
      height,
    }
  }
  crossedNodes() {
    return this.range.startContainer !== this.range.endContainer
  }

  collapsed() {
    return !this.crossedNodes() && (this.range.startOffset === this.range.endOffset)
  }

  isAtStatementEnd() {
    // 性能高的新判断
    if (!this.collapsed()) return false
    if (this.endOffset !== this.range.endContainer.nodeValue.length) return false
    return this.closestStatement().lastTextViewNode.equal(this.endContainer)
  }
  isAtStatementStart() {
    if (!this.collapsed()) return false
    return this.startOffset === 0
  }
  dirtyPatchViewNode(content) {
    return this.source.dirtyPatchViewNode(this, content)
  }

  // delegate 到 source 上的

}

/* 0. selection closestStatement 返回值为 ast。
 * 6. selection.closestNodeOrContainer() 返回值为 ast。
 * 9. selection delegate dirtyPatchViewNode(content)
 */