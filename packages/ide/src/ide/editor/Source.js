/** @jsx createElement */
/** @jsxFrag Fragment */
import createElement  from '../../base/render/createElement'
import { invariant } from '../../base/util';
import { VIEW_NODE_TYPE_COMMET, VIEW_NODE_TYPE_TEXT } from './constant';
import Fragment from '../../base/render/Fragment';

const STATEMENT_LIKE_NAMES = ['statement','declaration', 'specifier', 'definition']
const EXCLUDE_SEMICOLON_STATEMENT_TYPES = ['BlockStatement', 'IfStatement', 'FunctionDeclaration', 'TryStatement']
const NODE_SELECTOR = '[node]'
const CONTAINER_SELECTOR = 'container'
const KEYWORDS = ["do", "if", "in", "for", "let", "new", "try", "var", "case", "else", "enum", "eval", "null", "this", "true", "void", "with", "await", "break", "catch", "class", "const", "false", "super", "throw", "while", "yield", "delete", "export", "import", "public", "return", "static", "switch", "typeof", "default", "extends", "finally", "package", "private", "continue", "debugger", "function", "arguments", "interface", "protected", "implements", "instanceof"]

function isStatement(node) {
  return STATEMENT_LIKE_NAMES.some(name => {
    const exp = new RegExp(`${name}$`, 'i')
    return exp.test(node.type)
  })
}

/**
 * TODO
 * 1. ctrl + a 要用的 closestNodeOrContainer
 * 2. dirtyPatchViewNode
 */

