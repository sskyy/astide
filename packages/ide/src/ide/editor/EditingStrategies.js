import { makeNewStatement, updateStatement } from './util';

/**
 * 输入需求：指直接通过输入字符的方式来进行修改。
 * 1. 在某一处进行字符输入。
 * 2. 替换 selection 的内容。
 *
 * 理论上不管是哪种，都可能是
 * 1 结构不变，合法。
 * 2 结构变化，新结构合法。
 * 3 不合法，只要是不合法，都是直接导致当前 statement 不合法。不存在局部不合法，虽然也可以做到。
 *
 * selection 的回流范围有三种情况:
 * 0. 影响发生在任何节点前后，make
 * 1. 在 literal/identifier 中，如果符合当前 literal 的类型，那么就只要替换当前 literal。
 * 2. 影响超过了 literal/identifier，要回流所影响的 statement。
 *
 */

function isLiteralValidInput(content, tagName) {
  // TODO 还要根据场景判断
  return /^[a-z0-9]*$/.test(content)
}

const literalLikeNode = ['literal', 'identifier', 'variable']


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
  // TODO 在 literal/identifier 中，并且输入合法，可以快速计算，暂时未实现。
    if (selection.isAtStatementEnd()) {
      makeNewStatement(selection, parser, content, selection.isAtStatementStart())
    } else {
      updateStatement(selection, parser, content)
    }
  // }
}
