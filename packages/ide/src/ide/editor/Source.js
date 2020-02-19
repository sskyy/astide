/** @jsx createElement */
/** @jsxFrag Fragment */
import createElement  from '../../base/render/createElement'
import { invariant } from '../../base/util';
import { VIEW_NODE_TYPE_TEXT } from './constant';

const STATEMENT_LIKE_NAMES = ['statement','declaration', 'specifier', 'definition']
const EXCLUDE_SEMICOLON_STATEMENT_TYPES = ['BlockStatement', 'IfStatement', 'FunctionDeclaration', 'TryStatement']
const NODE_SELECTOR = '[node]'
const CONTAINER_SELECTOR = 'container'
const KEYWORDS = ["do", "if", "in", "for", "let", "new", "try", "var", "case", "else", "enum", "eval", "null", "this", "true", "void", "with", "await", "break", "catch", "class", "const", "false", "super", "throw", "while", "yield", "delete", "export", "import", "public", "return", "static", "switch", "typeof", "default", "extends", "finally", "package", "private", "continue", "debugger", "function", "arguments", "interface", "protected", "implements", "instanceof"]

function closest(node, selector) {
  const start = node.nodeType === VIEW_NODE_TYPE_TEXT ? node.parentNode : node
  return start.closest(selector)
}

class Storage {
  constructor() {
    this.keyToValue = new Map()
    this.valueToKey = new WeakMap()
  }
  save(k, v) {
    this.keyToValue.set(k, v)
    this.valueToKey.set(v, k)
  }
  delete(k) {
    this.keyToValue.delete(k)
  }
  get(k) {
    return this.keyToValue.get(k)
  }
  getByValue(v) {
    return this.valueToKey.get(v)
  }
}

function walkViewNodeLeaf(viewNode, handle) {
  const stack = []
  let lastLeaf = null

  let current = viewNode
  while(current) {
    if (current.nodeType !== VIEW_NODE_TYPE_TEXT) {
      stack.unshift(...current.childNodes)
    } else {
      // 叶子节点
      handle(lastLeaf, current)
      lastLeaf = current
    }

    current = stack.shift()
  }
  // 还要掉用一次，通过 current === undefined 用来告诉外部这次是 last。
  handle(lastLeaf, current)
}

function deleteToAncestor(ancestor, start) {
  let current = start
  while(start.parentNode !== ancestor) {
    current = start.parentNode
  }
  ancestor.removeChild(current)
}


/**
 * 存着 viewNode 和 ast node
 * viewNode 可以为脏，所以也存在这里。
 */
