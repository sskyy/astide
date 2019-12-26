function isRange({ startContainer, endContainer, startOffset, endOffset }) {
  return (startContainer === endContainer) && (startOffset === endOffset)
}

// TODO 好好理清楚一下需求，如果不是在 identifier 中输入，那么就是非法的。
// 如果是从合法到非法，那么需要重新 parse 成字符串，等待下一次变成合法的。
// 这里面就有性能问题了。
export default class EditingStrategy {
  constructor(parser) {
    this.parser = parser
  }
  run(inputEvent, astView) {
    // 策略
    const selection = astView.getSelection()
    if (selection.isRange()) {
      return [{}, {}]
    }



    // 当前在什么结构中

    // 1. 在 draft 中, TODO 什么时候才能确定结构？由于有 arrow function 存在，所以肯定会回溯。

    // CAUTION  下面的代码是最后的 default 方式
    // 1. 获取 statement 所有字符串
    const node = selection.closest(['statement', 'declaration'])
    const [originCode, { start: codeOffset }] = node.getCodeAndSelection(selection)
    // console.log({originCode, codeOffset})
    const code = originCode.slice(0, codeOffset) + inputEvent.data + originCode.slice(codeOffset)
    // 2. parse 成 ast
    try {
      const newNode = this.parser.parse(code)
      // 3. 合法了，返回修改要修改的 ast 的指令和新的 selection
      // TODO 可能input 一次多个字符？
      const nextOffset = codeOffset + 1
      // 替换新的结构，selection 要 restore
      return [
        { type: 'replaceASTNode', node, next: newNode },
        { type: 'restoreSelection', node: newNode, start: nextOffset, end: nextOffset}
      ]

    } catch {
      console.warn('not valid')
      // 还是非法的，那么只是替换 innerText, selection 往右移一个。
      const text = selection.startContainer.nodeValue
      const offset = selection.startOffset
      const nextOffset = offset + 1
      const nextText = text.slice(0, offset) + inputEvent.data + text.slice(offset)
      return [
        { type: 'updateViewNode', node: selection.startContainer,  next: { nodeValue: nextText }},
        { type: 'updateSelection', selection: { startOffset: nextOffset, endOffset: nextOffset}}
      ]
    }

  }
}