class NodeToViewNodeStorage {
  constructor() {
    this.keyToValue = new Map()
    this.valueToKey = new WeakMap()
  }
  set(k, v) {
    this.keyToValue.set(k, v)
    if (Array.isArray(v)) {
      v.forEach(i => {
        this.valueToKey.set(i, k)
      })
    } else {
      this.valueToKey.set(v, k)
    }
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

function closest(start, match) {
  const matched = match(start)
  if (matched) return start
  // stop
  if (matched === false) return null
  return closest(start.parentNode, match)
}


function findAncestorNotCommentSibling(viewNode, root, prev) {
  let ancestorNotCommentSibling
  closest(viewNode, (viewNode) => {
    if (viewNode === root) return false
    const property = prev ? 'previousElementSibling' : 'nextElementSibling'
    if (viewNode[property]) {
      // 顺便存一下，后面要用
      ancestorNotCommentSibling = viewNode[property]
      return viewNode
    }
  })
  return ancestorNotCommentSibling
}

function getFirstTextNode(viewNode) {
  // CAUTION 递归查找，由于不存在看不到或者为空的节点，所以直接用 dom 找就行了
  if (viewNode.nodeType === VIEW_NODE_TYPE_TEXT) return viewNode
  // CAUTION 这里相信了如果没有 elementChild 也里面不会有 comment。
  return getFirstTextNode(viewNode.firstElementChild || viewNode.firstChild)
}
// TODO 有没有可能碰到 comment 节点？
function getLastTextNode(viewNode) {
  // CAUTION 递归查找，由于不存在看不到或者为空的节点，所以直接用 dom 找就行了
  if (viewNode.nodeType === VIEW_NODE_TYPE_TEXT) return viewNode
  return getLastTextNode(viewNode.lastElementChild || viewNode.lastChild)
}

function getPrevSiblingTextNode(viewNode, root) {
  invariant(viewNode.nodeType === VIEW_NODE_TYPE_TEXT, 'getPrevSiblingTextNode must start from text node')
  const ancestorNotCommentSibling = findAncestorNotCommentSibling(viewNode, root, true)
  return ancestorNotCommentSibling ? getLastTextNode(ancestorNotCommentSibling) : null
}

function getNextSiblingTextNode(viewNode, root) {
  invariant(viewNode.nodeType === VIEW_NODE_TYPE_TEXT, 'getNextSiblingTextNode must start from text node')
  const ancestorNotCommentSibling = findAncestorNotCommentSibling(viewNode, root, false)
  return ancestorNotCommentSibling ? getFirstTextNode(ancestorNotCommentSibling) : null
}

function findAnteriorViewNode(start, match) {
  if (!start) return false
  const matched = match(start)
  if (matched) return start
  return findAnteriorViewNode(start.prevSibling)
}

function deleteToAncestor(ancestor, start) {
  let current = start
  while(start.parentNode !== ancestor) {
    current = start.parentNode
  }
  ancestor.removeChild(current)
}

const ViewNodeTraps = {
  toRaw(target) {
    return () => target
  },
  nodeValue(target) {
    return target.nodeValue
  },
  tagName(target) {
    const result =  target.nodeType === VIEW_NODE_TYPE_TEXT ? target.parentNode : target
    return result.tagName.toLowerCase()
  },
  prevSibling(target, source) {
    return createViewNodeProxy(source.getPrevSiblingTextNode(target).toRaw(), source)
  },
  nextSibling(target, source) {
    return createViewNodeProxy(source.getNextSiblingTextNode(target).toRaw(), source)
  },
  equal(target) {
    return (other) => target === other.toRaw()
  },
  isTypeOf(target) {
    return (option) => {
      const options = Array.isArray(option) ? option : [option]
      const toTest =  target.nodeType === VIEW_NODE_TYPE_TEXT ? target.parentNode : target
      return options.includes(toTest.tagName.toLowerCase())
    }
  },
  isNode(target) {
    return () => target.attributes.getNamedItem('node')
  }
}

const ViewNodeProxyMethods = ['closestNode', 'closestNodeOrContainer', 'closestStatement']
ViewNodeProxyMethods.forEach(methodName => {
  ViewNodeTraps[methodName] = (target, source) => (...argv) => {
    return source[methodName](target, ...argv)
  }
})

function createViewNodeProxy(viewNode, source) {
  if (!viewNode) return viewNode
  return new Proxy(viewNode, {
    get: (target, key) => {
      if (ViewNodeTraps.hasOwnProperty(key)) return ViewNodeTraps[key](target, source)
      return target[key]
    }
  })
}

const ASTNodeProxyTraps = {
  toRaw(target) {
    return () => target
  },
  lastTextViewNode(target, source) {
    return source.getLastTextViewNode(target)
  },
  firstTextViewNode(target, source) {
    return source.getFirstTextViewNode(target)
  },
  parentInfo(target, source) {
    return source.astNodeToParent.get(target)
  },
  parent(target, source) {
    const info = source.astNodeToParent.get(target)
    return info ? createASTNodeProxy(info.parent, source) : null
  },
  closestStatement(target, source) {
    return () => source.closestStatementFromNode(target)
  },
  nextSibling(target, source) {
    return source.getNextSiblingTextNode(target)
  },
  prevSibling(target, source) {
    return source.getPrevSiblingTextNode(target)
  },
  level(target, source) {
    return source.getLevel(target)
  },
  equal(target) {
    return (next) => target === next.toRaw()
  }
}

const ASTNodeProxyDelegateMap = [
  ['replaceWith', 'replaceAST'],
  ['append', 'appendAST'],
  ['prepend', 'prependAST'],
  ['stringifyWithSelection', 'stringifyWithSelection'],
]
ASTNodeProxyDelegateMap.forEach(([thisMethod, sourceMethod]) => {
  ASTNodeProxyTraps[thisMethod] = (target, source) => (...argv) => source[sourceMethod](target, ...argv)
})

function createASTNodeProxy(astNode, source) {
  return new Proxy(astNode, {
    get: (target, key) => {
      if (ASTNodeProxyTraps.hasOwnProperty(key)) return ASTNodeProxyTraps[key](target, source)
      if (/(^[1-9]+\d*$)|(^0$)/.test(key) && target.hasOwnProperty(key)) {
        return createASTNodeProxy(target[key], source)
      }
      return target[key]
    }
  })
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
    this.nodeRefStorage = new NodeToViewNodeStorage()
    this.astNodeToParent = new WeakMap()
    this.dirtyASTNode = new WeakSet()
    this.styleManager = styleManager
    // public
    this.createViewNodeProxy = createViewNodeProxy
  }
  generate(ast = this.root) {
    return this.generator.generate(ast, ({ parent, parentNode, node, name, vnode }) => {
      // 除了 program/file
      this.astNodeToParent.set(node, { parent, parentNode, name })

      const hijackedVnode = this.styleManager.hijack(createASTNodeProxy(node, this), vnode, this)
      hijackedVnode.ref = (ref) => {
        this.nodeRefStorage.set(node, ref)
      }
      return hijackedVnode
    })
  }
  unlink(node) {
    this.generator.walk(node, ({ node: astNode }) => {
      this.nodeRefStorage.delete(astNode)
    })
  }
  getViewNode(node) {
    return this.nodeRefStorage.get(node)
  }
  /*************************
   * public 接受的参数都是 viewNodeProxy
   **************************/
  // public
  // TODO
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
    this.dirtyASTNode.set()
  }

