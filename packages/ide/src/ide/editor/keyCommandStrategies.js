/**
 * TODO 模拟编辑时的所有需求，
 * 如何才能真正的快捷起来，补全 + 跳到下一的编辑位的操作。
 * 这两个操作必须得分开，因为可能出现"编辑的时候出现了补全，但是不需要，而是跳到下一编辑位。如果操作不分开就有歧义了。"
 */

import * as EditingStrategies from './EditingStrategies'
import { remove } from './EditingStrategies';
const literalLikeNode = ['literal', 'variable', 'identifier']

export default [
  {
    key: 'tab',
    handle(astView) {
      const { selection } = astView
      // TODO 跳到下一编辑位，要跳过 boundary 之类的。
      let next = selection.endContainer.nextSibling
      while(next && !next.isTypeOf(literalLikeNode)) {
        next = next.nextSibling
      }
      selection.collapseTo(next, 0)
    }
  },{
    key: 'cmd+a',
    handle(astView) {

      const { selection } = astView

      // 当前选区在一个单词之内。选取的扩大需求，选中当前单词
      if (!selection.crossedNodes()
        && (selection.endOffset - selection.startOffset) < selection.startContainer.nodeValue.length
      ){
          // 仅扩大到当前整个区域
          selection.startOffset = 0
          selection.endOffset = selection.endContainer.nodeValue.length
      } else {
        // 如果选区未满，就填满选区，如果选区满了，就向上扩大
        // TODO 向上的过程中还有问题。比如collection 中只有一个元素，就会出现往上扩大了但看不出效果的情况。
        const excludeSelf = selection.isFullSelection()
        const viewNode = selection.closestNodeOrContainer(excludeSelf)
        selection.startContainer = viewNode.firstTextNode
        selection.startOffset = 0
        selection.endContainer = viewNode.lastTextNode
        selection.endOffset = viewNode.lastTextNode.nodeValue.length

      }
    }
  }, {
    key: 'backspace',
    handle(astView, parser) {
      remove(astView, parser)
    }
  }, {
    key: 'enter',
    handle(astView, parser) {
      // TODO enter 补全/新建 statement
      // remove(astView, parser)
      // 新建 statement

      // 1. 如果当前在 start boundary 后面，说明要在当前结构能建立 statement 的地方建立新的。
      // function() {   || class xxx { 。反正都是 BlockStatement 中。

      // 2. 如果当前是在 statement 中。建立一个新的 statement

    }
  }
  // TODO 左右/左右并选择/左右到头



  // TODO cmd+d 复制

  // TODO cmd+c 剪贴板相关
  // TODO cmd+v
  // TODO cmd+x

  // TODO cmd+z localstorage 相关
  // TODO cmd+/

]
