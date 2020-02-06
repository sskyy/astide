import { Generator } from './codegenDOM'
import Selection from './Selection'
import { VIEW_NODE_TYPE_TEXT } from './constant'
import Source from './Source'
import CallbackContainer from '../../base/CallbackContainer';


function createViewNodeProxy(source) {
  class ViewNodeProxy {
    constructor(viewNode) {
      this.viewNode = viewNode
      // 直接委托到 source 上的方法
      const proxyMethods = ['closestNode', 'closestNodeOrContainer', 'closestStatement']
      proxyMethods.forEach(methodName => {
        this[methodName] = () => {
          return new ViewNodeProxy(source[methodName](viewNode))
        }
      })
    }
    getASTNode() {
      return source.getASTNode(this.viewNode)
    }
    replaceASTWith(newASTNode) {
      return new ViewNodeProxy(source.replaceAST(this.viewNode, newASTNode))
    }
    toRaw() {
      return this.viewNode
    }
    get nodeValue() {
      return this.viewNode.nodeValue
    }
    get tagName() {
      const target =  this.viewNode.nodeType === VIEW_NODE_TYPE_TEXT ? this.viewNode.parentNode : this.viewNode
      return target.tagName.toLowerCase()
    }
    get firstTextNode() {
      return new ViewNodeProxy(source.getFirstTextNode(this.viewNode))
    }
    get lastTextNode() {
      return new ViewNodeProxy(source.getLastTextNode(this.viewNode))
    }
    get prevSibling() {
      return new ViewNodeProxy(source.getPrevSibling(this.viewNode))
    }
    get nextSibling() {
      return new ViewNodeProxy(source.getNextSibling(this.viewNode))
    }
    isTypeOf(option) {
      const options = Array.isArray(option) ? option : [option]
      const toTest =  this.viewNode.nodeType === VIEW_NODE_TYPE_TEXT ? this.viewNode.parentNode : this.viewNode
      return options.includes(toTest.tagName.toLowerCase())
    }
    isNode() {
      return this.viewNode.attributes.getNamedItem('node')
    }

  }

  return ViewNodeProxy
}

/****************************************************************
 * ASTView
 ****************************************************************/
const SELECTION_CHANGE = Symbol('selection_change')

export default class ASTView {
  constructor(view, ast, plugins) {
    this.view = view

    this.plugins = plugins
    this.listeners = new CallbackContainer()

    // public
    this.source = new Source(ast, new Generator(), this.view.patch)
    this.selection = new Selection(createViewNodeProxy(this.source))

    // setup
    this.selection.onChange(() => {
      this.listeners.call(SELECTION_CHANGE, this.selection)
    })
  }
  onSelect(listener) {
    this.listeners.add(SELECTION_CHANGE, listener)
  }
  onSelectStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);

    this.selection.update(range)
  }

  // applyChange({ type, ...payload}) {
  //   if (type ==='updateViewNode') {
  //     // dirty
  //     this.source.dirtyPatchViewNode(payload.viewNode, payload.next)
  //   } else if (type === 'replaceASTNode') {
  //     const {viewNodeProxy, next} = payload
  //     // TODO 会自动更新 view，这样 reactive 好吗？
  //     this.source.update(viewNodeProxy.getASTNode(), next)
  //   }
  // }

  // applySelectionChange({ type, ...payload }) {
  //   // 两个指令参数不同。
  //   if (type ==='restoreSelection') {
  //     const { astNode, start, end } = payload
  //     // 1. 先通过 astNode 获得 viewNode
  //     // 2. 找到相应的 range, setRange 即可
  //     const { ViewNodeProxyClass } = this
  //     const viewNodeProxy = new ViewNodeProxyClass(this.source.getViewNode(astNode))
  //     const nextRange = viewNodeProxy.findRangeFromFlatRange(start, end)
  //     this.selection.update(nextRange)
  //
  //   } else if (type === 'updateSelection') {
  //     this.selection.update(payload.selection)
  //
  //   } else  if (type === 'selectASTNode') {
  //     const { astNode } = payload
  //     const { ViewNodeProxyClass } = this
  //     const viewNodeProxy = new ViewNodeProxyClass(this.source.getViewNode(astNode))
  //     const nextRange = viewNodeProxy.toRange()
  //     this.selection.update(nextRange)
  //   }
  //
  //   this.listeners && this.listeners(this.selection)
  // }

  render() {
    const output = this.source.generate()
    output.props.onMouseDown = this.onSelectStart
    return output
  }
}