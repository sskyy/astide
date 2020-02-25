/**
 * TODO 模拟编辑时的所有需求，
 * 如何才能真正的快捷起来，补全 + 跳到下一的编辑位的操作。
 * 这两个操作必须得分开，因为可能出现"编辑的时候出现了补全，但是不需要，而是跳到下一编辑位。如果操作不分开就有歧义了。"
 */

import * as EditingStrategies from './EditingStrategies'
import { remove } from './EditingStrategies';
import { expandSelectionToNode, makeNewStatement } from './util';
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
      selection.collapseTo(next, next.nodeValue.length)
    }
  },{
    key: 'cmd+a',
    handle(astView) {
      const { selection, source } = astView
      /**
       * 选区扩大策略：
       * 1. 如果不是 full selection，那么就先填满当前选区。
       *   full selection 定义：
       *   startContainer 是 startAncestor 的第一个，startOffset 为 0.
       *   endContainer 是 endAncestor 最后一个, endOffset 为 nodeValue.length。
       * 2. 如果是 full selection 那么就扩大到 parent node 或者 collection。
       *
       * 是否是 crossedNodes 算法都一样。
       */
      const [ancestor, startAncestor, endAncestor] = source.findCommonAncestorNode(selection.startContainer, selection.endContainer)
      const isAtNodeStart = selection.startOffset === 0 && selection.startContainer.equal(startAncestor.firstTextViewNode)
      const isAtNodeEnd = (selection.endOffset === selection.endContainer.nodeValue.length) && selection.endContainer.equal(endAncestor.lastTextViewNode)
      // 头尾已满，考虑往上扩大了。
      if (isAtNodeEnd && isAtNodeStart) {
        if (Array.isArray(ancestor)) {
          // 是否 collection 已经选满了
          if (ancestor[0].equal(startAncestor) && ancestor[ancestor.length -1].equal(endAncestor)) {
            // collection 已选满，通常表示当前这个这节点都已经选满了。
            // TODO 不确定一个 node 会不会同时有 collection 节点和其他节点，还要判断
            const parentNode = ancestor.parent.parent
            if (parentNode) {
              expandSelectionToNode(selection, parentNode)
            }
            console.log('full ', parentNode)
          } else {
            // 没选满，继续选满 collection
            console.log('not full ', ancestor[0] === startAncestor, ancestor[ancestor.length -1] === endAncestor)
            console.log(ancestor, startAncestor, endAncestor)
            expandSelectionToNode(selection, ancestor)
          }

        } else {
          // 选择 parent 节点
          /**
           * TODO parent 可能是个节点，也可能是 collection。如果是 collection。可能会出现 collection 就只有当前这个节点的情况。
           * 要一直往上找到包含其他节点的祖先。
           */
          console.log(ancestor)
          if (Array.isArray(ancestor.parent) && ancestor.parent.length !== 1) {
            expandSelectionToNode(selection, ancestor.parent)
          } else {
            expandSelectionToNode(selection, ancestor.parent.parent)
          }
        }
      } else {
        // 头尾都没满，选处理头尾
        if (!isAtNodeStart) {
          selection.startContainer = startAncestor.firstTextViewNode
          selection.startOffset = 0
        }
        if (!isAtNodeEnd) {
          selection.endContainer = endAncestor.lastTextViewNode
          selection.endOffset = endAncestor.lastTextViewNode.nodeValue.length
        }
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
      const { selection } = astView
      const lastTextViewNode = selection.closestStatement().lastTextViewNode
      selection.collapseTo(lastTextViewNode, lastTextViewNode.nodeValue.length)
      makeNewStatement(selection, parser, ';', selection.isAtStatementStart())
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
