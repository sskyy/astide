import { Generator } from './codegenDOM'
import Selection from './Selection'
import { VIEW_NODE_TYPE_TEXT } from './constant'
import Source from './Source'
import CallbackContainer from '../../base/CallbackContainer';


/****************************************************************
 * ASTView
 ****************************************************************/
const SELECTION_CHANGE = Symbol('selection_change')

export default class ASTView {
  constructor(view, ast, styleManager) {
    this.view = view
    this.styleManager = styleManager
    this.listeners = new CallbackContainer()
    // public
    this.source = new Source(ast, new Generator(), this.view, this.styleManager)
    this.selection = new Selection(this.source)

    // setup
    this.selection.onChange(() => {
      this.listeners.call(SELECTION_CHANGE, this.selection)
    })
  }
  onSelect(listener) {
    this.listeners.add(SELECTION_CHANGE, listener)
  }
  // TODO 应该由 source 提供？
  onSelectStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);

    // 修正选中的内容为最后一个节点的文字。
    if (range.endContainer.nodeType !== VIEW_NODE_TYPE_TEXT) {
      const lastText = range.endContainer.childNodes[range.endContainer.childNodes.length - 1]
      range.setEnd(lastText, lastText.nodeValue.length)
    }

    this.selection.update(range)
  }
  batchSelection(fn) {
    this.selection.batch(fn)
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