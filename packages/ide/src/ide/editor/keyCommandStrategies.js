/**
 * TODO 模拟编辑时的所有需求，
 * 如何才能真正的快捷起来，补全 + 跳到下一的编辑位的操作。
 * 这两个操作必须得分开，因为可能出现"编辑的时候出现了补全，但是不需要，而是跳到下一编辑位。如果操作不分开就有歧义了。"
 */

import * as EditingStrategies from './EditingStrategies'
import { remove, makeNewStatement } from './EditingStrategies';
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
    handle(astView, parser, source) {
      // TODO enter 补全/新建 statement
      const { selection } = astView
      const lastTextNode = selection.closestStatement().lastTextNode
      selection.collapseTo(lastTextNode, lastTextNode.nodeValue.length)
      makeNewStatement(selection, source, parser, ';')
      // makeNewStatement 会把 selection 移到尾部，我们这里要移到开头
      selection.collapseTo(selection.endContainer, 0)

    }
  } , {
    key: 'right',
    handle(astView) {
      const { selection } = astView
      const endOffset = selection.endOffset
      if (endOffset < selection.endContainer.nodeValue.length) {
        selection.collapseTo(selection.endContainer, endOffset + 1)
      } else if (selection.endContainer.nextSibling){
        selection.collapseTo(selection.endContainer.nextSibling, 1)
      }
    }
  }, {
    key: 'left',
    handle(astView) {
      const { selection } = astView
      const startOffset = selection.startOffset
      const prevSibling = selection.endContainer.prevSibling
      if (startOffset > 0 ) {
        selection.collapseTo(selection.startContainer, startOffset - 1)
      } else if (prevSibling){
        // TODO 由于我们的空格是假的，所以这里到底跳到哪个位置有点难判断。
        selection.collapseTo(prevSibling, prevSibling.nodeValue.length - 1)
      }
    }
  }



  // TODO cmd+d 复制

  // TODO cmd+c 剪贴板相关
  // TODO cmd+v
  // TODO cmd+x

  // TODO cmd+z localstorage 相关
  // TODO cmd+/

]
