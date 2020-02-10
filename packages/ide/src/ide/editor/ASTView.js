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
    appendAST(newASTNode) {
      return new ViewNodeProxy(source.appendAST(this.viewNode, newASTNode))
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
    equal(other) {
      return this.viewNode === other.toRaw()
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
    this.source = new Source(ast, new Generator(), this.view)
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

    // TODO 修正选中的内容为最后一个节点的文字。
    if (range.endContainer.nodeType !== VIEW_NODE_TYPE_TEXT) {
      const lastText = range.endContainer.childNodes[range.endContainer.childNodes.length - 1]
      range.setEnd(lastText, lastText.nodeValue.length)
    }

    this.selection.update(range)
  }

  render() {
    const output = this.source.generate()
    output.props.onMouseDown = this.onSelectStart
    return output
  }
  stringify() {
    return this.source.stringify()
  }
}