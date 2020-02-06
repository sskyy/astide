/** @jsx createElement */
/** @jsxFrag Fragment */
import createElement  from '../../base/render/createElement'
import { invariant } from '../../base/util';
import { VIEW_NODE_TYPE_TEXT } from './constant';

const STATEMENT_LIKE_NAMES = ['statement','declaration', 'specifier', 'definition']
const EXCLUDE_SEMICOLON_STATEMENT_TYPES = ['BlockStatement', 'IfStatement']
const NODE_SELECTOR = '[node]'

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
  constructor(ast, generator, patch) {
    this.root = ast
    this.generator = generator
    this.patch = patch
    this.nodeRefStorage = new Storage()
    this.nextSiblingChain = new WeakMap()
    this.prevSiblingChain = new WeakMap()
    this.firstTextNodeMap = new WeakMap()
    this.lastTextNodeMap = new WeakMap()
  }
  linkNode(parent, key, child) {
    // CAUTION 这是会暴露出去的 api
    child.replaceWith = (nextChild) => {
      const isArray = /\[\]$/.test(key)
      if (isArray) {
        const rawKey = key.replace(/\[\]$/, '')
        const collection = parent[rawKey]
        const prevIndex = collection.indexOf(child)
        parent[rawKey][prevIndex] = nextChild
      } else {
        parent[key] = nextChild
      }

      // 更新视图
      const newVNode = this.generate(nextChild)
      const prevViewNode = this.getViewNode(child)
      // TODO 通知外部视图更新。这里机制有问题，最后 digest 是外部控制的，但 viewNode 又都是这里处理。
      // 把 viewNode 当成一个跟外部通信的 token ?
      this.patch(prevViewNode, newVNode)

      // 清理缓存
      delete child.replaceWith
      this.unlink(child)

      return this.getViewNode(nextChild)
    }
  }
  replaceAST(viewNode, nextASTNode) {
    const originAST = this.getASTNode(viewNode)
    return originAST.replaceWith(nextASTNode)
  }
  generate(ast = this.root) {
    return this.generator.generate(ast, (parent, key, node, vnode, isCollection) => {
      this.linkNode(parent, key, node)
      vnode.props.node = true
      if (isCollection) vnode.props.isCollection = true

      /*
       boundary 怎么办？
       只有 pattern 的 boundary 是有意义的，它标志着整个结构。pattern 会被标记为 node。所以 boundary 能被选中。
       中间的部分如果是数组，会被包裹在 container 中，所以也能被选中。
       */
      //

      // 1 node 和 container 会读取 firstTextNode，用于选取某个节点，replace 要用/cmd+a 要用。这里是为 node 处理的。container 会转化为其中第一个元素的 firstTextNode
      // 2 给所有叶子节点连上 nextSibling。tab 跳转要用/stringify 要用/remove 要用。

      // TODO 这里有问题，其实只需要最上面一次统一处理一次就可以了！现在变成了递归处理
      vnode.ref = (viewNode) => {
        this.nodeRefStorage.save(node, viewNode)

        walkViewNodeLeaf(viewNode, (prev, current) => {
          if (!prev) {
            this.firstTextNodeMap.set(viewNode, current)
          } else if (!current){
            this.lastTextNodeMap.set(viewNode, prev)
          } else {
            this.nextSiblingChain.set(prev, current)
            this.prevSiblingChain.set(current, prev)
          }
        })
      }

      // 给所有 statement like 节点加上分号
      if (STATEMENT_LIKE_NAMES.includes(vnode.type) && !EXCLUDE_SEMICOLON_STATEMENT_TYPES.includes(vnode.props['data-type'])) {
        vnode.children.push(<semicolon>;</semicolon>)
      }

    })
  }
  replaceASTNode(prevAST, nextAST) {


  }
  unlink(node) {
    this.generator.walk(node, (n) => {
      this.nodeRefStorage.delete(n)
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
    let current = this.firstTextNodeMap.get(viewNodeProxy.toRaw())
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

      if (current === this.lastTextNodeMap.get(viewNodeProxy.toRaw())) break
      current = this.nextSiblingChain.get(current)
    }

    return [...result.map(i => i.join(' ')), result]
  }
  closestNode(viewNode) {
    return viewNode.closest(NODE_SELECTOR)
  }
  closestNodeOrStatement(viewNode) {
    return viewNode.closest([NODE_SELECTOR, ...STATEMENT_LIKE_NAMES].join(','))
  }
  closestStatement(viewNode) {
    return viewNode.closest(STATEMENT_LIKE_NAMES.join(','))
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
    return this.firstTextNodeMap.get(viewNode)
  }
  getLastTextNode(viewNode) {
    return this.lastTextNodeMap.get(viewNode)
  }

}