  stringifyWithSelection(astNode, { startContainer, endContainer, startOffset, endOffset }) {
    const lastTextViewNode = this.getLastTextViewNode(astNode)
    let current = this.getFirstTextViewNode(astNode)
    invariant(current, 'this viewNode is not node')
    const result = [[], [], []]
    let currentPosition = 0 // 0: before selection. 1: in selection. 2: after

    while(true) {
      if (!current.equal(startContainer) && !current.equal(endContainer)) {
        result[currentPosition].push(current.nodeValue)

      } else {
        if (current.equal(startContainer)) {
          result[0].push(current.nodeValue.slice(0, startOffset))
          currentPosition = 1
        }

        if (current.equal(endContainer)) {
          result[2].push(current.nodeValue.slice(endOffset))
          currentPosition = 2
        }
      }

      if (current.equal(lastTextViewNode)) break
      current = this.getNextSiblingTextNode(current.toRaw())
    }
    return [...result.map(part => part.join('')), result]
  }

  findCommonAncestorNode(startViewNodeProxy, endViewNodeProxy) {
    const result = this.findCommonAncestorNodeByNode(
      this.closestNode(startViewNodeProxy.toRaw()).toRaw(),
      this.closestNode(endViewNodeProxy.toRaw()).toRaw()
    )
    return result.map(r => createASTNodeProxy(r, this))
  }
  findCommonAncestorNodeByNode(inputStartNode, inputEndNode) {
    let startNode = inputStartNode
    let endNode = inputEndNode
    const levelDiff = this.getLevel(startNode) - this.getLevel(endNode)
    if (levelDiff > 0 ) {
      startNode = this.getAncestorByLevel(startNode, this.getLevel(endNode))
    } else if (levelDiff < 0){
      endNode = this.getAncestorByLevel(endNode, this.getLevel(startNode))
    }
    // 说明有一个是另一个的祖先
    if (startNode === endNode) return [startNode, startNode, endNode]
    if (startNode.parent === endNode.parent) return [this.astNodeToParent.get(startNode).parent, startNode, endNode]
    // 否则整体往上走一层。
    return this.findCommonAncestorNodeByNode(
      this.astNodeToParent.get(startNode).parent,
      this.astNodeToParent.get(endNode).parent,
    )
  }
  getLevel(target) {
    let level = 0
    let current = target
    while(current) {
      const parentInfo = this.astNodeToParent.get(current)
      current = parentInfo ? parentInfo.parent : null
      level ++
    }
    return level
  }
  getAncestorByLevel(start, level) {
    let current = start
    let toWalk = this.getLevel(start) - level
    while(toWalk) {
      console.log(toWalk)
      current = this.astNodeToParent.get(current).parent
      --toWalk
    }
    return current
  }

  /*************************
   * viewNode delegate 回来的方法，接受的都是 raw viewNode
   **************************/
  closestNode(viewNode) {
    invariant(viewNode, 'calling closestNode of null')
    // 先判断自己是不是
    let astNode = this.nodeRefStorage.getByValue(viewNode)
    // 再判断是不是处在 fragment 中。
    if (!astNode) {
      const fragmentRef = findAnteriorViewNode(viewNode, node => node.nodeType === VIEW_NODE_TYPE_COMMET)
      if (fragmentRef) astNode = this.nodeRefStorage.getByValue(fragmentRef)
    }
    return astNode ? createASTNodeProxy(astNode, this) : this.closestNode(viewNode.parentNode)
  }
  closestNodeOrContainer(viewNode) {
    // TODO 没有处理 fragment!!!!
    if (!viewNode) return null
    const astNode = this.nodeRefStorage.getByValue(viewNode)
    if (astNode)
    return closest(viewNode, [NODE_SELECTOR, CONTAINER_SELECTOR, ...STATEMENT_LIKE_NAMES].join(','))
  }
  closestStatement(viewNode) {
    // 一定是有的，不会到 root 都找不到。
    invariant(viewNode, 'call closestStatement from null')
    // 先判断自己是不是
    let astNode = this.nodeRefStorage.getByValue(viewNode)
    // 再判断是不是处在 fragment 中。
    if (!astNode) {
      const fragmentRef = findAnteriorViewNode(viewNode, node => node.nodeType === VIEW_NODE_TYPE_COMMET)
      if (fragmentRef) astNode = this.nodeRefStorage.getByValue(fragmentRef)
    }
    if (astNode && isStatement(astNode)) return createASTNodeProxy(astNode, this)
    // 如果有 astNode 就从 node开始找
    if (astNode) return this.closestStatementFromNode(astNode)

    return this.closestStatement(viewNode.parentNode)
  }