export default class Source {
  constructor(ast, generator, view, styleManager) {
    this.root = ast
    this.generator = generator
    this.view = view
    this.nodeRefStorage = new Storage()
    this.nextSiblingChain = new WeakMap()
    this.prevSiblingChain = new WeakMap()
    this.styleManager = styleManager
  }
  replaceAST(viewNode, nextASTNode) {
    const originAST = this.getASTNode(viewNode)
    // CAUTION 先执行 generate 再执行 append 才行，append 才会把 nextASTNode 的链接修正
    const newVNode = this.generate(nextASTNode)
    originAST.replaceWith(nextASTNode)

    // 更新视图
    const prevViewNode = this.getViewNode(originAST)
    // TODO 通知外部视图更新。这里机制有问题，最后 digest 是外部控制的，但 viewNode 又都是这里处理。
    // 把 viewNode 当成一个跟外部通信的 token ?
    const newViewNode = this.view.patch(prevViewNode, newVNode)

    // 重新建立前后链。
    const prevSibling = this.getPrevSibling(this.getFirstTextNode(prevViewNode))
    const nextSibling = this.getNextSibling(this.getLastTextNode(prevViewNode))
    if (prevSibling) {
      const nextFirstTextNode = this.getFirstTextNode(newViewNode)
      this.prevSiblingChain.set(nextFirstTextNode, prevSibling)
      this.nextSiblingChain.set(prevSibling, nextFirstTextNode)
    }

    if (nextSibling) {
      const nextLastTextNode = this.getLastTextNode(newViewNode)
      this.prevSiblingChain.set(nextSibling, nextLastTextNode)
      this.nextSiblingChain.set(nextLastTextNode, nextSibling)
    }

    // 清理缓存
    this.unlink(originAST)
    this.styleManager.apply(newViewNode)
    return this.getViewNode(nextASTNode)
  }
  appendAST(viewNode, nextASTNode) {
    const afterAST = this.getASTNode(this.closestStatement(viewNode)).closestInCollection()

    // CAUTION 先执行 generate 再执行 append 才行，append 才会把 nextASTNode 的链接修正
    const newVNode = this.generate(nextASTNode)
    afterAST.append(nextASTNode)

    const prevViewNode = this.getViewNode(afterAST)
    const newViewNode = this.view.append(prevViewNode, newVNode)
    const prevLastTextNode = this.getLastTextNode(prevViewNode)

    const siblingLastTextNode = this.getLastTextNode(newViewNode)
    const siblingFirstTextNode = this.getFirstTextNode(newViewNode)
    // 重新建立前后链。
    const nextSibling = this.getNextSibling(this.getLastTextNode(prevViewNode))
    if (nextSibling) {
      this.prevSiblingChain.set(nextSibling, siblingLastTextNode)
      this.nextSiblingChain.set(siblingLastTextNode, nextSibling)
    }

    this.prevSiblingChain.set(siblingFirstTextNode, prevLastTextNode)
    this.nextSiblingChain.set(prevLastTextNode, siblingFirstTextNode)

    this.styleManager.apply(newViewNode)
    return this.getViewNode(nextASTNode)
  }
  generate(ast = this.root) {
    return this.generator.generate(ast, ({ applyLink, node, vnode, isCollection }) => {
      if (isCollection) {
        vnode.props.isCollection = true
      } else {
        applyLink()
      }
      vnode.props.node = true

      /*
       boundary 怎么办？
       只有 pattern 的 boundary 是有意义的，它标志着整个结构。pattern 会被标记为 node。所以 boundary 能被选中。
       中间的部分如果是数组，会被包裹在 container 中，所以也能被选中。
       */
      //

      // 1 node 和 container 会读取 firstTextNode，用于选取某个节点，replace 要用/cmd+a 要用。这里是为 node 处理的。container 会转化为其中第一个元素的 firstTextNode
      // 2 给所有叶子节点连上 nextSibling。tab 跳转要用/stringify 要用/remove 要用。
      vnode.ref = (viewNode) => {
        this.nodeRefStorage.save(node, viewNode)

        // 当是顶节点时，建立 viewNode prev/next link
        if (node === ast) {
          walkViewNodeLeaf(viewNode, (prev, current) => {
            if (prev && current) {
              this.nextSiblingChain.set(prev, current)
              this.prevSiblingChain.set(current, prev)
            }
          })
        }
      }

      // 给所有 statement like 节点加上分号
      if (STATEMENT_LIKE_NAMES.includes(vnode.type) && !EXCLUDE_SEMICOLON_STATEMENT_TYPES.includes(node.type)) {
        // TODO 还要去掉所有有大括号的组合形式
        if (!(node.type === 'ExportNamedDeclaration' && node.declaration.type === 'FunctionDeclaration')
          && node.type !== 'ClassMethod'
        ) {
          vnode.children.push(<semicolon>;</semicolon>)
        }
        // TODO classMethod 后面加, 而不是分号。
      }

    })
  }
  unlink(node) {
    this.generator.walk(node, ({ node: astNode }) => {
      this.nodeRefStorage.delete(astNode)
    })
  }
  getByViewNode(viewNode) {
    return this.nodeRefStorage.getByValue(viewNode)
  }
  getViewNode(node) {
    return this.nodeRefStorage.get(node)
  }
  dirtyPatchViewNode(selection, content) {
    const statementViewNode = selection.closestStatement().toRaw()
    // 插在 start 那个节点里。
    const startContainerProxy = selection.startContainer
    const endContainerProxy = selection.endContainer
    const startContainer = startContainerProxy.toRaw()
    const startOrigin = startContainer.nodeValue
    const endOrigin = endContainerProxy.toRaw().nodeValue
    const offset = selection.startOffset
    const endOffset = selection.endOffset
    startContainer.nodeValue = `${startOrigin.slice(0, offset)}${content}${endOrigin.slice(endOffset)}`

    if (selection.crossedNodes()) {
      // 中间节点全部删除
      let currentProxy = startContainerProxy.nextSibling
      while(true) {
        deleteToAncestor(statementViewNode, currentProxy.toRaw())
        if (currentProxy.toRaw() === endContainerProxy.toRaw()) {
          break
        } else {
          currentProxy = currentProxy.nextSibling
        }
      }
    }
    // TODO statement 标记 dirty
  }
  // public
  stringifyViewNode(viewNodeProxy, selection) {
    let current = this.getFirstTextNode(viewNodeProxy.toRaw())
    invariant(current, 'this viewNode is not node')
    // TODO CAUTION 不能有多个 textNode
    const result = [[], [], []]
    let currentPosition = 0 // 0: before selection. 1: in selection. 2: after

    const startContainer = selection.startContainer.toRaw()
    const endContainer = selection.endContainer.toRaw()

    while(true) {
      if (current !== startContainer && current !== endContainer) {
        result[currentPosition].push(current.nodeValue)

      } else {
        // 还要考虑方向？？？
        if (current === selection.startContainer.toRaw()) {
          result[0].push(current.nodeValue.slice(0, selection.startOffset))
          currentPosition = 1
        }

        if (current === selection.endContainer.toRaw()) {
          result[2].push(current.nodeValue.slice(selection.endOffset))
          currentPosition = 2
        }
      }

      if (current === this.getLastTextNode(viewNodeProxy.toRaw())) break
      current = this.nextSiblingChain.get(current)
    }


    return [...result.map(this.concatWords), result]
  }
  concatWords(words) {
    return words.reduce((last, current) => {
      return `${last}${KEYWORDS.includes(current) ? (' ' + current + ' ') : current}`
    }, '')
  }

