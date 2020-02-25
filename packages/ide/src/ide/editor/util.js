export function makeNewStatement(selection, parser, content, prepend) {
  if (/^\s*$/.test(content)) return false

  const statement = selection.endContainer.closestStatement()
  let newASTNode
  try {
    newASTNode = parser.parseStatement(content)
  } catch(e) {
    // 不合法, dirty view 之后 return 掉

    statement[prepend ? 'prepend': 'append'](parser.parseStatement(';'))

    selection.collapseTo(selection.endContainer.nextSibling, 0)
    selection.dirtyPatchViewNode(content)
    selection.collapseTo(selection.endContainer.nextSibling, content.length)
    return
  }
  // 新的合法内容
  const newStatement = statement.append(newASTNode)
  selection.collapseTo(newStatement.firstTextViewNode, content.length)
}

export function updateStatement(selection, parser, content) {
  // TODO 针对已经是脏的节点做特殊梳理。
  // TODO 没有考虑 selection 有选区的情况
  // 在 statement 中间。
  const statement = selection.closestStatement()
  const [start, selected, end, stringArr] = statement.stringifyWithSelection(selection)
  const newStatementStr = `${start}${content}${end}`
  let newASTNode
  try {
    newASTNode = parser.parseStatement(newStatementStr)
  } catch(e) {
    // 不合法, dirty view 之后 return 掉
    console.warn('invalid', newStatementStr)
    const originOffset = selection.startOffset
    selection.dirtyPatchViewNode(content)
    selection.collapseTo(selection.startContainer, originOffset + content.length)
    return
  }

  // 合法，更新 statement。会自动引发 patch.
  const newStatement = statement.replaceWith(newASTNode)
  // 通过数字符的方式找到新的 startContainer 和 offset
  let container = newStatement.firstTextViewNode
  let offsetStart = stringArr[0].join('').length + content.length

  while(offsetStart > container.nodeValue.length) {
    offsetStart = offsetStart - container.nodeValue.length
    container = container.nextSibling
  }
  selection.collapseTo(container, offsetStart)
}

export function expandSelectionToNode(selection, node) {
  if (!node) return

  if (Array.isArray(node)) {
    selection.startContainer = node[0].firstTextViewNode
    selection.startOffset = 0
    selection.endContainer = node[node.length -1].lastTextViewNode
    selection.endOffset = node[node.length -1].lastTextViewNode.nodeValue.length
  } else {
    // parent 可能是个节点，也可能是 collection
    selection.startContainer = node.firstTextViewNode
    selection.startOffset = 0
    selection.endContainer = node.lastTextViewNode
    selection.endOffset = node.lastTextViewNode.nodeValue.length
  }
}