  /**
   * 基本都是给 ast proxy 或者内部用的方法
   */
  closestStatementFromNode(node) {
    if (isStatement(node)) return createASTNodeProxy(node, this)
    const parentInfo = this.astNodeToParent.get(node)
    if (!parentInfo) return null
    return this.closestStatementFromNode(parentInfo.parentNode)
  }
  replaceAST(originAST, nextASTNode) {
    // CAUTION 先执行 generate 再执行 append 才行，append 才会把 nextASTNode 的链接修正
    const nextViewNode = this.generate(nextASTNode)
    const { parentNode, parent, name} = this.astNodeToParent.get(originAST)
    invariant(!Array.isArray(nextASTNode), 'replace collection is not supported')
    // 重新建立链接
    if (!Array.isArray(parent)) {
      parentNode[name] = nextASTNode
    } else {
      // 如果是 collection 中， parentNode[name] === parent，用哪个操作都一样
      const originIndex = parent.indexOf(originAST)
      parent[originIndex] = nextASTNode
    }
    nextASTNode.mark = 111
    this.astNodeToParent.set(nextASTNode, { parent, name, parentNode })
    this.view.patch(this.getViewNode(originAST), nextViewNode)
    return createASTNodeProxy(nextASTNode, this)
  }
  appendAST(targetAST, nextASTNode) {
    const { parent} = this.astNodeToParent.get(targetAST)
    invariant(Array.isArray(parent), 'ast is not in collection, cannot append')
    const originIndex = parent.indexOf(targetAST)
    parent.splice(originIndex + 1, 0, nextASTNode)
    this.view.append(this.getViewNode(targetAST), this.generate(nextASTNode))
    return createASTNodeProxy(nextASTNode, this)
  }
  prependAST(targetAST, nextASTNode) {
    const { parent} = this.astNodeToParent.get(targetAST)
    invariant(Array.isArray(parent), 'ast is not in collection, cannot append')
    const originIndex = parent.indexOf(targetAST)
    parent.splice(originIndex, 1, nextASTNode)

    this.view.prepend(this.getViewNode(targetAST), this.generate(nextASTNode))
    return createASTNodeProxy(nextASTNode, this)

  }
  getFirstTextViewNode(node) {
    const viewNode = this.nodeRefStorage.get(node)
    if (Array.isArray(viewNode)) {
      return createViewNodeProxy(getFirstTextNode(viewNode[0].nextElementSibling), this)
    } else {
      return createViewNodeProxy(getFirstTextNode(viewNode), this)
    }
  }
  getLastTextViewNode(node) {
    const viewNode = this.nodeRefStorage.get(node)
    if (Array.isArray(viewNode)) {
      return createViewNodeProxy(getLastTextNode(viewNode[1].previousElementSibling), this)
    } else {
      return createViewNodeProxy(getLastTextNode(viewNode), this)
    }
  }
  stringify() {
    const viewNodeRoot = this.nodeRefStorage.get(this.root)
    let last = this.getLastTextViewNode(viewNodeRoot)
    let current = this.getFirstTextViewNode(viewNodeRoot)

    const result = []
    while(true) {
      invariant(current, 'encounter invalid chain')
      result.push(current.nodeValue)
      if (current.equal(last)) break
      current = this.getNextSiblingTextNode(current)
    }

    return this.concatWords(result)
  }

  // 内部用的
  getPrevSiblingTextNode(viewNode) {
    return this.createViewNodeProxy(getPrevSiblingTextNode(viewNode, this.nodeRefStorage.get(this.root)))
  }
  getNextSiblingTextNode(viewNode) {
    return this.createViewNodeProxy(getNextSiblingTextNode(viewNode, this.nodeRefStorage.get(this.root)))
  }


}