  stringify() {
    const viewNodeRoot = this.nodeRefStorage.get(this.root)
    let last = this.getLastTextNode(viewNodeRoot)
    let current = this.getFirstTextNode(viewNodeRoot)

    const result = []
    while(true) {
      invariant(current, 'encounter invalid chain')
      result.push(current.nodeValue)
      if (current === last) break
      current = this.getNextSibling(current)
    }

    return this.concatWords(result)
  }

  closestNode(viewNode) {
    return closest(viewNode, NODE_SELECTOR)
  }
  closestNodeOrContainer(viewNode) {
    return closest(viewNode, [NODE_SELECTOR, CONTAINER_SELECTOR, ...STATEMENT_LIKE_NAMES].join(','))
  }
  closestStatement(viewNode) {
    return closest(viewNode, STATEMENT_LIKE_NAMES.join(','))
  }
  getASTNode(viewNode) {
    return this.nodeRefStorage.getByValue(viewNode)
  }

  // 内部用的
  getPrevSibling(viewNode) {
    return this.prevSiblingChain.get(viewNode)
  }
  getNextSibling(viewNode) {
    return this.nextSiblingChain.get(viewNode)
  }
  getFirstTextNode(viewNode) {
    // CAUTION 递归查找，由于不存在看不到或者为空的节点，所以直接用 dom 找就行了
    if (viewNode.nodeType === VIEW_NODE_TYPE_TEXT) return viewNode
    return this.getFirstTextNode(viewNode.childNodes[0])
  }
  getLastTextNode(viewNode) {
    // CAUTION 递归查找，由于不存在看不到或者为空的节点，所以直接用 dom 找就行了
    if (viewNode.nodeType === VIEW_NODE_TYPE_TEXT) return viewNode
    return this.getLastTextNode(viewNode.childNodes[viewNode.childNodes.length -1])
  }

}