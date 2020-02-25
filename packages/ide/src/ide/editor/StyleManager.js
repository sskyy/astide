import Fragment from '../../base/render/Fragment';
import createElement from '../../base/render/createElement';

function createLayoutProxy() {
  const blockSelectors = []

  return {
    query(selectors, dynamicHandler) {
      // TODO
    },
    applyBlock(selectorOrViewNode) {
      if (typeof selectorOrViewNode === 'string') {
        blockSelectors.push(selectorOrViewNode)
      } else {

      }
    },
    lengthMoreThan() {

    },
    getBlockSelectors() {
      return blockSelectors
    }
  }
}

export default class StyleManager {
  constructor(rules) {
    this.rules = rules
    const style = document.createElement('style')
    document.head.appendChild(style)
    this.sheet = style.sheet
    this.initialize()
  }
  createStyleRule(rule) {
    this.sheet.insertRule(rule)
  }
  initialize() {
    this.createStyleRule('[block] { display: block; padding-left: 2em }')
  }
  hijack(node, vnode, source) {
    const shouldBeBlock = this.rules.layout(node, vnode, source)
    let toReturn = vnode
    if (shouldBeBlock) {
      if (vnode.type === Fragment) {
        toReturn = createElement(node.type.toLowerCase(), { block: true }, ...vnode.children)
      } else {
        vnode.attributes.block = true
      }
    }

    return toReturn
  }

}
