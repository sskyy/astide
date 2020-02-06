/**
 * 输入需求：指直接通过输入字符的方式来进行修改。
 * 1. 在某一处进行字符输入。
 * 2. 替换 selection 的内容。
 *
 * 理论上不管是哪种，都可能是
 * 1 结构不变，合法。
 * 2 结构变化，合法。
 * 3 不合法，只要是不合法，都是直接导致当前 statement 不合法。不存在局部不合法，虽然也可以做到。
 *
 * 我们把有没有 selection 交给外面判断？查找共性：
 * 1. 单个位置插入，可能破坏结构，也可能不破坏。取决于插入的内容、位置。
 * 2. 单个删除。有可能破坏结构，取决于位置。
 * 3. 有 selection 时替换内容。
 * 4. 有 selection 时删除。
 *
 * 只有两种情况，有 selection 时的增删和没有 selection 时的增删。
 * 有 selection 时的增删还可以合一。
 *
 */

function isLiteralValidInput(content, tagName) {
  // TODO 还要根据场景判断
  return /^[a-z0-9]*$/.test(content)
}

const literalLikeNode = ['literal', 'identifier', 'variable']

/**
 * TODO
 * selection.closestNode()
 * selection.closetStatement()
 * selection.collapsed()
 * selection.collapseTo()
 * selection.crossedNodes()
 * selection.startContainer/... SET
 *
 * astView.source.replaceASTNode()
 * astView.source.dirtyPatchViewNode()
 * astView.source.stringifyViewNode()
 * astView.selection  !!
 *
 * viewNodeProxy.firstTextNode
 * viewNodeProxy.lastTextNode
 * viewNodeProxy.prevSibling
 * viewNodeProxy.nextSibling
 *
 * astNode.clone
 *
 */

export function remove(astView, parser) {
  const { selection } = astView
  if (selection.startOffset === 0) {
    const prevSibling = selection.startContainer.prevSibling
    if (!prevSibling) return

    selection.startContainer = prevSibling
    selection.startOffset = prevSibling.nodeValue.length
  } else {
    selection.startOffset -= 1
  }

  replace(astView, parser, '')
}


// 有 selection 时。貌似有没有 selection 都可以用这个。没有 selection 时是这里的子集。
export function replace(astView, parser, content) {
  const { selection, source } = astView
  // TODO 一定不会破坏结构。暂时先不考虑。
  // if (!selection.crossedNodes()
  //   && selection.closestNode().isTypeOf(literalLikeNode)
  //   && isLiteralValidInput(content, selection.closestNode().tagName)
  // ) {
  //   const viewNode = selection.closestNode()
  //   const originContent = selection.startContainer.nodeValue
  //   // TODO 生成的是个 literal，其实也要验证合法性
  //   const newViewNode = viewNode.replaceASTWith({ value: `${originContent.slice(0, selection.startOffset)}${content}${originContent.slice(selection.endOffset)}`})
  //   // 更新 selection 移到新增内容的后面
  //   selection.collapseTo(newViewNode.firstTextNode, selection.startOffset + content.length)
  // } else {
    // 可能破坏了结构。
    const statementViewNode = selection.closestStatement()
    const [start, selected, end, stringArr] = source.stringifyViewNode(statementViewNode, selection)
    const newStatement = `${start}${content}${end}`
    console.log(newStatement)
    let newASTNode
    try {
      newASTNode = parser.parseStatement(newStatement)
    } catch(e) {
      // 不合法, dirty patch 之后 return 掉
      console.warn('invalid', newStatement)
      const originOffset = selection.startOffset
      source.dirtyPatchViewNode(selection, content)
      selection.collapseTo(selection.startContainer, originOffset + content.length)
      return
    }

    // 合法
    const selectionParentViewNode = statementViewNode.replaceASTWith(newASTNode)
    // 通过数字符的方式找到新的 startContainer 和 offset
    let container = selectionParentViewNode.firstTextNode
    let offsetStart = stringArr[0].join('').length + content.length

    while(offsetStart > container.nodeValue.length) {
      offsetStart = offsetStart - container.nodeValue.length
      container = container.nextSibling
    }
    // offsetStart <= container.nodeValue.length
    selection.collapseTo(container, offsetStart)

  // }

}

