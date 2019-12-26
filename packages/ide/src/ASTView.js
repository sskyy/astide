import { State } from './DOMgen/codegenDOM'
import Selection from './Selection'
import { VIEW_NODE_TYPE_TEXT } from './constant'


function walk(node, handler) {
  const nextNodes = handler(node)
  if (nextNodes) {
    nextNodes.forEach(n => walk(n, handler))
  }
}

function createNodeProxy(ast, view) {
  class NodeProxy {
    constructor(viewNode) {
      this.viewNode = viewNode
    }
    getCodeAndSelection(selection) {
      let code = ''
      let codeSelection = { start: 0, end: 0 }
      walk(this.viewNode, (node) => {
        if (node.type === VIEW_NODE_TYPE_TEXT) {
          code += ` ${node.nodeValue}`
          if (node === selection.startContainer) {
            codeSelection.start = code.length + selection.startOffset
          } else if (node === selection.endContainer) {
            codeSelection.end = code.length + selection.endOffset
          }
        } else {
          return [...node.childNodes]
        }
      })

      return [code, codeSelection]
    }
  }

  return NodeProxy
}

export default class ASTView {
  constructor(view, ast, plugins) {
    this.view = view
    this.ast = ast
    this.state = new State()
    this.plugins = plugins
    this.listener = null
    this.selection = new Selection(ast, createNodeProxy(this.ast, this.view))
  }
  onSelect(listener) {
    this.listener = listener
  }
  getSelection() {
    return this.selection
  }
  onSelectStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const range = document.caretRangeFromPoint(e.pageX, e.pageY);
    // e.preventDefault()
    // e.stopPropagation()

    // TODO astRange 得说明是在 identifier 还是什么 keyword 中？
    // TODO 如果是非法的，那还要知道当前的字符对应的 raw text 中的 offset。

    this.selection.setRange(range)

    this.listener && this.listener(this.selection)
  }

  applyChange({ type, ...payload}) {
    if (type ==='updateViewNode') {
      this.view.patch(payload.node, payload.next)
    } else if (type === 'replaceASTNode') {
      // TODO replace astNode
      // TODO 当前 view 更新
    }
  }

  applySelectionChange({ type, ...payload }) {
    if (type ==='restoreSelection') {
      // TODO
    } else if (type === 'updateSelection') {
      this.selection.update(payload.selection)
    }

    this.listener && this.listener(this.selection)
  }

  render() {
    const output = this.state.generate(this.ast.getRoot())
    output.props.onMouseDown = this.onSelectStart
    return output
  }
}