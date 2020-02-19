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
    this.dynamicStyles = {}
    // this.initialize()
  }
  initialize() {
    const layoutProxy = createLayoutProxy()
    this.rules.layout(layoutProxy)
    // 得到所有 block
    const blockSelectors = layoutProxy.getBlockSelectors()
    this.attachStaticBlocks(blockSelectors)
  }
  apply(viewNode, source) {
    // TODO 开始跑
    // this.dynamicStyles
  }

}
